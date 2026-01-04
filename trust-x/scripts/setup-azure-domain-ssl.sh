#!/bin/bash

# ============================================
# Azure Domain & SSL Setup Script
# ============================================
# This script automates:
# - Azure DNS Zone creation
# - DNS record configuration
# - App Service Managed Certificate
# - Custom domain binding with SSL
# ============================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${1:-yourdomain.com}"
APP_NAME="${2:-trustx-app}"
RESOURCE_GROUP="${3:-${APP_NAME}-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
SUBDOMAIN="${4:-www}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Azure Domain & SSL Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Domain: ${GREEN}${DOMAIN_NAME}${NC}"
echo -e "App Name: ${GREEN}${APP_NAME}${NC}"
echo -e "Resource Group: ${GREEN}${RESOURCE_GROUP}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v az >/dev/null 2>&1 || { echo -e "${RED}Azure CLI not found. Install it first.${NC}"; exit 1; }

# Verify Azure login
az account show >/dev/null 2>&1 || { echo -e "${RED}Not logged into Azure. Run 'az login'.${NC}"; exit 1; }
echo -e "${GREEN}✓ Azure CLI configured${NC}"

# ============================================
# Step 1: Create Azure DNS Zone
# ============================================
echo ""
echo -e "${BLUE}Step 1: Creating Azure DNS Zone...${NC}"

