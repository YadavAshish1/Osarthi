"""
MCP Tool Catalog and Security-Gated Policy Resolver.
"""

from typing import List
from langchain_core.tools import BaseTool

from app.core.security import AuthenticatedUser
from app.mcp.tools.azure_ops import (
    azure_get_vm_metrics,
    azure_get_cost_summary,
    azure_get_cost_forecast,
    azure_get_app_service_status,
)
from app.mcp.tools.portal_data import (
    portal_get_platform_metrics,
    portal_get_student_progress,
    portal_get_teacher_studio_stats,
    portal_get_taxonomy_categories,
    portal_get_portal_guide,
    portal_search_teachers_or_courses,
    portal_summarize_support_tickets,
)
from app.mcp.tools.rag_search import rag_search_curriculum


class ToolRegistry:
    """Centralized catalog for all available MCP tools with RBAC enforcement."""

    def __init__(self):
        self._all_tools: List[BaseTool] = [
            rag_search_curriculum,
            portal_search_teachers_or_courses,
            portal_get_student_progress,
            portal_get_teacher_studio_stats,
            portal_get_taxonomy_categories,
            portal_get_portal_guide,
            portal_get_platform_metrics,
            portal_summarize_support_tickets,
            azure_get_vm_metrics,
            azure_get_cost_summary,
            azure_get_cost_forecast,
            azure_get_app_service_status,
        ]

    def get_tools_for_user(self, user: AuthenticatedUser) -> List[BaseTool]:
        """
        Resolve permissible tools based strictly on the user's role.
        """
        # Base tools available to all authenticated users
        base_tools = [
            rag_search_curriculum,
            portal_search_teachers_or_courses,
            portal_get_taxonomy_categories,
            portal_get_portal_guide,
        ]

        if user.role == "student":
            return base_tools + [portal_get_student_progress]

        if user.role == "teacher":
            return base_tools + [portal_get_student_progress, portal_get_teacher_studio_stats]

        if user.role == "admin":
            return base_tools + [
                portal_get_platform_metrics,
                portal_get_student_progress,
                portal_get_teacher_studio_stats,
                portal_summarize_support_tickets,
            ]

        if user.role == "super_admin":
            # Super admin gets all tools including Azure Cloud Ops
            return self._all_tools

        return base_tools


tool_registry = ToolRegistry()
