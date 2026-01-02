#!/bin/bash

# ============================================
# Azure App Service Deployment Setup Script
# ============================================

set -e

echo "======================================"
echo "Azure App Service Deployment Setup"
echo "======================================"

# Variables (Update these with your values)
RESOURCE_GROUP="trustx-resources"
LOCATION="eastus"
ACR_NAME="trustxregistry"
APP_SERVICE_PLAN="trustx-plan"
WEB_APP_NAME="trustx-app"
ACR_REPOSITORY="trustx-app"

echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "ACR Name: $ACR_NAME"
echo ""

# Step 1: Create Resource Group
echo "Step 1: Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Project=TrustX Environment=Production \
  || echo "Resource group already exists"

echo ""

# Step 2: Create Azure Container Registry
echo "Step 2: Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  || echo "ACR already exists"

ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo ""

# Step 3: Build and Push Docker Image
echo "Step 3: Building and pushing Docker image to ACR..."
az acr login --name $ACR_NAME

docker build -t $ACR_REPOSITORY:latest .
docker tag $ACR_REPOSITORY:latest $ACR_LOGIN_SERVER/$ACR_REPOSITORY:latest
docker tag $ACR_REPOSITORY:latest $ACR_LOGIN_SERVER/$ACR_REPOSITORY:$(git rev-parse --short HEAD)

docker push $ACR_LOGIN_SERVER/$ACR_REPOSITORY:latest
docker push $ACR_LOGIN_SERVER/$ACR_REPOSITORY:$(git rev-parse --short HEAD)

echo "Image pushed successfully!"
echo ""

# Step 4: Create App Service Plan
echo "Step 4: Creating App Service Plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1 \
  --tags Project=TrustX Environment=Production \
  || echo "App Service Plan already exists"

echo ""

# Step 5: Create Web App
echo "Step 5: Creating Web App..."

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --deployment-container-image-name $ACR_LOGIN_SERVER/$ACR_REPOSITORY:latest \
  || echo "Web App already exists"

# Configure Web App
az webapp config container set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_LOGIN_SERVER/$ACR_REPOSITORY:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Configure App Settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    WEBSITES_PORT=3000 \
    WEBSITES_CONTAINER_START_TIME_LIMIT=600

# Enable continuous deployment
az webapp deployment container config \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --enable-cd true

echo ""

# Step 6: Configure Autoscaling
echo "Step 6: Configuring autoscaling..."
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_SERVICE_PLAN \
  --resource-type Microsoft.Web/serverFarms \
  --name "$APP_SERVICE_PLAN-autoscale" \
  --min-count 1 \
  --max-count 3 \
  --count 1 \
  || echo "Autoscale already configured"

# Scale up on CPU > 70%
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "$APP_SERVICE_PLAN-autoscale" \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1 \
  || echo "Scale-out rule already exists"

# Scale down on CPU < 25%
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "$APP_SERVICE_PLAN-autoscale" \
  --condition "Percentage CPU < 25 avg 5m" \
  --scale in 1 \
  || echo "Scale-in rule already exists"

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo "ACR: $ACR_LOGIN_SERVER"
echo "Web App: https://$WEB_APP_NAME.azurewebsites.net"
echo ""
echo "To view logs:"
echo "  az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "To restart the app:"
echo "  az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
