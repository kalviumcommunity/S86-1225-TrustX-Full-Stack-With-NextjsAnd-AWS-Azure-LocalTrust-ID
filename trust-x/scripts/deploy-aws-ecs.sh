#!/bin/bash

# ============================================
# AWS ECS Deployment Setup Script
# ============================================

set -e

echo "======================================"
echo "AWS ECS Deployment Setup"
echo "======================================"

# Variables (Update these with your values)
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="trustx-app"
ECS_CLUSTER="trustx-cluster"
ECS_SERVICE="trustx-service"
ECS_TASK_FAMILY="trustx-task"
CONTAINER_NAME="trustx-container"

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Step 1: Create ECR Repository
echo "Step 1: Creating ECR repository..."
aws ecr create-repository \
  --repository-name $ECR_REPOSITORY \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Project,Value=TrustX Key=Environment,Value=Production \
  || echo "Repository already exists"

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
echo "ECR Repository URI: $ECR_URI"
echo ""

# Step 2: Build and Push Docker Image
echo "Step 2: Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

docker build -t $ECR_REPOSITORY:latest .
docker tag $ECR_REPOSITORY:latest $ECR_URI:latest
docker tag $ECR_REPOSITORY:latest $ECR_URI:$(git rev-parse --short HEAD)

docker push $ECR_URI:latest
docker push $ECR_URI:$(git rev-parse --short HEAD)

echo "Image pushed successfully!"
echo ""

# Step 3: Create ECS Cluster
echo "Step 3: Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $ECS_CLUSTER \
  --region $AWS_REGION \
  --tags key=Project,value=TrustX key=Environment,value=Production \
  || echo "Cluster already exists"

echo ""

# Step 4: Create Task Definition
echo "Step 4: Creating ECS task definition..."
cat > task-definition.json <<EOF
{
  "family": "$ECS_TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$CONTAINER_NAME",
      "image": "$ECR_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$ECS_TASK_FAMILY",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health/db', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Create CloudWatch Log Group
aws logs create-log-group \
  --log-group-name "/ecs/$ECS_TASK_FAMILY" \
  --region $AWS_REGION \
  || echo "Log group already exists"

# Register Task Definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region $AWS_REGION

echo "Task definition registered!"
echo ""

# Step 5: Create ECS Service
echo "Step 5: Creating ECS service..."

# Get default VPC and subnets
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ',')

echo "VPC ID: $VPC_ID"
echo "Subnet IDs: $SUBNET_IDS"

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name trustx-ecs-sg \
  --description "Security group for TrustX ECS service" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text \
  || aws ec2 describe-security-groups --filters "Name=group-name,Values=trustx-ecs-sg" --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)

# Allow inbound traffic on port 3000
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION \
  || echo "Security group rule already exists"

# Create ECS Service
aws ecs create-service \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --task-definition $ECS_TASK_FAMILY \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --region $AWS_REGION \
  || echo "Service already exists"

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo "ECR Repository: $ECR_URI"
echo "ECS Cluster: $ECS_CLUSTER"
echo "ECS Service: $ECS_SERVICE"
echo ""
echo "To view your service:"
echo "  aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
echo ""
echo "To get the public IP:"
echo "  aws ecs describe-tasks --cluster $ECS_CLUSTER --tasks \$(aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $ECS_SERVICE --query 'taskArns[0]' --output text --region $AWS_REGION) --query 'tasks[0].attachments[0].details[?name==\`networkInterfaceId\`].value' --output text --region $AWS_REGION | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region $AWS_REGION"
echo ""
