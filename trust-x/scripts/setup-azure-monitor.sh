#!/bin/bash

# Azure Monitor Setup Script
# Configures Application Insights, Log Analytics, and Alerts

set -e

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-trustx-rg}"
APP_SERVICE_NAME="${APP_SERVICE_NAME:-trustx-app}"
LOCATION="${LOCATION:-eastus}"
LOG_ANALYTICS_WORKSPACE="${LOG_ANALYTICS_WORKSPACE:-trustx-logs}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-trustx-insights}"
ACTION_GROUP_NAME="${ACTION_GROUP_NAME:-trustx-alerts}"
EMAIL_ADDRESS="${EMAIL_ADDRESS:-admin@example.com}"

echo "🔧 Setting up Azure Monitor and Application Insights..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"

# Step 1: Create Log Analytics Workspace
echo ""
echo "📝 Step 1: Creating Log Analytics Workspace..."
az monitor log-analytics workspace create \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_WORKSPACE" \
  --location "$LOCATION" \
  --retention-time 30

WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_WORKSPACE" \
  --query customerId -o tsv)

echo "✅ Log Analytics Workspace created: $WORKSPACE_ID"

# Step 2: Create Application Insights
echo ""
echo "📊 Step 2: Creating Application Insights..."
az monitor app-insights component create \
  --app "$APP_INSIGHTS_NAME" \
  --location "$LOCATION" \
  --resource-group "$RESOURCE_GROUP" \
  --workspace "$WORKSPACE_ID" \
  --application-type web

INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query instrumentationKey -o tsv)

CONNECTION_STRING=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query connectionString -o tsv)

echo "✅ Application Insights created"
echo "   Instrumentation Key: $INSTRUMENTATION_KEY"

# Step 3: Link App Service to Application Insights
echo ""
echo "🔗 Step 3: Linking App Service to Application Insights..."
az webapp config appsettings set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$CONNECTION_STRING" \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"

echo "✅ App Service linked to Application Insights"

# Step 4: Enable Diagnostic Settings
echo ""
echo "🔍 Step 4: Enabling Diagnostic Settings..."
az monitor diagnostic-settings create \
  --name "trustx-diagnostics" \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --workspace "$WORKSPACE_ID" \
  --logs '[
    {
      "category": "AppServiceConsoleLogs",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 30}
    },
    {
      "category": "AppServiceHTTPLogs",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 30}
    },
    {
      "category": "AppServiceAppLogs",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 30}
    }
  ]' \
  --metrics '[
    {
      "category": "AllMetrics",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 30}
    }
  ]'

echo "✅ Diagnostic settings configured"

# Step 5: Create Action Group for Alerts
echo ""
echo "🚨 Step 5: Creating Action Group for Alerts..."
az monitor action-group create \
  --name "$ACTION_GROUP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --short-name "TrustX" \
  --email-receiver name=admin email="$EMAIL_ADDRESS"

echo "✅ Action Group created"

# Step 6: Create Metric Alerts
echo ""
echo "📈 Step 6: Creating Metric Alerts..."

# High Error Rate Alert
az monitor metrics alert create \
  --name "TrustX-HighErrorRate" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "$ACTION_GROUP_NAME" \
  --description "Alert when error rate exceeds 10 in 5 minutes"

echo "✅ HighErrorRate alert created"

# High Response Time Alert
az monitor metrics alert create \
  --name "TrustX-HighResponseTime" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME" \
  --condition "avg requests/duration > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "$ACTION_GROUP_NAME" \
  --description "Alert when average response time exceeds 2 seconds"

echo "✅ HighResponseTime alert created"

# High CPU Alert
az monitor metrics alert create \
  --name "TrustX-HighCPU" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_SERVICE_NAME" \
  --condition "avg CpuPercentage > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "$ACTION_GROUP_NAME" \
  --description "Alert when CPU usage exceeds 80%"

echo "✅ HighCPU alert created"

# Step 7: Summary
echo ""
echo "✨ Azure Monitor Setup Complete!"
echo ""
echo "📊 View Application Insights:"
echo "   https://portal.azure.com/#resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME/overview"
echo ""
echo "📝 Useful Kusto Queries:"
echo ""
echo "# All errors in last hour:"
echo "AppServiceConsoleLogs"
echo "| where TimeGenerated > ago(1h)"
echo "| where Level == \"Error\""
echo "| project TimeGenerated, Message, RequestId"
echo "| order by TimeGenerated desc"
echo ""
echo "# Slow API requests (>1s):"
echo "AppServiceHTTPLogs"
echo "| where TimeGenerated > ago(1h)"
echo "| where TimeTaken > 1000"
echo "| project TimeGenerated, CsUriStem, TimeTaken, ScStatus"
echo "| order by TimeTaken desc"
echo ""
echo "# Failed login attempts:"
echo "AppServiceConsoleLogs"
echo "| where TimeGenerated > ago(1h)"
echo "| where Message contains \"login_failed\""
echo "| project TimeGenerated, Message"
echo "| order by TimeGenerated desc"
echo ""
echo "🔑 Application Insights Connection String:"
echo "   Add to your .env.production:"
echo "   APPLICATIONINSIGHTS_CONNECTION_STRING=\"$CONNECTION_STRING\""
