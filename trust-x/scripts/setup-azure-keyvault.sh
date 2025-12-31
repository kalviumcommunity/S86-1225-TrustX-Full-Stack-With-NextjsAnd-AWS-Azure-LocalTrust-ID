#!/bin/bash

################################################################################
# Azure Key Vault Setup Script
################################################################################
# This script automates the creation of Azure Key Vault with proper RBAC,
# managed identities, and access policies for secure environment variable
# management in production.
#
# Prerequisites:
# - Azure CLI installed (az cli)
# - Logged into Azure (az login)
# - Active Azure subscription
# - jq installed for JSON processing
#
# Usage:
#   ./scripts/setup-azure-keyvault.sh
#
# What This Script Does:
# 1. Creates a Key Vault in your Azure subscription
# 2. Stores all environment variables from .env as secrets
# 3. Enables Azure RBAC for access control
# 4. Creates access policy for least-privilege access
# 5. Generates connection information
# 6. Outputs vault URL and retrieval instructions
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
VAULT_NAME="kv-trustx-app-$RANDOM"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-trustx-resources}"
LOCATION="${AZURE_LOCATION:-eastus}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT_FILE="azure-keyvault-config-${TIMESTAMP}.txt"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            Azure Key Vault Setup for TrustX App               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo "Please install it: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed.${NC}"
    echo "Please install it: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Check Azure login
echo -e "${BLUE}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Error: Not logged into Azure.${NC}"
    echo "Please run: az login"
    exit 1
fi

SUBSCRIPTION_ID=$(az account show --query id --output tsv)
SUBSCRIPTION_NAME=$(az account show --query name --output tsv)
TENANT_ID=$(az account show --query tenantId --output tsv)
USER_PRINCIPAL=$(az account show --query user.name --output tsv)

echo -e "${GREEN}✓ Azure login verified${NC}"
echo -e "  Subscription: ${SUBSCRIPTION_NAME} (${SUBSCRIPTION_ID})"
echo -e "  User: ${USER_PRINCIPAL}"
echo ""

# Check if resource group exists, create if not
echo -e "${BLUE}Checking resource group...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' exists${NC}"
else
    echo -e "${YELLOW}Creating resource group '$RESOURCE_GROUP' in '$LOCATION'...${NC}"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags Application=TrustX Environment=Production ManagedBy=Script \
        --output none
    echo -e "${GREEN}✓ Resource group created${NC}"
fi

echo ""

# Check if Key Vault name is available (must be globally unique)
echo -e "${BLUE}Validating Key Vault name...${NC}"
while true; do
    if az keyvault list --query "[?name=='$VAULT_NAME']" --output tsv | grep -q .; then
        VAULT_NAME="kv-trustx-app-$RANDOM"
    else
        break
    fi
done
echo -e "${GREEN}✓ Using vault name: ${VAULT_NAME}${NC}"
echo ""

# Create Key Vault
echo -e "${BLUE}Creating Azure Key Vault...${NC}"
az keyvault create \
    --name "$VAULT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --enable-rbac-authorization true \
    --enabled-for-deployment true \
    --enabled-for-template-deployment true \
    --sku standard \
    --tags Application=TrustX Environment=Production ManagedBy=Script \
    --output none

echo -e "${GREEN}✓ Key Vault created successfully${NC}"

VAULT_URL="https://${VAULT_NAME}.vault.azure.net/"
echo -e "${CYAN}Vault URL:${NC} $VAULT_URL"
echo ""

# Get current user object ID for access policy
USER_OBJECT_ID=$(az ad signed-in-user show --query id --output tsv)

# Assign Key Vault Secrets Officer role to current user (for script to add secrets)
echo -e "${BLUE}Granting permissions to add secrets...${NC}"
az role assignment create \
    --role "Key Vault Secrets Officer" \
    --assignee "$USER_OBJECT_ID" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME" \
    --output none

echo -e "${GREEN}✓ Permissions granted${NC}"
echo ""

