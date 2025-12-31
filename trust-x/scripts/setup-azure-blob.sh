#!/bin/bash

# =============================================================================
# Azure Blob Storage Setup Script
# =============================================================================
# This script helps you create and configure Azure Blob Storage for secure
# file uploads and downloads with proper access control and security settings.
#
# Prerequisites:
# - Azure CLI installed (az --version)
# - Logged in to Azure (az login)
# - jq installed for JSON parsing (sudo apt-get install jq or brew install jq)
# - Appropriate Azure subscription and permissions
#
# Usage:
#   chmod +x scripts/setup-azure-blob.sh
#   ./scripts/setup-azure-blob.sh
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables (Customize these)
RESOURCE_GROUP="${RESOURCE_GROUP:-trustx-storage-rg}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-trustxstorage$(date +%s)}"
CONTAINER_NAME="${CONTAINER_NAME:-uploads}"
LOCATION="${LOCATION:-eastus}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Azure Blob Storage Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Verify Azure login
echo -e "\n${BLUE}Step 1: Verifying Azure login...${NC}"
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Run 'az login' first."
    exit 1
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
print_status "Logged in to Azure"
echo "  Subscription: ${SUBSCRIPTION_NAME}"
echo "  ID: ${SUBSCRIPTION_ID}"

# Create resource group
echo -e "\n${BLUE}Step 2: Creating resource group...${NC}"
echo "  Name: ${RESOURCE_GROUP}"
echo "  Location: ${LOCATION}"

if az group show --name "${RESOURCE_GROUP}" &> /dev/null; then
    print_warning "Resource group ${RESOURCE_GROUP} already exists"
else
    az group create \
        --name "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --tags Project=TrustX Purpose=Storage \
        --output none
    print_status "Resource group created: ${RESOURCE_GROUP}"
fi

# Create storage account
echo -e "\n${BLUE}Step 3: Creating storage account...${NC}"
echo "  Name: ${STORAGE_ACCOUNT}"
echo "  SKU: Standard_LRS"
echo "  Kind: StorageV2"

# Storage account names must be lowercase and 3-24 characters
STORAGE_ACCOUNT=$(echo "${STORAGE_ACCOUNT}" | tr '[:upper:]' '[:lower:]')

if az storage account show --name "${STORAGE_ACCOUNT}" --resource-group "${RESOURCE_GROUP}" &> /dev/null; then
    print_warning "Storage account ${STORAGE_ACCOUNT} already exists"
else
    az storage account create \
        --name "${STORAGE_ACCOUNT}" \
        --resource-group "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --access-tier Hot \
        --https-only true \
        --min-tls-version TLS1_2 \
        --allow-blob-public-access false \
        --tags Project=TrustX Purpose=FileStorage \
        --output none
    print_status "Storage account created: ${STORAGE_ACCOUNT}"
fi

# Enable blob versioning
echo -e "\n${BLUE}Step 4: Configuring storage security...${NC}"
az storage account blob-service-properties update \
    --account-name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --enable-versioning true \
    --output none

print_status "Blob versioning enabled"

# Enable soft delete for blobs (7 days retention)
az storage account blob-service-properties update \
    --account-name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --enable-delete-retention true \
    --delete-retention-days 7 \
    --output none

print_status "Soft delete enabled (7 days retention)"

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
    --resource-group "${RESOURCE_GROUP}" \
    --account-name "${STORAGE_ACCOUNT}" \
    --query '[0].value' -o tsv)

# Create container
echo -e "\n${BLUE}Step 5: Creating blob container...${NC}"
echo "  Container: ${CONTAINER_NAME}"
echo "  Access: Private (no anonymous access)"

if az storage container show \
    --name "${CONTAINER_NAME}" \
    --account-name "${STORAGE_ACCOUNT}" \
    --account-key "${STORAGE_KEY}" &> /dev/null; then
    print_warning "Container ${CONTAINER_NAME} already exists"
else
    az storage container create \
        --name "${CONTAINER_NAME}" \
        --account-name "${STORAGE_ACCOUNT}" \
        --account-key "${STORAGE_KEY}" \
        --public-access off \
        --output none
    print_status "Container created: ${CONTAINER_NAME}"
