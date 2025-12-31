#!/bin/bash

# =============================================================================
# AWS RDS PostgreSQL Setup Script
# =============================================================================
# This script helps you provision and configure an AWS RDS PostgreSQL instance
# for your Next.js application with proper security and network configuration.
#
# Prerequisites:
# - AWS CLI installed and configured (aws configure)
# - jq installed for JSON parsing (sudo apt-get install jq or brew install jq)
# - Appropriate AWS IAM permissions for RDS and VPC operations
#
# Usage:
#   chmod +x scripts/setup-aws-rds.sh
#   ./scripts/setup-aws-rds.sh
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables (Customize these)
DB_INSTANCE_IDENTIFIER="${DB_INSTANCE_IDENTIFIER:-nextjs-trustx-db}"
DB_NAME="${DB_NAME:-trustxdb}"
MASTER_USERNAME="${MASTER_USERNAME:-adminuser}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t3.micro}"  # Free tier eligible
ALLOCATED_STORAGE="${ALLOCATED_STORAGE:-20}"  # GB (minimum for PostgreSQL)
ENGINE_VERSION="${ENGINE_VERSION:-16.1}"  # PostgreSQL 16.1
AWS_REGION="${AWS_REGION:-us-east-1}"
BACKUP_RETENTION_PERIOD="${BACKUP_RETENTION_PERIOD:-7}"  # Days

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AWS RDS PostgreSQL Setup${NC}"
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

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Some features may not work properly."
    echo "  Install: sudo apt-get install jq (Linux) or brew install jq (macOS)"
fi

# Verify AWS credentials
echo -e "\n${BLUE}Step 1: Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi
print_status "AWS credentials verified"

# Generate a strong password
echo -e "\n${BLUE}Step 2: Generating secure master password...${NC}"
MASTER_PASSWORD=$(openssl rand -base64 32 | tr -d "/@\"'\\" | cut -c1-30)
print_status "Master password generated (save this securely!)"
echo -e "  ${YELLOW}Master Password: ${MASTER_PASSWORD}${NC}"

# Get your current public IP for security group
echo -e "\n${BLUE}Step 3: Detecting your public IP address...${NC}"
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com)
if [ -z "$PUBLIC_IP" ]; then
    print_warning "Could not detect public IP. You'll need to configure security group manually."
    PUBLIC_IP="0.0.0.0"
else
    print_status "Your public IP: ${PUBLIC_IP}"
fi

# Get default VPC
echo -e "\n${BLUE}Step 4: Configuring VPC and Security Group...${NC}"
DEFAULT_VPC=$(aws ec2 describe-vpcs \
    --region "$AWS_REGION" \
    --filters "Name=is-default,Values=true" \
    --query "Vpcs[0].VpcId" \
    --output text)

if [ "$DEFAULT_VPC" == "None" ]; then
    print_error "No default VPC found. Please create one or specify a VPC ID."
    exit 1
fi
print_status "Using VPC: ${DEFAULT_VPC}"

# Create security group
SECURITY_GROUP_NAME="nextjs-trustx-db-sg"
SECURITY_GROUP_DESC="Security group for Next.js TrustX PostgreSQL database"

# Check if security group already exists
EXISTING_SG=$(aws ec2 describe-security-groups \
    --region "$AWS_REGION" \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || echo "None")

if [ "$EXISTING_SG" != "None" ]; then
    print_status "Using existing security group: ${EXISTING_SG}"
    SECURITY_GROUP_ID="$EXISTING_SG"
else
    print_status "Creating new security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --region "$AWS_REGION" \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "$SECURITY_GROUP_DESC" \
        --vpc-id "$DEFAULT_VPC" \
        --query "GroupId" \
        --output text)
    print_status "Security group created: ${SECURITY_GROUP_ID}"
fi

# Add inbound rule for PostgreSQL (port 5432)
print_status "Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp \
    --port 5432 \
    --cidr "${PUBLIC_IP}/32" \
    --output text 2>/dev/null || print_warning "Security rule may already exist"

print_status "Security group configured for PostgreSQL access from ${PUBLIC_IP}"