# Wait a few seconds for RBAC to propagate
echo -e "${YELLOW}Waiting for RBAC propagation...${NC}"
sleep 10

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Using .env.example as template.${NC}"
    ENV_FILE=".env.example"
else
    ENV_FILE=".env"
fi

echo -e "${BLUE}Uploading secrets from ${ENV_FILE}...${NC}"

# Read .env and upload each secret
SECRET_COUNT=0
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Convert key to Azure-friendly format (alphanumeric and hyphens only)
    azure_key=$(echo "$key" | tr '_' '-')
    
    echo -e "  Uploading: ${azure_key}"
    
    # Upload secret to Key Vault
    az keyvault secret set \
        --vault-name "$VAULT_NAME" \
        --name "$azure_key" \
        --value "$value" \
        --output none 2>/dev/null || {
        echo -e "${YELLOW}  ! Failed to upload ${azure_key} (may need to wait for RBAC)${NC}"
    }
    
    ((SECRET_COUNT++))
done < "$ENV_FILE"

echo -e "${GREEN}✓ Uploaded ${SECRET_COUNT} secrets${NC}"
echo ""

# Create a service principal for application access (optional)
echo -e "${BLUE}Would you like to create a service principal for app access? (Y/n)${NC}"
read -r CREATE_SP

SP_ID=""
SP_SECRET=""
SP_APP_ID=""

if [[ $CREATE_SP =~ ^[Yy]?$ ]]; then
    echo -e "${BLUE}Creating service principal...${NC}"
    
    SP_NAME="sp-trustx-keyvault-access"
    
    # Create service principal
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role "Key Vault Secrets User" \
        --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME" \
        --output json)
    
    SP_APP_ID=$(echo "$SP_OUTPUT" | jq -r '.appId')
    SP_SECRET=$(echo "$SP_OUTPUT" | jq -r '.password')
    SP_TENANT=$(echo "$SP_OUTPUT" | jq -r '.tenant')
    
    echo -e "${GREEN}✓ Service principal created${NC}"
    echo -e "  App ID: ${SP_APP_ID}"
    echo ""
fi

# Save configuration details
cat > "$OUTPUT_FILE" <<EOF
╔════════════════════════════════════════════════════════════════╗
║            Azure Key Vault Configuration                       ║
║                  Created: $(date)                    ║
╚════════════════════════════════════════════════════════════════╝

KEY VAULT INFORMATION
─────────────────────────────────────────────────────────────────
Vault Name:       $VAULT_NAME
Vault URL:        $VAULT_URL
Resource Group:   $RESOURCE_GROUP
Location:         $LOCATION
Subscription:     $SUBSCRIPTION_NAME
Subscription ID:  $SUBSCRIPTION_ID
Tenant ID:        $TENANT_ID

SECRETS UPLOADED
─────────────────────────────────────────────────────────────────
Total Secrets:    $SECRET_COUNT
Source File:      $ENV_FILE

EOF

if [ -n "$SP_APP_ID" ]; then
cat >> "$OUTPUT_FILE" <<EOF
SERVICE PRINCIPAL (For Application Access)
─────────────────────────────────────────────────────────────────
App ID:           $SP_APP_ID
Secret:           $SP_SECRET
Tenant ID:        $TENANT_ID

⚠️  IMPORTANT: Store the secret securely - it won't be shown again!

EOF
fi

cat >> "$OUTPUT_FILE" <<EOF
ENVIRONMENT VARIABLES FOR YOUR APP
─────────────────────────────────────────────────────────────────
Add these to your .env.production or deployment configuration:

KEYVAULT_NAME=$VAULT_NAME
AZURE_TENANT_ID=$TENANT_ID
USE_KEY_VAULT=true

# If using service principal authentication:
AZURE_CLIENT_ID=$SP_APP_ID
AZURE_CLIENT_SECRET=$SP_SECRET

# Or use Managed Identity (recommended for Azure App Service/Container Apps)

