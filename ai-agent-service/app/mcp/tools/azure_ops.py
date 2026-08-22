"""
Azure Cloud Infrastructure & Cost Management MCP Tools.
Exclusively restricted to Super Administrators.
"""

from datetime import datetime, timedelta, timezone
from langchain_core.tools import tool

from app.core.config import settings
from app.core.logger import logger


def _get_azure_credentials():
    """Retrieve Azure Managed Identity or Secret credentials."""
    from azure.identity import DefaultAzureCredential, ClientSecretCredential

    if settings.azure_client_id and settings.azure_client_secret and settings.azure_tenant_id:
        return ClientSecretCredential(
            tenant_id=settings.azure_tenant_id,
            client_id=settings.azure_client_id,
            client_secret=settings.azure_client_secret,
        )
    return DefaultAzureCredential()


@tool
def azure_get_vm_metrics(
    resource_name: str = "",
    metric_name: str = "Percentage CPU",
    timespan_hours: int = 1,
) -> str:
    """
    Fetch Azure Monitor telemetry metrics (CPU utilization, memory) for production servers.
    Requires Super Admin access.
    """
    if not settings.is_azure_ops_configured:
        return "⚠️ Azure Infrastructure is not configured. Set AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP."

    try:
        from azure.mgmt.monitor import MonitorManagementClient

        credential = _get_azure_credentials()
        client = MonitorManagementClient(credential, settings.azure_subscription_id)

        target_name = resource_name or "osarthi-prod"
        resource_uri = (
            f"/subscriptions/{settings.azure_subscription_id}"
            f"/resourceGroups/{settings.azure_resource_group}"
            f"/providers/Microsoft.Web/sites/{target_name}"
        )

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=timespan_hours)
        timespan = f"{start_time.isoformat()}/{end_time.isoformat()}"

        metrics_data = client.metrics.list(
            resource_uri=resource_uri,
            metricnames=metric_name,
            timespan=timespan,
            interval="PT5M",
            aggregation="Average",
        )

        output = []
        for metric in metrics_data.value:
            output.append(f"📊 **Metric: {metric.name.localized_value}** (Resource: {target_name})")
            for series in metric.timeseries:
                for point in series.data[-6:]:
                    if point.average is not None:
                        output.append(f"  • {point.time_stamp.strftime('%H:%M UTC')}: {point.average:.2f}%")

        return "\n".join(output) if output else f"No data found for metric '{metric_name}' on resource {target_name}"

    except Exception as err:
        logger.error(f"Azure Monitor Metric fetch error: {err}")
        return f"❌ Error querying Azure Monitor metrics: {str(err)}"


@tool
def azure_get_cost_summary(timeframe: str = "MonthToDate") -> str:
    """
    Fetch Azure Cost Management expenditure summary broken down by service.
    Requires Super Admin access.
    """
    if not settings.is_azure_ops_configured:
        return "⚠️ Azure Cost Management is not configured."

    try:
        from azure.mgmt.costmanagement import CostManagementClient
        from azure.mgmt.costmanagement.models import (
            QueryDefinition,
            QueryDataset,
            QueryAggregation,
            QueryGrouping,
        )

        credential = _get_azure_credentials()
        client = CostManagementClient(credential)
        scope = f"/subscriptions/{settings.azure_subscription_id}"

        query = QueryDefinition(
            type="ActualCost",
            timeframe=timeframe,
            dataset=QueryDataset(
                granularity="None",
                aggregation={"totalCost": QueryAggregation(name="Cost", function="Sum")},
                grouping=[QueryGrouping(type="Dimension", name="ServiceName")],
            ),
        )

        result = client.query.usage(scope=scope, parameters=query)
        if not result.rows:
            return f"No cost records found for timeframe '{timeframe}'"

        lines = [f"💰 **Azure Cloud Cost Breakdown ({timeframe})**\n"]
        total_sum = 0.0
        sorted_rows = sorted(result.rows, key=lambda r: -float(r[0]))

        for row in sorted_rows:
            amount = float(row[0])
            currency = row[1] if len(row) > 1 else "USD"
            service_name = row[2] if len(row) > 2 else "Unknown Resource"
            total_sum += amount
            if amount > 0.01:
                lines.append(f"  • **{service_name}**: ${amount:.2f} {currency}")

        lines.insert(1, f"  **Total Spend: ${total_sum:.2f}**\n")
        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Azure Cost query error: {err}")
        return f"❌ Error querying Azure Cost API: {str(err)}"


@tool
def azure_get_cost_forecast(lookahead_days: int = 30) -> str:
    """
    Generate future cloud cost forecasting and projected spend over the next N days.
    Requires Super Admin access.
    """
    if not settings.is_azure_ops_configured:
        return "⚠️ Azure Cost Management is not configured."

    try:
        from azure.mgmt.costmanagement import CostManagementClient
        from azure.mgmt.costmanagement.models import (
            ForecastDefinition,
            ForecastDataset,
            ForecastAggregation,
            ForecastTimePeriod,
        )

        credential = _get_azure_credentials()
        client = CostManagementClient(credential)
        scope = f"/subscriptions/{settings.azure_subscription_id}"

        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=lookahead_days)

        forecast_def = ForecastDefinition(
            type="ActualCost",
            timeframe="Custom",
            time_period=ForecastTimePeriod(from_property=start_date, to=end_date),
            dataset=ForecastDataset(
                granularity="Daily",
                aggregation={"totalCost": ForecastAggregation(name="Cost", function="Sum")},
            ),
        )

        result = client.forecast.usage(scope=scope, parameters=forecast_def)
        if not result.rows:
            return "No cost forecast models available currently."

        lines = [f"📈 **Azure Cost Forecast (Next {lookahead_days} Days Projection)**\n"]
        total_projected = sum(float(r[0]) for r in result.rows)

        lines.append(f"  **Projected Total Spend: ${total_projected:.2f}**\n")
        lines.append("**Daily Estimates Sample:**")
        for row in result.rows[:7]:
            cost = float(row[0])
            date_str = str(row[1]) if len(row) > 1 else "Date"
            lines.append(f"  • {date_str}: ${cost:.2f}")

        return "\n".join(lines)

    except Exception as err:
        logger.error(f"Azure Forecast error: {err}")
        return f"❌ Error querying Azure Cost Forecast: {str(err)}"


@tool
def azure_get_app_service_status() -> str:
    """
    Check operational health, status, and hostnames of all Azure App Services / Container Apps.
    Requires Super Admin access.
    """
    if not settings.is_azure_ops_configured:
        return "⚠️ Azure Web Management is not configured."

    try:
        from azure.mgmt.web import WebSiteManagementClient

        credential = _get_azure_credentials()
        client = WebSiteManagementClient(credential, settings.azure_subscription_id)

        apps = client.web_apps.list_by_resource_group(settings.azure_resource_group)
        lines = [f"🖥️ **Azure Production App Services ({settings.azure_resource_group})**\n"]
        found = 0

        for app in apps:
            status_indicator = "🟢 Running" if app.state == "Running" else f"🔴 {app.state}"
            lines.append(f"  • **{app.name}**: {status_indicator}")
            lines.append(f"    URL: `https://{app.default_host_name}` | OS: {app.kind}")
            found += 1

        return "\n".join(lines) if found > 0 else "No active Azure App Services found in this resource group."

    except Exception as err:
        logger.error(f"Azure App Service health query error: {err}")
        return f"❌ Error checking App Service status: {str(err)}"