# Create RDS instance
echo -e "\n${BLUE}Step 5: Creating RDS PostgreSQL instance...${NC}"
echo "  Instance: ${DB_INSTANCE_IDENTIFIER}"
echo "  Database: ${DB_NAME}"
echo "  Username: ${MASTER_USERNAME}"
echo "  Class: ${DB_INSTANCE_CLASS}"
echo "  Storage: ${ALLOCATED_STORAGE}GB"
echo "  Version: PostgreSQL ${ENGINE_VERSION}"

aws rds create-db-instance \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --engine postgres \
    --engine-version "$ENGINE_VERSION" \
    --master-username "$MASTER_USERNAME" \
    --master-user-password "$MASTER_PASSWORD" \
    --allocated-storage "$ALLOCATED_STORAGE" \
    --db-name "$DB_NAME" \
    --vpc-security-group-ids "$SECURITY_GROUP_ID" \
    --backup-retention-period "$BACKUP_RETENTION_PERIOD" \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --publicly-accessible \
    --storage-type gp3 \
    --storage-encrypted \
    --enable-cloudwatch-logs-exports '["postgresql"]' \
    --deletion-protection \
    --no-auto-minor-version-upgrade \
    --tags "Key=Project,Value=TrustX" "Key=Environment,Value=Production" \
    --output json > /dev/null

print_status "RDS instance creation initiated"
print_warning "This process takes 5-10 minutes. Waiting for instance to become available..."

# Wait for instance to be available
aws rds wait db-instance-available \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER"

print_status "RDS instance is now available!"

# Get endpoint information
echo -e "\n${BLUE}Step 6: Retrieving connection information...${NC}"
DB_ENDPOINT=$(aws rds describe-db-instances \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)

DB_PORT=$(aws rds describe-db-instances \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --query "DBInstances[0].Endpoint.Port" \
    --output text)

print_status "Database endpoint: ${DB_ENDPOINT}:${DB_PORT}"

# Generate connection string
DATABASE_URL="postgresql://${MASTER_USERNAME}:${MASTER_PASSWORD}@${DB_ENDPOINT}:${DB_PORT}/${DB_NAME}?schema=public&sslmode=require"

# Save credentials to a secure file
CREDENTIALS_FILE="rds-credentials-$(date +%Y%m%d-%H%M%S).txt"
cat > "$CREDENTIALS_FILE" << EOF
# =============================================================================
# AWS RDS PostgreSQL Credentials
# Generated: $(date)
# =============================================================================

# Instance Information
DB_INSTANCE_IDENTIFIER=${DB_INSTANCE_IDENTIFIER}
AWS_REGION=${AWS_REGION}
DB_ENDPOINT=${DB_ENDPOINT}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}

# Master Credentials (KEEP SECURE!)
MASTER_USERNAME=${MASTER_USERNAME}
MASTER_PASSWORD=${MASTER_PASSWORD}

# Connection String for .env.local
DATABASE_URL="${DATABASE_URL}"

# Direct Connection (for migrations on serverless platforms like Vercel)
DIRECT_URL="${DATABASE_URL}"

# psql Connection Command
psql -h ${DB_ENDPOINT} -U ${MASTER_USERNAME} -d ${DB_NAME}

# Security Group
SECURITY_GROUP_ID=${SECURITY_GROUP_ID}
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
echo -e "${GREEN}✓ AWS RDS Setup Complete!${NC}"
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
echo "  5. Connect with psql:     psql -h ${DB_ENDPOINT} -U ${MASTER_USERNAME} -d ${DB_NAME}"

echo -e "\n${BLUE}Management URLs:${NC}"
echo "  RDS Console: https://console.aws.amazon.com/rds/home?region=${AWS_REGION}#database:id=${DB_INSTANCE_IDENTIFIER}"
echo "  CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}"

echo -e "\n${YELLOW}Security Notes:${NC}"
echo "  • Change master password regularly"
echo "  • Use IAM authentication for production"
echo "  • Enable VPC peering for private access"
echo "  • Monitor CloudWatch logs for suspicious activity"
echo "  • Consider Multi-AZ deployment for high availability"

echo -e "\n${YELLOW}Cost Optimization:${NC}"
echo "  • Current configuration: ~\$15-30/month (t3.micro, 20GB)"
echo "  • Enable deletion protection: ✓ Enabled"
echo "  • Auto backups: ${BACKUP_RETENTION_PERIOD} days retention"
echo "  • Stop instance when not in use (dev environments only)"

echo -e "\n${GREEN}Setup completed successfully!${NC}\n"
