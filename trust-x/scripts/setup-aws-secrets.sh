#!/bin/bash

################################################################################
# AWS Secrets Manager Setup Script
################################################################################
# This script automates the creation of AWS Secrets Manager secrets with
# proper encryption, IAM policies, and access controls for secure environment
# variable management in production.
#
# Prerequisites:
# - AWS CLI installed and configured (aws configure)
# - Active AWS account with appropriate permissions
# - jq installed for JSON processing
#
# Usage:
#   ./scripts/setup-aws-secrets.sh
#
# What This Script Does:
# 1. Creates a secret in AWS Secrets Manager
# 2. Stores all environment variables from .env as JSON
# 3. Encrypts using AWS KMS (default key)
# 4. Creates IAM policy for least-privilege access
# 5. Generates policy JSON for reference
# 6. Outputs secret ARN and retrieval instructions
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
SECRET_NAME="nextjs/trustx-app-secrets"
AWS_REGION="${AWS_REGION:-us-east-1}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT_FILE="aws-secrets-config-${TIMESTAMP}.txt"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          AWS Secrets Manager Setup for TrustX App             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    echo "Please install it: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed.${NC}"
    echo "Please install it: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Check AWS credentials
echo -e "${BLUE}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured.${NC}"
    echo "Please run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials verified (Account: ${ACCOUNT_ID})${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Using .env.example as template.${NC}"
    ENV_FILE=".env.example"
else
    ENV_FILE=".env"
fi

echo -e "${BLUE}Building secret JSON from ${ENV_FILE}...${NC}"

# Convert .env to JSON, excluding comments and empty lines
SECRET_JSON=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | awk -F= '
BEGIN { 
    print "{" 
}
{
    key=$1
    value=$2
    for(i=3;i<=NF;i++) value=value"="$i
    # Remove quotes if present
    gsub(/^"/, "", value)
    gsub(/"$/, "", value)
    gsub(/^'\''/, "", value)
    gsub(/'\''$/, "", value)
    # Escape special characters for JSON
    gsub(/\\/, "\\\\", value)
    gsub(/"/, "\\\"", value)
    if (NR > 1) print ","
    printf "  \"%s\": \"%s\"", key, value
}
END {
    print ""
    print "}"
}')

echo -e "${GREEN}✓ Secret JSON prepared${NC}"
echo ""

# Check if secret already exists
echo -e "${BLUE}Checking if secret already exists...${NC}"
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${YELLOW}Secret '$SECRET_NAME' already exists.${NC}"
    read -p "Do you want to update it? (y/N): " UPDATE_CHOICE
    
    if [[ $UPDATE_CHOICE =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Updating existing secret...${NC}"
        SECRET_ARN=$(aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_JSON" \
            --region "$AWS_REGION" \
            --query 'ARN' \
            --output text)
        echo -e "${GREEN}✓ Secret updated successfully${NC}"
    else
        echo -e "${YELLOW}Skipping secret update.${NC}"
        SECRET_ARN=$(aws secretsmanager describe-secret \
            --secret-id "$SECRET_NAME" \
            --region "$AWS_REGION" \
            --query 'ARN' \
            --output text)
    fi
else
    # Create the secret
    echo -e "${BLUE}Creating secret in AWS Secrets Manager...${NC}"
    SECRET_ARN=$(aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Environment variables for TrustX Next.js application" \
        --secret-string "$SECRET_JSON" \
        --region "$AWS_REGION" \
        --tags Key=Application,Value=TrustX Key=Environment,Value=Production Key=ManagedBy,Value=Script \
        --query 'ARN' \
        --output text)
    
    echo -e "${GREEN}✓ Secret created successfully${NC}"
fi

echo ""
echo -e "${CYAN}Secret ARN:${NC} $SECRET_ARN"
echo ""

# Create IAM policy for secret access
POLICY_NAME="TrustXSecretsManagerReadOnly"
POLICY_DOCUMENT=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadTrustXSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "$SECRET_ARN"
    },
    {
      "Sid": "DecryptSecrets",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.$AWS_REGION.amazonaws.com"
        }
      }
    }
  ]
}
EOF
)

# Save policy to file
POLICY_FILE="aws-secrets-iam-policy-${TIMESTAMP}.json"
echo "$POLICY_DOCUMENT" > "$POLICY_FILE"

echo -e "${BLUE}IAM Policy created: ${POLICY_FILE}${NC}"
echo ""

