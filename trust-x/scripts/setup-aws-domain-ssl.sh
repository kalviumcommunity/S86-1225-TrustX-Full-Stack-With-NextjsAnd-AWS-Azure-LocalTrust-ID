#!/bin/bash

# ============================================
# AWS Domain & SSL Setup Script
# ============================================
# This script automates:
# - Route 53 Hosted Zone creation
# - DNS record configuration
# - ACM SSL certificate request
# - Load Balancer HTTPS listener setup
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
REGION="${AWS_REGION:-us-east-1}"
SUBDOMAIN="${3:-www}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}AWS Domain & SSL Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Domain: ${GREEN}${DOMAIN_NAME}${NC}"
echo -e "App Name: ${GREEN}${APP_NAME}${NC}"
echo -e "Region: ${GREEN}${REGION}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI not found. Install it first.${NC}"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}jq not found. Install it first.${NC}"; exit 1; }

# Verify AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo -e "${RED}AWS credentials not configured.${NC}"; exit 1; }
echo -e "${GREEN}✓ AWS CLI configured${NC}"

# ============================================
# Step 1: Create Route 53 Hosted Zone
# ============================================
echo ""
echo -e "${BLUE}Step 1: Creating Route 53 Hosted Zone...${NC}"

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "${DOMAIN_NAME}" \
  --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
  --output text 2>/dev/null | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
  echo "Creating new hosted zone for ${DOMAIN_NAME}..."
  
  CALLER_REFERENCE=$(date +%s)
  HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name "${DOMAIN_NAME}" \
    --caller-reference "${CALLER_REFERENCE}" \
    --hosted-zone-config Comment="Hosted zone for ${APP_NAME}" \
    --query 'HostedZone.Id' \
    --output text | cut -d'/' -f3)
  
  echo -e "${GREEN}✓ Hosted zone created: ${HOSTED_ZONE_ID}${NC}"
else
  echo -e "${GREEN}✓ Hosted zone already exists: ${HOSTED_ZONE_ID}${NC}"
fi

# Get nameservers
NAMESERVERS=$(aws route53 get-hosted-zone \
  --id "${HOSTED_ZONE_ID}" \
  --query 'DelegationSet.NameServers' \
  --output json)

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update your domain registrar with these nameservers:${NC}"
echo -e "${NAMESERVERS}" | jq -r '.[]' | while read ns; do
  echo -e "   - ${GREEN}${ns}${NC}"
done
echo ""
read -p "Press Enter once you've updated the nameservers..."

# ============================================
# Step 2: Get Load Balancer DNS Name
# ============================================
echo ""
echo -e "${BLUE}Step 2: Finding ECS Load Balancer...${NC}"

CLUSTER_NAME="${APP_NAME}-cluster"
SERVICE_NAME="${APP_NAME}-service"

# Get load balancer ARN from ECS service
LB_ARN=$(aws ecs describe-services \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${REGION}" \
  --query 'services[0].loadBalancers[0].targetGroupArn' \
  --output text 2>/dev/null)

if [ "$LB_ARN" != "None" ] && [ -n "$LB_ARN" ]; then
  # Get target group details to find load balancer
  TG_ARN="$LB_ARN"
  LB_ARN=$(aws elbv2 describe-target-groups \
    --target-group-arns "${TG_ARN}" \
    --region "${REGION}" \
    --query 'TargetGroups[0].LoadBalancerArns[0]' \
    --output text 2>/dev/null)
fi

if [ "$LB_ARN" == "None" ] || [ -z "$LB_ARN" ]; then
  echo -e "${RED}Load balancer not found. Make sure your ECS service is deployed.${NC}"
  exit 1
fi

LB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "${LB_ARN}" \
  --region "${REGION}" \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

LB_HOSTED_ZONE=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "${LB_ARN}" \
  --region "${REGION}" \
  --query 'LoadBalancers[0].CanonicalHostedZoneId' \
  --output text)

echo -e "${GREEN}✓ Load Balancer DNS: ${LB_DNS}${NC}"

# ============================================
# Step 3: Create DNS Records
# ============================================
echo ""
echo -e "${BLUE}Step 3: Creating DNS Records...${NC}"

# Create A record for root domain (alias to load balancer)
cat > /tmp/route53-changes.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN_NAME}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${LB_HOSTED_ZONE}",
          "DNSName": "${LB_DNS}",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${SUBDOMAIN}.${DOMAIN_NAME}",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${DOMAIN_NAME}"
          }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch file:///tmp/route53-changes.json \
  >/dev/null

rm /tmp/route53-changes.json

echo -e "${GREEN}✓ DNS records created${NC}"
echo -e "   - A record: ${DOMAIN_NAME} → ${LB_DNS}"
echo -e "   - CNAME record: ${SUBDOMAIN}.${DOMAIN_NAME} → ${DOMAIN_NAME}"

# ============================================
# Step 4: Request SSL Certificate (ACM)
# ============================================
echo ""
echo -e "${BLUE}Step 4: Requesting SSL Certificate...${NC}"

# Check if certificate already exists
CERT_ARN=$(aws acm list-certificates \
  --region "${REGION}" \
  --query "CertificateSummaryList[?DomainName=='${DOMAIN_NAME}'].CertificateArn" \
  --output text 2>/dev/null)