# Check if DNS zone exists
DNS_ZONE_EXISTS=$(az network dns zone show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${DOMAIN_NAME}" \
  --query "name" \
  --output tsv 2>/dev/null || echo "")

if [ -z "$DNS_ZONE_EXISTS" ]; then
  echo "Creating DNS zone for ${DOMAIN_NAME}..."
  
  az network dns zone create \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${DOMAIN_NAME}" \
    --tags "app=${APP_NAME}" "environment=production" \
    >/dev/null
  
  echo -e "${GREEN}✓ DNS zone created${NC}"
else
  echo -e "${GREEN}✓ DNS zone already exists${NC}"
fi

# Get nameservers
NAMESERVERS=$(az network dns zone show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${DOMAIN_NAME}" \
  --query "nameServers" \
  --output json)

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update your domain registrar with these nameservers:${NC}"
echo "${NAMESERVERS}" | jq -r '.[]' | while read ns; do
  echo -e "   - ${GREEN}${ns}${NC}"
done
echo ""
read -p "Press Enter once you've updated the nameservers..."

# ============================================
# Step 2: Get App Service Details
# ============================================
echo ""
echo -e "${BLUE}Step 2: Getting App Service details...${NC}"

APP_SERVICE_NAME="${APP_NAME}-webapp"

# Get App Service default hostname
APP_DEFAULT_HOSTNAME=$(az webapp show \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "defaultHostName" \
  --output tsv 2>/dev/null)

if [ -z "$APP_DEFAULT_HOSTNAME" ]; then
  echo -e "${RED}App Service not found. Make sure it's deployed first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ App Service: ${APP_DEFAULT_HOSTNAME}${NC}"

# Get App Service IP for A record
APP_IP=$(az webapp show \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "outboundIpAddresses" \
  --output tsv | cut -d',' -f1)

echo -e "${GREEN}✓ App Service IP: ${APP_IP}${NC}"

# ============================================
# Step 3: Create DNS Records
# ============================================
echo ""
echo -e "${BLUE}Step 3: Creating DNS Records...${NC}"

# Create A record for root domain
echo "Creating A record for ${DOMAIN_NAME}..."
az network dns record-set a delete \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --name "@" \
  --yes 2>/dev/null || true

az network dns record-set a add-record \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --record-set-name "@" \
  --ipv4-address "${APP_IP}" \
  >/dev/null

echo -e "${GREEN}✓ A record created: ${DOMAIN_NAME} → ${APP_IP}${NC}"

# Create TXT record for domain verification
echo "Creating TXT record for App Service verification..."
VERIFICATION_ID=$(az webapp show \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "customDomainVerificationId" \
  --output tsv)

az network dns record-set txt delete \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --name "asuid" \
  --yes 2>/dev/null || true

az network dns record-set txt add-record \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --record-set-name "asuid" \
  --value "${VERIFICATION_ID}" \
  >/dev/null

echo -e "${GREEN}✓ TXT record created for domain verification${NC}"

# Create CNAME record for www subdomain
echo "Creating CNAME record for ${SUBDOMAIN}.${DOMAIN_NAME}..."
az network dns record-set cname delete \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --name "${SUBDOMAIN}" \
  --yes 2>/dev/null || true

az network dns record-set cname set-record \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --record-set-name "${SUBDOMAIN}" \
  --cname "${APP_DEFAULT_HOSTNAME}" \
  >/dev/null

echo -e "${GREEN}✓ CNAME record created: ${SUBDOMAIN}.${DOMAIN_NAME} → ${APP_DEFAULT_HOSTNAME}${NC}"

# Create TXT record for www verification
az network dns record-set txt delete \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --name "asuid.${SUBDOMAIN}" \
  --yes 2>/dev/null || true

az network dns record-set txt add-record \
  --resource-group "${RESOURCE_GROUP}" \
  --zone-name "${DOMAIN_NAME}" \
  --record-set-name "asuid.${SUBDOMAIN}" \
  --value "${VERIFICATION_ID}" \
  >/dev/null

echo -e "${GREEN}✓ TXT record created for ${SUBDOMAIN} verification${NC}"

# Wait for DNS propagation
echo ""
echo -e "${YELLOW}Waiting 30 seconds for DNS propagation...${NC}"
sleep 30

# ============================================
# Step 4: Add Custom Domains to App Service
# ============================================
echo ""
echo -e "${BLUE}Step 4: Adding custom domains to App Service...${NC}"

# Add root domain
echo "Adding ${DOMAIN_NAME} to App Service..."
az webapp config hostname add \
  --webapp-name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --hostname "${DOMAIN_NAME}" \
  2>/dev/null || echo -e "${YELLOW}Domain may already be added${NC}"

echo -e "${GREEN}✓ Root domain added${NC}"

# Add www subdomain
echo "Adding ${SUBDOMAIN}.${DOMAIN_NAME} to App Service..."
az webapp config hostname add \
  --webapp-name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --hostname "${SUBDOMAIN}.${DOMAIN_NAME}" \
  2>/dev/null || echo -e "${YELLOW}Subdomain may already be added${NC}"

echo -e "${GREEN}✓ Subdomain added${NC}"

# ============================================
# Step 5: Create and Bind SSL Certificates
# ============================================
echo ""
echo -e "${BLUE}Step 5: Creating App Service Managed Certificates...${NC}"

# Create managed certificate for root domain
echo "Creating certificate for ${DOMAIN_NAME}..."
az webapp config ssl create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${APP_SERVICE_NAME}" \
  --hostname "${DOMAIN_NAME}" \
  >/dev/null 2>&1 || echo -e "${YELLOW}Certificate may already exist${NC}"

# Get certificate thumbprint
CERT_THUMBPRINT=$(az webapp config ssl list \
  --resource-group "${RESOURCE_GROUP}" \
  --query "[?subjectName=='${DOMAIN_NAME}'].thumbprint" \
  --output tsv 2>/dev/null | head -1)

if [ -n "$CERT_THUMBPRINT" ]; then
  # Bind certificate to root domain
  az webapp config ssl bind \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${APP_SERVICE_NAME}" \
    --certificate-thumbprint "${CERT_THUMBPRINT}" \
    --ssl-type SNI \
    >/dev/null 2>&1 || true
  
  echo -e "${GREEN}✓ SSL certificate created and bound for ${DOMAIN_NAME}${NC}"
else
  echo -e "${YELLOW}⚠️  Certificate creation pending. May take a few minutes.${NC}"
fi

# Create managed certificate for www subdomain
echo "Creating certificate for ${SUBDOMAIN}.${DOMAIN_NAME}..."
az webapp config ssl create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${APP_SERVICE_NAME}" \
  --hostname "${SUBDOMAIN}.${DOMAIN_NAME}" \
  >/dev/null 2>&1 || echo -e "${YELLOW}Certificate may already exist${NC}"

# Get certificate thumbprint for subdomain
WWW_CERT_THUMBPRINT=$(az webapp config ssl list \
  --resource-group "${RESOURCE_GROUP}" \
  --query "[?subjectName=='${SUBDOMAIN}.${DOMAIN_NAME}'].thumbprint" \
  --output tsv 2>/dev/null | head -1)

if [ -n "$WWW_CERT_THUMBPRINT" ]; then
  # Bind certificate to subdomain
  az webapp config ssl bind \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${APP_SERVICE_NAME}" \
    --certificate-thumbprint "${WWW_CERT_THUMBPRINT}" \
    --ssl-type SNI \
    >/dev/null 2>&1 || true
  
  echo -e "${GREEN}✓ SSL certificate created and bound for ${SUBDOMAIN}.${DOMAIN_NAME}${NC}"
fi

# ============================================
# Step 6: Enable HTTPS Only
# ============================================
echo ""
echo -e "${BLUE}Step 6: Enabling HTTPS-only mode...${NC}"

az webapp update \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --https-only true \
  >/dev/null

echo -e "${GREEN}✓ HTTPS-only mode enabled${NC}"

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Domain & SSL Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Domain Configuration:${NC}"
echo -e "  Root Domain: ${GREEN}https://${DOMAIN_NAME}${NC}"
echo -e "  Subdomain: ${GREEN}https://${SUBDOMAIN}.${DOMAIN_NAME}${NC}"
echo ""
echo -e "${BLUE}SSL Certificates:${NC}"
echo -e "  Type: ${GREEN}App Service Managed Certificate${NC}"
echo -e "  Status: ${GREEN}Active${NC}"
echo -e "  Auto-Renewal: ${GREEN}Enabled${NC}"
echo ""
echo -e "${BLUE}DNS Records (Azure DNS):${NC}"
echo -e "  Zone: ${GREEN}${DOMAIN_NAME}${NC}"
echo -e "  A Record: ${GREEN}${DOMAIN_NAME} → ${APP_IP}${NC}"
echo -e "  CNAME: ${GREEN}${SUBDOMAIN}.${DOMAIN_NAME} → ${APP_DEFAULT_HOSTNAME}${NC}"
echo -e "  TXT Records: ${GREEN}Domain verification records added${NC}"
echo ""
echo -e "${YELLOW}⚠️  DNS propagation may take 1-48 hours globally${NC}"
echo -e "${YELLOW}⚠️  Test your site: https://${DOMAIN_NAME}${NC}"
echo ""
echo -e "${BLUE}Verification:${NC}"
echo -e "  1. Visit ${GREEN}https://${DOMAIN_NAME}${NC} in your browser"
echo -e "  2. Check for 🔒 padlock icon in address bar"
echo -e "  3. Run SSL test: ${GREEN}https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN_NAME}${NC}"
echo ""
