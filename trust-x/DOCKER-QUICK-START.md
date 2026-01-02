# Docker Deployment - Quick Start

## 📦 What's Included

- **Dockerfile** - Multi-stage production-ready container (280MB optimized)
- **docker-compose.yml** - Local development setup
- **docker-entrypoint.sh** - Startup script with health checks
- **GitHub Actions** - CI/CD pipelines for AWS ECS and Azure App Service
- **Deployment Scripts** - Automated setup for both platforms

## 🚀 Quick Start (Local)

### 1. Build the Image

```bash
docker build -t trustx-app .
```

### 2. Run Locally

```bash
# Using Docker
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e JWT_SECRET="your-secret-key" \
  trustx-app

# Or using Docker Compose
docker-compose up -d
```

### 3. Verify

```bash
curl http://localhost:3000/api/health/db
```

## ☁️ Deploy to Cloud

### AWS ECS (Fargate)

```bash
# Automated deployment
chmod +x scripts/deploy-aws-ecs.sh
./scripts/deploy-aws-ecs.sh

# What it does:
# ✅ Creates ECR repository
# ✅ Builds and pushes Docker image
# ✅ Creates ECS cluster (Fargate)
# ✅ Deploys with auto-scaling (1-3 tasks)
# ✅ Configures health checks and monitoring
```

**Estimated Cost:** $15-20/month (0.25 vCPU, 512MB RAM)

### Azure App Service

```bash
# Automated deployment
chmod +x scripts/deploy-azure-appservice.sh
./scripts/deploy-azure-appservice.sh

# What it does:
# ✅ Creates Azure Container Registry
# ✅ Builds and pushes Docker image
# ✅ Creates App Service (B1 tier)
# ✅ Configures auto-scaling
# ✅ Enables continuous deployment
```

**Estimated Cost:** $18-25/month (B1 tier: 1 vCPU, 1.75GB RAM)

## 🔄 CI/CD Setup

### GitHub Actions (AWS)

1. Add GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Push to `main` branch → Auto-deploys to ECS

### GitHub Actions (Azure)

1. Create service principal:
   ```bash
   az ad sp create-for-rbac --name "trustx-github-actions" --sdk-auth
   ```

2. Add GitHub Secrets:
   - `AZURE_CREDENTIALS`
   - `ACR_USERNAME`
   - `ACR_PASSWORD`

3. Push to `main` branch → Auto-deploys to App Service

## 📊 Monitoring

### AWS CloudWatch

```bash
# View logs
aws logs tail /ecs/trustx-task --follow

# View metrics
aws cloudwatch get-metric-statistics --metric-name CPUUtilization ...
```

### Azure Monitor

```bash
# View logs
az webapp log tail --name trustx-app --resource-group trustx-resources

# View metrics
az monitor metrics list --resource ... --metric "CpuPercentage"
```

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>

# Common issues:
# - Missing environment variables
# - Database connection failure
# - Port mismatch (should be 3000)
```

### Health check failing

```bash
# Test locally
docker run -p 3000:3000 trustx-app
curl http://localhost:3000/api/health/db

# Should return: {"healthy": true, ...}
```

## 📚 Documentation

- **[DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md)** - Complete deployment guide
- **[aws-ecs-task-definition.json](./aws-ecs-task-definition.json)** - ECS task configuration
- **[.github/workflows/](./github/workflows/)** - CI/CD pipeline configurations

## 🎯 Production Checklist

- [x] Multi-stage Dockerfile optimized
- [x] Health checks configured
- [x] Auto-scaling enabled
- [x] CI/CD pipelines ready
- [x] Monitoring and logging setup
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] Database backups automated
- [ ] CDN configured for static assets

## 💰 Cost Comparison

| Platform | Tier | vCPU | RAM | Cost/Month |
|----------|------|------|-----|------------|
| **AWS ECS** | Fargate | 0.25 | 512MB | $15-20 |
| **AWS ECS** | Fargate | 0.5 | 1GB | $25-30 |
| **Azure App Service** | B1 | 1 | 1.75GB | $18-25 |
| **Azure App Service** | B2 | 2 | 3.5GB | $80-90 |

## 🔑 Key Features

- ✅ **Multi-stage build** - 76% smaller image (280MB vs 1.2GB)
- ✅ **Security** - Non-root user, minimal attack surface
- ✅ **Health checks** - Automatic restart on failure
- ✅ **Auto-scaling** - CPU-based scaling (1-3 instances)
- ✅ **Zero-downtime** - Rolling deployments
- ✅ **Observability** - Structured logging + metrics

## 📞 Support

For detailed instructions, see [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md)

---

**Last Updated:** December 31, 2025