fi

# Configure CORS for browser uploads
echo -e "\n${BLUE}Step 6: Configuring CORS for browser uploads...${NC}"
az storage cors add \
    --services b \
    --methods GET PUT POST DELETE \
    --origins "http://localhost:3000" "http://localhost:3001" \
    --allowed-headers "*" \
    --exposed-headers "*" \
    --max-age 3600 \
    --account-name "${STORAGE_ACCOUNT}" \
    --account-key "${STORAGE_KEY}" \
    --output none

print_status "CORS configured for localhost (update for production)"

# Configure lifecycle management (auto-delete temp files after 30 days)
echo -e "\n${BLUE}Step 7: Setting up lifecycle policies...${NC}"
POLICY_FILE=$(mktemp)
cat > "${POLICY_FILE}" << 'EOF'
{
  "rules": [
    {
      "enabled": true,
      "name": "DeleteTempFilesAfter30Days",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 30
            }
          }
        },
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["temp/"]
        }
      }
    },
    {
      "enabled": true,
      "name": "MoveToCoolAfter90Days",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        },
        "filters": {
          "blobTypes": ["blockBlob"]
        }
      }
    }
  ]
}
EOF

az storage account management-policy create \
    --account-name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --policy "@${POLICY_FILE}" \
    --output none

rm "${POLICY_FILE}"

print_status "Lifecycle policies configured"
print_warning "  - Temp files (temp/*) deleted after 30 days"
print_warning "  - Files moved to Cool tier after 90 days"

# Generate connection string
echo -e "\n${BLUE}Step 8: Generating connection string...${NC}"
CONNECTION_STRING=$(az storage account show-connection-string \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query connectionString -o tsv)

print_status "Connection string generated"

# Generate SAS token (valid for 1 year)
echo -e "\n${BLUE}Step 9: Generating SAS token...${NC}"
EXPIRY_DATE=$(date -u -d "+1 year" '+%Y-%m-%dT%H:%MZ' 2>/dev/null || date -u -v+1y '+%Y-%m-%dT%H:%MZ')

SAS_TOKEN=$(az storage account generate-sas \
    --account-name "${STORAGE_ACCOUNT}" \
    --account-key "${STORAGE_KEY}" \
    --services b \
    --resource-types sco \
    --permissions rwdlac \
    --expiry "${EXPIRY_DATE}" \
    --https-only \
    --output tsv)

print_status "SAS token generated (valid until ${EXPIRY_DATE})"
print_warning "Remember to rotate this token before expiry!"

# Get storage account endpoint
BLOB_ENDPOINT=$(az storage account show \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query primaryEndpoints.blob -o tsv)

# Save credentials to a secure file
CREDENTIALS_FILE="azure-blob-credentials-$(date +%Y%m%d-%H%M%S).txt"
cat > "$CREDENTIALS_FILE" << EOF
# =============================================================================
# Azure Blob Storage Credentials
# Generated: $(date)
# =============================================================================

# Storage Account Information
AZURE_STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT}
AZURE_STORAGE_CONTAINER_NAME=${CONTAINER_NAME}
AZURE_STORAGE_RESOURCE_GROUP=${RESOURCE_GROUP}
AZURE_STORAGE_LOCATION=${LOCATION}

# Endpoints
AZURE_STORAGE_BLOB_ENDPOINT=${BLOB_ENDPOINT}
AZURE_STORAGE_CONTAINER_URL=${BLOB_ENDPOINT}${CONTAINER_NAME}

# Access Keys (KEEP SECURE!)
AZURE_STORAGE_ACCOUNT_KEY=${STORAGE_KEY}
AZURE_STORAGE_SAS_TOKEN=${SAS_TOKEN}
AZURE_STORAGE_CONNECTION_STRING="${CONNECTION_STRING}"

# SAS Token Expiry
SAS_TOKEN_EXPIRY=${EXPIRY_DATE}