# Try to create IAM policy (may fail if already exists)
echo -e "${BLUE}Creating IAM policy (if it doesn't exist)...${NC}"
POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT" \
    --description "Read-only access to TrustX application secrets" \
    --query 'Policy.Arn' \
    --output text 2>/dev/null) || {
    echo -e "${YELLOW}Policy may already exist, retrieving ARN...${NC}"
    POLICY_ARN=$(aws iam list-policies \
        --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" \
        --output text)
}

if [ -n "$POLICY_ARN" ]; then
    echo -e "${GREEN}✓ IAM Policy ARN: ${POLICY_ARN}${NC}"
else
    echo -e "${YELLOW}! Could not retrieve policy ARN (may need manual creation)${NC}"
fi

echo ""

# Save configuration details
cat > "$OUTPUT_FILE" <<EOF
╔════════════════════════════════════════════════════════════════╗
║          AWS Secrets Manager Configuration                     ║
║                  Created: $(date)                    ║
╚════════════════════════════════════════════════════════════════╝

SECRET INFORMATION
─────────────────────────────────────────────────────────────────
Secret Name:    $SECRET_NAME
Secret ARN:     $SECRET_ARN
AWS Region:     $AWS_REGION
AWS Account:    $ACCOUNT_ID

IAM POLICY
─────────────────────────────────────────────────────────────────
Policy Name:    $POLICY_NAME
Policy ARN:     $POLICY_ARN
Policy File:    $POLICY_FILE

ENVIRONMENT VARIABLES FOR YOUR APP
─────────────────────────────────────────────────────────────────
Add these to your .env.production or deployment configuration:

AWS_REGION=$AWS_REGION
SECRET_ARN=$SECRET_ARN
SECRET_NAME=$SECRET_NAME
USE_SECRETS_MANAGER=true

NEXT STEPS
─────────────────────────────────────────────────────────────────
1. Attach the IAM policy to your application's IAM role or user:
   
   For EC2 Instance Role:
   aws iam attach-role-policy \\
     --role-name YourEC2RoleName \\
     --policy-arn $POLICY_ARN

   For IAM User:
   aws iam attach-user-policy \\
     --user-name YourUserName \\
     --policy-arn $POLICY_ARN

   For ECS Task Role:
   aws iam attach-role-policy \\
     --role-name YourECSTaskRoleName \\
     --policy-arn $POLICY_ARN

2. Install AWS SDK in your app:
   npm install @aws-sdk/client-secrets-manager

3. Use the secrets manager utility:
   import { getSecrets } from '@/lib/secretsManager';
   const secrets = await getSecrets();

4. Deploy your application with the environment variables above

5. Test secret retrieval:
   curl https://your-app.com/api/health/secrets

SECURITY BEST PRACTICES
─────────────────────────────────────────────────────────────────
✓ Secrets are encrypted at rest with AWS KMS
✓ IAM policy follows least-privilege principle (read-only)
✓ Secret access is logged in CloudTrail
✓ Use instance/task roles, never hardcode credentials
✓ Rotate secrets regularly (see rotation guide in README)

ROTATION SCHEDULE
─────────────────────────────────────────────────────────────────
• Database credentials:  Every 90 days (quarterly)
• API keys:              Every 180 days (bi-annually)
• JWT secrets:           Every 365 days (annually)
• Review access logs:    Monthly

To enable automatic rotation:
aws secretsmanager rotate-secret \\
  --secret-id $SECRET_ARN \\
  --rotation-lambda-arn <your-rotation-lambda-arn> \\
  --rotation-rules AutomaticallyAfterDays=90

TROUBLESHOOTING
─────────────────────────────────────────────────────────────────
• Access Denied: Check IAM policy is attached to correct role
• Decryption Error: Verify KMS permissions in IAM policy
• Secret Not Found: Ensure AWS_REGION matches secret region
• Network Error: Check VPC endpoints for Secrets Manager

For more information, see README.md

EOF

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              AWS Secrets Manager Setup Complete!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Configuration saved to: ${OUTPUT_FILE}${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "1. Review the configuration file: ${OUTPUT_FILE}"
echo -e "2. Attach the IAM policy to your application's role/user"
echo -e "3. Add environment variables to your deployment"
echo -e "4. Never commit ${OUTPUT_FILE} to Git (already in .gitignore)"
echo ""
echo -e "${GREEN}✓ Setup complete! See ${OUTPUT_FILE} for next steps.${NC}"
