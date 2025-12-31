#!/bin/bash

# =============================================================================
# Azure Database for PostgreSQL Setup Script
# =============================================================================
# This script helps you provision and configure an Azure Database for PostgreSQL
# for your Next.js application with proper security and network configuration.
#
# Prerequisites:
# - Azure CLI installed (az cli)
# - Logged in to Azure (az login)
# - jq installed for JSON parsing (sudo apt-get install jq or brew install jq)
# - Appropriate Azure permissions for resource creation
#
# Usage:
#   chmod +x scripts/setup-azure-postgresql.sh
#   ./scripts/setup-azure-postgresql.sh
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables (Customize these)
RESOURCE_GROUP="${RESOURCE_GROUP:-trustx-rg}"
SERVER_NAME="${SERVER_NAME:-trustx-db-server-$(date +%s)}"  # Unique name required
DB_NAME="${DB_NAME:-trustxdb}"
ADMIN_USERNAME="${ADMIN_USERNAME:-adminuser}"
LOCATION="${LOCATION:-eastus}"
SKU_NAME="${SKU_NAME:-Standard_B1ms}"  # Basic tier: B1ms (1 vCore, 2GB RAM, ~$15/month)
STORAGE_SIZE="${STORAGE_SIZE:-32}"  # GB (minimum 32GB for flexible server)
POSTGRES_VERSION="${POSTGRES_VERSION:-16}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Azure Database for PostgreSQL Setup${NC}"
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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Some features may not work properly."
    echo "  Install: sudo apt-get install jq (Linux) or brew install jq (macOS)"
fi

# Verify Azure login
echo -e "\n${BLUE}Step 1: Verifying Azure login...${NC}"
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Run 'az login' first."
    exit 1
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
print_status "Logged in to subscription: ${SUBSCRIPTION_NAME} (${SUBSCRIPTION_ID})"

# Generate a strong admin password
echo -e "\n${BLUE}Step 2: Generating secure admin password...${NC}"
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "/@\"'\\" | cut -c1-30)
print_status "Admin password generated (save this securely!)"
echo -e "  ${YELLOW}Admin Password: ${ADMIN_PASSWORD}${NC}"

# Get your current public IP for firewall rule
echo -e "\n${BLUE}Step 3: Detecting your public IP address...${NC}"
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com)
if [ -z "$PUBLIC_IP" ]; then
    print_warning "Could not detect public IP. You'll need to configure firewall manually."
    PUBLIC_IP="0.0.0.0"
else
    print_status "Your public IP: ${PUBLIC_IP}"
fi

# Create resource group
echo -e "\n${BLUE}Step 4: Creating resource group...${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || print_warning "Resource group may already exist"

print_status "Resource group ready: ${RESOURCE_GROUP}"

# Create PostgreSQL Flexible Server
echo -e "\n${BLUE}Step 5: Creating Azure Database for PostgreSQL Flexible Server...${NC}"
echo "  Server: ${SERVER_NAME}"
echo "  Database: ${DB_NAME}"
echo "  Username: ${ADMIN_USERNAME}"
echo "  Location: ${LOCATION}"
echo "  SKU: ${SKU_NAME}"
echo "  Storage: ${STORAGE_SIZE}GB"
echo "  Version: PostgreSQL ${POSTGRES_VERSION}"

print_warning "This process takes 5-10 minutes. Please wait..."

az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --location "$LOCATION" \
    --admin-user "$ADMIN_USERNAME" \
    --admin-password "$ADMIN_PASSWORD" \
    --sku-name "$SKU_NAME" \
    --tier Burstable \
    --version "$POSTGRES_VERSION" \
    --storage-size "$STORAGE_SIZE" \
    --backup-retention "$BACKUP_RETENTION_DAYS" \
    --high-availability Disabled \
    --public-access 0.0.0.0-255.255.255.255 \
    --tags Project=TrustX Environment=Production \
    --output none

print_status "PostgreSQL server created successfully!"

# Create database
echo -e "\n${BLUE}Step 6: Creating database...${NC}"
az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --database-name "$DB_NAME" \
    --output none

print_status "Database created: ${DB_NAME}"

# Configure firewall rules
echo -e "\n${BLUE}Step 7: Configuring firewall rules...${NC}"

# Add rule for your current IP
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --rule-name "AllowMyIP" \
    --start-ip-address "$PUBLIC_IP" \
    --end-ip-address "$PUBLIC_IP" \
    --output none

print_status "Firewall rule added for ${PUBLIC_IP}"

# Add rule for Azure services
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --rule-name "AllowAzureServices" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0" \
    --output none

print_status "Firewall rule added for Azure services"

# Enable SSL enforcement
echo -e "\n${BLUE}Step 8: Configuring SSL/TLS settings...${NC}"
az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --name require_secure_transport \
    --value ON \
    --output none

print_status "SSL/TLS enforcement enabled"

# Configure server parameters for better performance
echo -e "\n${BLUE}Step 9: Optimizing server parameters...${NC}"

az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --name max_connections \
    --value 100 \
    --output none

