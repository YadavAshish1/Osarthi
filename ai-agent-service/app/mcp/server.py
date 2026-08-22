"""
Model Context Protocol (MCP) Server.
Exposes standardized MCP protocol endpoints for external agents and tool callers.
"""

from mcp.server.fastmcp import FastMCP
from app.core.config import settings

# Initialize FastMCP Server
mcp_server = FastMCP(
    name="Osarthi-MCP-Server",
    instructions="Provides administrative, educational RAG search, and Azure cloud operations tools for Osarthi.",
)


@mcp_server.tool()
async def search_curriculum(query: str, class_name: str = "", subject: str = "") -> str:
    """Semantic search over Osarthi educational curriculum."""
    from app.mcp.tools.rag_search import rag_search_curriculum
    return await rag_search_curriculum.ainvoke({"query": query, "class_name": class_name, "subject": subject})


@mcp_server.tool()
async def get_platform_metrics() -> str:
    """Get live platform statistics (users, content, open tickets)."""
    from app.mcp.tools.portal_data import portal_get_platform_metrics
    return await portal_get_platform_metrics.ainvoke({})


@mcp_server.tool()
def get_azure_vm_metrics(resource_name: str = "", metric_name: str = "Percentage CPU") -> str:
    """Fetch Azure CPU/Memory telemetry for production servers (Super Admin)."""
    from app.mcp.tools.azure_ops import azure_get_vm_metrics
    return azure_get_vm_metrics.invoke({"resource_name": resource_name, "metric_name": metric_name})


@mcp_server.tool()
def get_azure_costs(timeframe: str = "MonthToDate") -> str:
    """Fetch current Azure spend breakdown by service (Super Admin)."""
    from app.mcp.tools.azure_ops import azure_get_cost_summary
    return azure_get_cost_summary.invoke({"timeframe": timeframe})


@mcp_server.tool()
def get_azure_cost_forecast(lookahead_days: int = 30) -> str:
    """Project future Azure cloud spend over the next N days (Super Admin)."""
    from app.mcp.tools.azure_ops import azure_get_cost_forecast
    return azure_get_cost_forecast.invoke({"lookahead_days": lookahead_days})
