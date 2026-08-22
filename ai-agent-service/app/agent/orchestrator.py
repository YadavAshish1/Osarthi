"""
Agentic ReAct Orchestrator Engine using LangGraph.
Executes multi-step reasoning, tool execution, and token streaming with resilience and dynamic sequencing.
Credentials are strictly managed via server environment variables (.env).
"""

from typing import AsyncIterator, List, Optional
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from app.core.config import settings
from app.core.logger import logger
from app.core.security import AuthenticatedUser
from app.llm.factory import llm_factory
from app.mcp.registry import tool_registry
from app.agent.prompts import resolve_system_prompt_for_role


class AgentOrchestrator:
    """Orchestrates LangGraph ReAct execution for an authenticated user."""

    async def astream_agent_response(
        self,
        user: AuthenticatedUser,
        messages: List[BaseMessage],
        preferred_provider: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Stream agent response tokens and tool execution notifications via async iterator.
        Respects dynamic provider sequencing configured in Admin Portal and cascades automatically.
        """
        # 1. Resolve permissible tools & system prompt for user role
        tools = tool_registry.get_tools_for_user(user)
        system_prompt = resolve_system_prompt_for_role(user.role)

        # 2. Fetch dynamic AI settings and user details from MongoDB
        db_settings = None
        db_providers = {}
        user_context_str = f"\n\n--- Current Authenticated User Context ---\nUser ID: {user.user_id}\nRole: {user.role}"
        if user.email:
            user_context_str += f"\nEmail: {user.email}"

        try:
            from bson import ObjectId
            from app.core.database import get_mongo_db
            db = get_mongo_db()
            if ObjectId.is_valid(user.user_id):
                user_doc = await db["users"].find_one({"_id": ObjectId(user.user_id)})
                if user_doc:
                    name = user_doc.get("name")
                    if name:
                        user_context_str += f"\nName: {name}"
                    class_id = user_doc.get("classRef")
                    if class_id:
                        class_doc = await db["classes"].find_one({"_id": class_id})
                        if class_doc:
                            user_context_str += f"\nClass/Grade: {class_doc.get('name')}"
            db_settings = await db["aisettings"].find_one({})
            if db_settings:
                db_providers = db_settings.get("providers", {})
        except Exception as e:
            logger.warning(f"Could not load user or aisettings from DB: {e}")

        full_system_prompt = system_prompt + user_context_str
        full_message_chain = [SystemMessage(content=full_system_prompt)] + messages

        default_provider = (db_settings.get("defaultProvider") if db_settings else None) or settings.default_llm_provider
        fallback_seq = (db_settings.get("fallbackSequence") if db_settings else None) or ["azure_openai", "gemini", "openai"]

        # Ensure active provider order
        primary_provider = preferred_provider or default_provider
        ordered_providers = [primary_provider] + [p for p in fallback_seq if p != primary_provider]

        # Add remaining known providers if missing
        for p in ["azure_openai", "gemini", "openai"]:
            if p not in ordered_providers:
                ordered_providers.append(p)

        # Gemini sub-models for resilient fallback
        gemini_submodels = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
        
        candidate_configs = []
        for prov in ordered_providers:
            # Check if explicitly disabled in DB settings
            prov_conf = db_providers.get(prov, {})
            is_enabled = prov_conf.get("enabled", True) if prov_conf else True

            if not is_enabled and prov == primary_provider:
                # If primary is explicitly disabled, proceed to next
                continue

            if prov == "azure_openai":
                azure_provider = llm_factory.get_provider("azure_openai")
                if azure_provider.is_configured():
                    candidate_configs.append(("azure_openai", None))
            elif prov == "gemini":
                gemini_provider = llm_factory.get_provider("gemini")
                if gemini_provider.is_configured():
                    for gm in gemini_submodels:
                        candidate_configs.append(("gemini", gm))
            elif prov == "openai":
                openai_provider = llm_factory.get_provider("openai")
                if openai_provider.is_configured():
                    candidate_configs.append(("openai", None))

        # Absolute safety net: Always ensure Gemini models are in candidate list if configured
        gemini_provider = llm_factory.get_provider("gemini")
        if gemini_provider.is_configured():
            for gm in gemini_submodels:
                if ("gemini", gm) not in candidate_configs:
                    candidate_configs.append(("gemini", gm))

        last_error = None

        for provider_id, sub_model in candidate_configs:
            try:
                # Instantiate chat model (strictly using server-side .env credentials)
                if provider_id == "gemini":
                    chat_model = gemini_provider.get_chat_model(
                        streaming=True,
                        model_name=sub_model,
                    )
                elif provider_id == "azure_openai":
                    azure_provider = llm_factory.get_provider("azure_openai")
                    chat_model = azure_provider.get_chat_model(streaming=True)
                elif provider_id == "openai":
                    openai_provider = llm_factory.get_provider("openai")
                    chat_model = openai_provider.get_chat_model(streaming=True)
                else:
                    continue

                # Construct ReAct agent graph
                agent_executor = create_react_agent(
                    model=chat_model,
                    tools=tools,
                )

                tokens_yielded = 0
                async for event in agent_executor.astream_events(
                    {"messages": full_message_chain},
                    version="v2",
                ):
                    event_type = event.get("event", "")

                    # Token stream from chat model
                    if event_type == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        if chunk and hasattr(chunk, "content") and chunk.content:
                            if isinstance(chunk.content, str):
                                tokens_yielded += 1
                                yield chunk.content
                            elif isinstance(chunk.content, list):
                                for part in chunk.content:
                                    if isinstance(part, dict) and part.get("type") == "text":
                                        text_val = part.get("text", "")
                                        if text_val:
                                            tokens_yielded += 1
                                            yield text_val
                                    elif isinstance(part, str) and part:
                                        tokens_yielded += 1
                                        yield part

                    # Diagnostic logging for tool invocations
                    elif event_type == "on_tool_start":
                        tool_name = event.get("name", "tool")
                        logger.info(f"User {user.user_id} ({user.role}) -> Executing tool: {tool_name}")

                    elif event_type == "on_tool_end":
                        tool_name = event.get("name", "tool")
                        logger.info(f"Tool {tool_name} completed execution")

                # If tokens were yielded successfully, complete stream
                if tokens_yielded > 0:
                    return

            except Exception as err:
                error_msg = str(err)
                logger.warning(f"Provider '{provider_id}' ({sub_model}) failed: {error_msg[:120]}. Trying fallback...")
                last_error = err
                continue

        # If all candidate configurations failed
        logger.error(f"Agent stream orchestration error across all candidates: {last_error}", exc_info=True)
        yield f"\n\n❌ Agent Error: {str(last_error)}"


agent_orchestrator = AgentOrchestrator()