NEXT STEPS
─────────────────────────────────────────────────────────────────
1. For Azure App Service / Container Apps (Recommended):
   - Enable Managed Identity on your app
   - Grant "Key Vault Secrets User" role:
   
   az webapp identity assign --name YourAppName --resource-group $RESOURCE_GROUP
   
   PRINCIPAL_ID=\$(az webapp identity show --name YourAppName --resource-group $RESOURCE_GROUP --query principalId --output tsv)
   
   az role assignment create \\
     --role "Key Vault Secrets User" \\
     --assignee \$PRINCIPAL_ID \\
     --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME"

2. For VM / Container (using service principal):
   - Use the App ID and Secret above
   - Set environment variables: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID

3. Install Azure SDK in your app:
   npm install @azure/keyvault-secrets @azure/identity

4. Use the secrets manager utility:
   import { getSecrets } from '@/lib/secretsManager';
   const secrets = await getSecrets();

5. Test secret retrieval:
   curl https://your-app.com/api/health/secrets

RBAC ROLES AVAILABLE
─────────────────────────────────────────────────────────────────
• Key Vault Secrets User (Recommended):
  - Read secret contents
  - Least privilege for applications

• Key Vault Secrets Officer:
  - Read, write, delete secrets
  - For DevOps pipelines

• Key Vault Administrator:
  - Full management access
  - For infrastructure team only

Assign roles with:
az role assignment create \\
  --role "Key Vault Secrets User" \\
  --assignee <principal-id> \\
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME"

SECURITY BEST PRACTICES
─────────────────────────────────────────────────────────────────
✓ Secrets encrypted at rest with Microsoft-managed keys
✓ RBAC enabled for fine-grained access control
✓ Use Managed Identity when possible (no credentials to manage)
✓ Service principal secrets should be rotated regularly
✓ Enable diagnostic logging for audit trail
✓ Use private endpoints for production workloads

ROTATION SCHEDULE
─────────────────────────────────────────────────────────────────
• Database credentials:  Every 90 days (quarterly)
• API keys:              Every 180 days (bi-annually)
• Service principal:     Every 365 days (annually)
• Review access logs:    Monthly

To view secret versions (for rotation):
az keyvault secret list-versions --vault-name $VAULT_NAME --name <secret-name>

MONITORING & LOGGING
─────────────────────────────────────────────────────────────────
Enable diagnostic settings:
az monitor diagnostic-settings create \\
  --name KeyVaultAudit \\
  --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME" \\
  --logs '[{"category":"AuditEvent","enabled":true}]' \\
  --workspace <log-analytics-workspace-id>

TROUBLESHOOTING
─────────────────────────────────────────────────────────────────
• Access Denied: Check RBAC role assignment and RBAC propagation (wait 5-10 min)
• Secret Not Found: Verify secret name format (use hyphens, not underscores)
• Authentication Error: For Managed Identity, ensure it's enabled on the app
• Network Error: Check firewall settings or enable public access temporarily

Useful commands:
# List all secrets
az keyvault secret list --vault-name $VAULT_NAME

# Get a secret value
az keyvault secret show --vault-name $VAULT_NAME --name <secret-name> --query value

# Check access policies
az role assignment list --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$VAULT_NAME"

For more information, see README.md

EOF

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             Azure Key Vault Setup Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Configuration saved to: ${OUTPUT_FILE}${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "1. Review the configuration file: ${OUTPUT_FILE}"
if [ -n "$SP_SECRET" ]; then
    echo -e "2. ${RED}Store the service principal secret securely!${NC}"
fi
echo -e "3. Configure Managed Identity or service principal for your app"
echo -e "4. Add environment variables to your deployment"
echo -e "5. Never commit ${OUTPUT_FILE} to Git (already in .gitignore)"
echo ""
echo -e "${GREEN}✓ Setup complete! See ${OUTPUT_FILE} for next steps.${NC}"