# Environment Variables for .env.local
AZURE_STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT}"
AZURE_STORAGE_CONTAINER_NAME="${CONTAINER_NAME}"
AZURE_STORAGE_ACCOUNT_KEY="${STORAGE_KEY}"
AZURE_STORAGE_CONNECTION_STRING="${CONNECTION_STRING}"

# =============================================================================
# Next Steps:
# =============================================================================
# 1. Copy the environment variables to your .env.local file
# 2. Install Azure SDK: npm install @azure/storage-blob
# 3. Update CORS origins for production domains
# 4. Test file upload: npm run test:upload
# 5. SECURE THIS FILE! Add to .gitignore if not already
# =============================================================================

# Azure CLI Commands
# ------------------
# List containers: az storage container list --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY}
# List blobs: az storage blob list --container-name ${CONTAINER_NAME} --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY}
# Upload file: az storage blob upload --file file.txt --container-name ${CONTAINER_NAME} --name file.txt --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY}
# Download file: az storage blob download --container-name ${CONTAINER_NAME} --name file.txt --file file.txt --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY}
# Delete file: az storage blob delete --container-name ${CONTAINER_NAME} --name file.txt --account-name ${STORAGE_ACCOUNT} --account-key ${STORAGE_KEY}

# Azure Portal URLs
# -----------------
# Storage Account: https://portal.azure.com/#@/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT}
# Container: ${BLOB_ENDPOINT}${CONTAINER_NAME}
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Azure Blob Storage Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

print_status "Credentials saved to: ${CREDENTIALS_FILE}"
print_warning "IMPORTANT: Keep this file secure and add it to .gitignore!"

echo -e "\n${BLUE}Your Azure Blob Storage Configuration:${NC}"
echo "  Storage Account: ${STORAGE_ACCOUNT}"
echo "  Container: ${CONTAINER_NAME}"
echo "  Resource Group: ${RESOURCE_GROUP}"
echo "  Location: ${LOCATION}"
echo "  Blob Endpoint: ${BLOB_ENDPOINT}"

echo -e "\n${BLUE}Environment Variables (add to .env.local):${NC}"
echo -e "${YELLOW}AZURE_STORAGE_ACCOUNT_NAME=\"${STORAGE_ACCOUNT}\"${NC}"
echo -e "${YELLOW}AZURE_STORAGE_CONTAINER_NAME=\"${CONTAINER_NAME}\"${NC}"
echo -e "${YELLOW}AZURE_STORAGE_ACCOUNT_KEY=\"${STORAGE_KEY}\"${NC}"
echo -e "${YELLOW}AZURE_STORAGE_CONNECTION_STRING=\"${CONNECTION_STRING}\"${NC}"

echo -e "\n${BLUE}Quick Start Commands:${NC}"
echo "  1. Install SDK:       npm install @azure/storage-blob"
echo "  2. Add env vars:      cat ${CREDENTIALS_FILE} >> .env.local"
echo "  3. Test upload:       npm run test:upload"
echo "  4. View portal:       https://portal.azure.com/#@/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT}"

echo -e "\n${YELLOW}Security Best Practices:${NC}"
echo "  • Container is private by default (no anonymous access)"
echo "  • HTTPS-only access enforced"
echo "  • TLS 1.2 minimum version required"
echo "  • Blob versioning enabled"
echo "  • Soft delete enabled (7 days)"
echo "  • Use SAS tokens with minimal permissions"
echo "  • Rotate SAS tokens before expiry (${EXPIRY_DATE})"
echo "  • Update CORS origins for production"

echo -e "\n${YELLOW}Cost Optimization:${NC}"
echo "  • Hot tier: \$0.0184/GB/month (frequent access)"
echo "  • Cool tier: \$0.01/GB/month (auto-transition after 90 days)"
echo "  • Temp files deleted after 30 days (lifecycle policy)"
echo "  • LRS redundancy: 3 copies within region"
echo "  • Monitor usage: https://portal.azure.com/#blade/Microsoft_Azure_Billing/SubscriptionsBlade"

echo -e "\n${GREEN}Setup completed successfully!${NC}\n"
