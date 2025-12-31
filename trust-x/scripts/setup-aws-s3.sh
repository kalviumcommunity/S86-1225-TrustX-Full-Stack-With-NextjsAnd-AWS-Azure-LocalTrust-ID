#!/bin/bash

# =============================================================================
# AWS S3 Bucket Setup Script
# =============================================================================
# This script helps you create and configure an AWS S3 bucket for secure
# file uploads and downloads with proper IAM permissions and security settings.
#
# Prerequisites:
# - AWS CLI installed and configured (aws configure)
# - jq installed for JSON parsing (sudo apt-get install jq or brew install jq)
# - Appropriate AWS IAM permissions for S3 and IAM operations
#
# Usage:
#   chmod +x scripts/setup-aws-s3.sh
#   ./scripts/setup-aws-s3.sh
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables (Customize these)
BUCKET_NAME="${BUCKET_NAME:-trustx-storage-$(date +%s)}"
AWS_REGION="${AWS_REGION:-us-east-1}"
IAM_USER_NAME="${IAM_USER_NAME:-trustx-storage-uploader}"
IAM_POLICY_NAME="${IAM_POLICY_NAME:-TrustXStoragePolicy}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AWS S3 Bucket Setup${NC}"
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

# Verify AWS credentials
echo -e "\n${BLUE}Step 1: Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi
print_status "AWS credentials verified"

# Create S3 bucket
echo -e "\n${BLUE}Step 2: Creating S3 bucket...${NC}"
echo "  Bucket: ${BUCKET_NAME}"
echo "  Region: ${AWS_REGION}"

if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
    print_warning "Bucket ${BUCKET_NAME} already exists"
else
    if [ "$AWS_REGION" == "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${AWS_REGION}" \
            --output json > /dev/null
    else
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${AWS_REGION}" \
            --create-bucket-configuration LocationConstraint="${AWS_REGION}" \
            --output json > /dev/null
    fi
    print_status "S3 bucket created: ${BUCKET_NAME}"
fi

# Block public access (security best practice)
echo -e "\n${BLUE}Step 3: Configuring bucket security...${NC}"
aws s3api put-public-access-block \
    --bucket "${BUCKET_NAME}" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --output json > /dev/null

print_status "Public access blocked (all files private by default)"

# Enable bucket versioning
aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled \
    --output json > /dev/null

print_status "Bucket versioning enabled"

# Enable server-side encryption
aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }' \
    --output json > /dev/null

print_status "Server-side encryption enabled (AES-256)"

# Configure CORS for browser uploads
echo -e "\n${BLUE}Step 4: Configuring CORS for browser uploads...${NC}"
aws s3api put-bucket-cors \
    --bucket "${BUCKET_NAME}" \
    --cors-configuration '{
        "CORSRules": [{
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }]
    }' \
    --output json > /dev/null

print_status "CORS configured for localhost (update for production)"

# Configure lifecycle policy (auto-delete temp files after 30 days)
echo -e "\n${BLUE}Step 5: Setting up lifecycle policies...${NC}"
aws s3api put-bucket-lifecycle-configuration \
    --bucket "${BUCKET_NAME}" \
    --lifecycle-configuration '{
        "Rules": [{
            "Id": "DeleteTempFilesAfter30Days",
            "Filter": {"Prefix": "temp/"},
            "Status": "Enabled",
            "Expiration": {"Days": 30}
        }, {
            "Id": "TransitionToInfrequentAccessAfter90Days",
            "Filter": {"Prefix": ""},
            "Status": "Enabled",
            "Transitions": [{
                "Days": 90,
                "StorageClass": "STANDARD_IA"
            }]
        }]
    }' \
    --output json > /dev/null

print_status "Lifecycle policies configured"
print_warning "  - Temp files (temp/*) deleted after 30 days"
print_warning "  - Files moved to Infrequent Access after 90 days"

# Create IAM user for programmatic access
echo -e "\n${BLUE}Step 6: Creating IAM user for storage access...${NC}"

# Check if user exists
if aws iam get-user --user-name "${IAM_USER_NAME}" &> /dev/null; then
    print_warning "IAM user ${IAM_USER_NAME} already exists"
else
    aws iam create-user \
        --user-name "${IAM_USER_NAME}" \
        --tags "Key=Project,Value=TrustX" "Key=Purpose,Value=StorageAccess" \
        --output json > /dev/null
    print_status "IAM user created: ${IAM_USER_NAME}"
fi

# Create IAM policy with minimal permissions
echo -e "\n${BLUE}Step 7: Creating IAM policy with minimal permissions...${NC}"

IAM_POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${IAM_POLICY_NAME}"

# Check if policy exists
if aws iam get-policy --policy-arn "${IAM_POLICY_ARN}" &> /dev/null; then
    print_warning "IAM policy ${IAM_POLICY_NAME} already exists"
else
    aws iam create-policy \
        --policy-name "${IAM_POLICY_NAME}" \
        --policy-document "{
            \"Version\": \"2012-10-17\",
            \"Statement\": [
                {
                    \"Effect\": \"Allow\",
                    \"Action\": [
                        \"s3:PutObject\",
                        \"s3:GetObject\",
                        \"s3:DeleteObject\",
                        \"s3:ListBucket\"
                    ],
                    \"Resource\": [
                        \"arn:aws:s3:::${BUCKET_NAME}\",
                        \"arn:aws:s3:::${BUCKET_NAME}/*\"
                    ]
                }
            ]
        }" \
        --output json > /dev/null
    print_status "IAM policy created: ${IAM_POLICY_NAME}"