if [ -z "$CERT_ARN" ]; then
  echo "Requesting new certificate for ${DOMAIN_NAME} and *.${DOMAIN_NAME}..."
  
  CERT_ARN=$(aws acm request-certificate \
    --domain-name "${DOMAIN_NAME}" \
    --subject-alternative-names "*.${DOMAIN_NAME}" \
    --validation-method DNS \
    --region "${REGION}" \
    --query 'CertificateArn' \
    --output text)
  
  echo -e "${GREEN}✓ Certificate requested: ${CERT_ARN}${NC}"
  echo "Waiting for DNS validation records..."
  sleep 10
else
  echo -e "${GREEN}✓ Certificate already exists: ${CERT_ARN}${NC}"
fi

# Get validation records
VALIDATION_RECORDS=$(aws acm describe-certificate \
  --certificate-arn "${CERT_ARN}" \
  --region "${REGION}" \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json)

VALIDATION_NAME=$(echo "${VALIDATION_RECORDS}" | jq -r '.Name')
VALIDATION_VALUE=$(echo "${VALIDATION_RECORDS}" | jq -r '.Value')

if [ "$VALIDATION_NAME" != "null" ] && [ -n "$VALIDATION_NAME" ]; then
  echo ""
  echo "Adding DNS validation record to Route 53..."
  
  cat > /tmp/validation-record.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${VALIDATION_NAME}",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${VALIDATION_VALUE}"
          }
        ]
      }
    }
  ]
}
EOF

  aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file:///tmp/validation-record.json \
    >/dev/null
  
  rm /tmp/validation-record.json
  
  echo -e "${GREEN}✓ Validation record added${NC}"
  echo ""
  echo -e "${YELLOW}Waiting for certificate validation (this may take 5-30 minutes)...${NC}"
  
  aws acm wait certificate-validated \
    --certificate-arn "${CERT_ARN}" \
    --region "${REGION}"
  
  echo -e "${GREEN}✓ Certificate validated and issued!${NC}"
else
  echo -e "${GREEN}✓ Certificate already validated${NC}"
fi

# ============================================
# Step 5: Configure HTTPS Listener on Load Balancer
# ============================================
echo ""
echo -e "${BLUE}Step 5: Configuring HTTPS Listener...${NC}"

# Check if HTTPS listener exists
HTTPS_LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn "${LB_ARN}" \
  --region "${REGION}" \
  --query "Listeners[?Port==\`443\`].ListenerArn" \
  --output text 2>/dev/null)

if [ -z "$HTTPS_LISTENER" ]; then
  echo "Creating HTTPS listener on port 443..."
  
  # Get target group ARN
  TARGET_GROUP=$(aws elbv2 describe-target-groups \
    --region "${REGION}" \
    --query "TargetGroups[?contains(TargetGroupName, '${APP_NAME}')].TargetGroupArn" \
    --output text | head -1)
  
  aws elbv2 create-listener \
    --load-balancer-arn "${LB_ARN}" \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn="${CERT_ARN}" \
    --default-actions Type=forward,TargetGroupArn="${TARGET_GROUP}" \
    --region "${REGION}" \
    >/dev/null
  
  echo -e "${GREEN}✓ HTTPS listener created${NC}"
else
  echo -e "${GREEN}✓ HTTPS listener already exists${NC}"
fi

# Add HTTP to HTTPS redirect
HTTP_LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn "${LB_ARN}" \
  --region "${REGION}" \
  --query "Listeners[?Port==\`80\`].ListenerArn" \
  --output text 2>/dev/null)

if [ -n "$HTTP_LISTENER" ]; then
  echo "Configuring HTTP to HTTPS redirect..."
  
  aws elbv2 modify-listener \
    --listener-arn "${HTTP_LISTENER}" \
    --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
    --region "${REGION}" \
    >/dev/null
  
  echo -e "${GREEN}✓ HTTP → HTTPS redirect configured${NC}"
fi

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
echo -e "${BLUE}SSL Certificate:${NC}"
echo -e "  ARN: ${GREEN}${CERT_ARN}${NC}"
echo -e "  Status: ${GREEN}Issued & Active${NC}"
echo -e "  Auto-Renewal: ${GREEN}Enabled${NC}"
echo ""
echo -e "${BLUE}DNS Records:${NC}"
echo -e "  Hosted Zone ID: ${GREEN}${HOSTED_ZONE_ID}${NC}"
echo -e "  A Record: ${GREEN}${DOMAIN_NAME} → ${LB_DNS}${NC}"
echo -e "  CNAME: ${GREEN}${SUBDOMAIN}.${DOMAIN_NAME} → ${DOMAIN_NAME}${NC}"
echo ""
echo -e "${YELLOW}⚠️  DNS propagation may take 1-48 hours globally${NC}"
echo -e "${YELLOW}⚠️  Test your site: https://${DOMAIN_NAME}${NC}"
echo ""
echo -e "${BLUE}Verification:${NC}"
echo -e "  1. Visit ${GREEN}https://${DOMAIN_NAME}${NC} in your browser"
echo -e "  2. Check for 🔒 padlock icon in address bar"
echo -e "  3. Run SSL test: ${GREEN}https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN_NAME}${NC}"
echo ""