az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$SERVER_NAME" \
    --name shared_buffers \
    --value 16384 \
    --output none

print_status "Server parameters optimized"

# Get server details
echo -e "\n${BLUE}Step 10: Retrieving connection information...${NC}"

SERVER_FQDN=$(az postgres flexible-server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SERVER_NAME" \
    --query fullyQualifiedDomainName \
    --output tsv)

print_status "Server endpoint: ${SERVER_FQDN}"

# Generate connection string
DATABASE_URL="postgresql://${ADMIN_USERNAME}:${ADMIN_PASSWORD}@${SERVER_FQDN}:5432/${DB_NAME}?schema=public&sslmode=require"

# Save credentials to a secure file
CREDENTIALS_FILE="azure-postgresql-credentials-$(date +%Y%m%d-%H%M%S).txt"
cat > "$CREDENTIALS_FILE" << EOF
# =============================================================================
# Azure Database for PostgreSQL Credentials
# Generated: $(date)
# =============================================================================

# Server Information
SERVER_NAME=${SERVER_NAME}
RESOURCE_GROUP=${RESOURCE_GROUP}
LOCATION=${LOCATION}
SERVER_FQDN=${SERVER_FQDN}
DB_NAME=${DB_NAME}

# Admin Credentials (KEEP SECURE!)
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Connection String for .env.local
DATABASE_URL="${DATABASE_URL}"

# Direct Connection (for migrations on serverless platforms like Vercel)
DIRECT_URL="${DATABASE_URL}"

# psql Connection Command
psql "host=${SERVER_FQDN} port=5432 dbname=${DB_NAME} user=${ADMIN_USERNAME} password=${ADMIN_PASSWORD} sslmode=require"

# Azure Portal URLs
RESOURCE_URL=https://portal.azure.com/#@/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${SERVER_NAME}

# Firewall Configuration
ALLOWED_IP=${PUBLIC_IP}

# =============================================================================
# Next Steps:
# =============================================================================
# 1. Copy DATABASE_URL to your .env.local file
# 2. Run: npx prisma migrate deploy
# 3. Run: npx prisma generate
# 4. Test connection: npm run test:db
# 5. SECURE THIS FILE! Add to .gitignore if not already
# =============================================================================
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Azure PostgreSQL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

print_status "Credentials saved to: ${CREDENTIALS_FILE}"
print_warning "IMPORTANT: Keep this file secure and add it to .gitignore!"

echo -e "\n${BLUE}Your DATABASE_URL:${NC}"
echo -e "${YELLOW}${DATABASE_URL}${NC}\n"

echo -e "${BLUE}Quick Start Commands:${NC}"
echo "  1. Add to .env.local:     echo 'DATABASE_URL=\"${DATABASE_URL}\"' >> .env.local"
echo "  2. Generate Prisma:       npx prisma generate"
echo "  3. Run migrations:        npx prisma migrate deploy"
echo "  4. Test connection:       npm run test:db"
echo "  5. Connect with psql:     psql \"host=${SERVER_FQDN} dbname=${DB_NAME} user=${ADMIN_USERNAME} sslmode=require\""

echo -e "\n${BLUE}Management URLs:${NC}"
echo "  Azure Portal: https://portal.azure.com/#@/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${SERVER_NAME}"
echo "  Monitoring: https://portal.azure.com/#@/resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${SERVER_NAME}/monitoring"

echo -e "\n${YELLOW}Security Notes:${NC}"
echo "  • SSL/TLS enforcement: ✓ Enabled"
echo "  • Change admin password regularly"
echo "  • Use Azure AD authentication for production"
echo "  • Enable Private Endpoint for VNet access"
echo "  • Monitor Azure Monitor logs for suspicious activity"
echo "  • Consider Zone-redundant deployment for high availability"

echo -e "\n${YELLOW}Cost Optimization:${NC}"
echo "  • Current configuration: ~\$15-25/month (B1ms, 32GB)"
echo "  • Backup retention: ${BACKUP_RETENTION_DAYS} days"
echo "  • Stop server when not in use (dev environments only)"
echo "  • Use Azure Cost Management for monitoring"

echo -e "\n${BLUE}Additional Azure CLI Commands:${NC}"
echo "  • Show server details:    az postgres flexible-server show -g ${RESOURCE_GROUP} -n ${SERVER_NAME}"
echo "  • List databases:         az postgres flexible-server db list -g ${RESOURCE_GROUP} -s ${SERVER_NAME}"
echo "  • Show firewall rules:    az postgres flexible-server firewall-rule list -g ${RESOURCE_GROUP} -n ${SERVER_NAME}"
echo "  • Stop server:            az postgres flexible-server stop -g ${RESOURCE_GROUP} -n ${SERVER_NAME}"
echo "  • Start server:           az postgres flexible-server start -g ${RESOURCE_GROUP} -n ${SERVER_NAME}"
echo "  • Delete server:          az postgres flexible-server delete -g ${RESOURCE_GROUP} -n ${SERVER_NAME}"

echo -e "\n${GREEN}Setup completed successfully!${NC}\n"