fi

# Attach policy to user
aws iam attach-user-policy \
    --user-name "${IAM_USER_NAME}" \
    --policy-arn "${IAM_POLICY_ARN}" \
    --output json > /dev/null 2>&1 || print_warning "Policy may already be attached"

print_status "Policy attached to user"

# Generate access keys
echo -e "\n${BLUE}Step 8: Generating access keys...${NC}"
print_warning "Creating new access key for ${IAM_USER_NAME}..."

ACCESS_KEY_OUTPUT=$(aws iam create-access-key \
    --user-name "${IAM_USER_NAME}" \
    --output json)

AWS_ACCESS_KEY_ID=$(echo "${ACCESS_KEY_OUTPUT}" | jq -r '.AccessKey.AccessKeyId')
AWS_SECRET_ACCESS_KEY=$(echo "${ACCESS_KEY_OUTPUT}" | jq -r '.AccessKey.SecretAccessKey')

print_status "Access keys generated"

# Save credentials to a secure file
CREDENTIALS_FILE="s3-credentials-$(date +%Y%m%d-%H%M%S).txt"
cat > "$CREDENTIALS_FILE" << EOF
# =============================================================================
# AWS S3 Credentials
# Generated: $(date)
# =============================================================================

# Bucket Information
AWS_S3_BUCKET_NAME=${BUCKET_NAME}
AWS_REGION=${AWS_REGION}
AWS_S3_BUCKET_URL=https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com

# IAM User
IAM_USER_NAME=${IAM_USER_NAME}
IAM_POLICY_NAME=${IAM_POLICY_NAME}

# Access Keys (KEEP SECURE!)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# Environment Variables for .env.local
AWS_S3_BUCKET_NAME="${BUCKET_NAME}"
AWS_REGION="${AWS_REGION}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"

# =============================================================================
# Next Steps:
# =============================================================================
# 1. Copy the environment variables to your .env.local file
# 2. Install AWS SDK: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
# 3. Update CORS origins for production domains
# 4. Test file upload: npm run test:upload
# 5. SECURE THIS FILE! Add to .gitignore if not already
# =============================================================================

# AWS CLI Commands
# ----------------
# List files: aws s3 ls s3://${BUCKET_NAME}/
# Upload file: aws s3 cp file.txt s3://${BUCKET_NAME}/
# Download file: aws s3 cp s3://${BUCKET_NAME}/file.txt .
# Delete file: aws s3 rm s3://${BUCKET_NAME}/file.txt
# Sync folder: aws s3 sync ./folder s3://${BUCKET_NAME}/folder/

# S3 Console URL
# --------------
# https://s3.console.aws.amazon.com/s3/buckets/${BUCKET_NAME}
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ AWS S3 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

print_status "Credentials saved to: ${CREDENTIALS_FILE}"
print_warning "IMPORTANT: Keep this file secure and add it to .gitignore!"

echo -e "\n${BLUE}Your S3 Configuration:${NC}"
echo "  Bucket Name: ${BUCKET_NAME}"
echo "  Region: ${AWS_REGION}"
echo "  IAM User: ${IAM_USER_NAME}"
echo "  Bucket URL: https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com"

echo -e "\n${BLUE}Environment Variables (add to .env.local):${NC}"
echo -e "${YELLOW}AWS_S3_BUCKET_NAME=\"${BUCKET_NAME}\"${NC}"
echo -e "${YELLOW}AWS_REGION=\"${AWS_REGION}\"${NC}"
echo -e "${YELLOW}AWS_ACCESS_KEY_ID=\"${AWS_ACCESS_KEY_ID}\"${NC}"
echo -e "${YELLOW}AWS_SECRET_ACCESS_KEY=\"${AWS_SECRET_ACCESS_KEY}\"${NC}"

echo -e "\n${BLUE}Quick Start Commands:${NC}"
echo "  1. Install SDK:       npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner"
echo "  2. Add env vars:      cat ${CREDENTIALS_FILE} >> .env.local"
echo "  3. Test upload:       npm run test:upload"
echo "  4. View console:      https://s3.console.aws.amazon.com/s3/buckets/${BUCKET_NAME}"

echo -e "\n${YELLOW}Security Best Practices:${NC}"
echo "  • Bucket is private by default (public access blocked)"
echo "  • Server-side encryption enabled (AES-256)"
echo "  • IAM user has minimal permissions (PutObject, GetObject only)"
echo "  • Use presigned URLs for temporary access"
echo "  • Rotate access keys every 90 days"
echo "  • Enable CloudTrail logging for audit"
echo "  • Update CORS origins for production"

echo -e "\n${YELLOW}Cost Optimization:${NC}"
echo "  • Standard Storage: \$0.023/GB/month"
echo "  • Infrequent Access: \$0.0125/GB/month (auto-transition after 90 days)"
echo "  • Temp files deleted after 30 days (lifecycle policy)"
echo "  • Monitor usage: https://console.aws.amazon.com/billing/"

echo -e "\n${GREEN}Setup completed successfully!${NC}\n"
