# 🚀 Deployment Verification & Rollback - Quick Reference

## Quick Commands

### Test Locally

```bash
# Start the application
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Run smoke tests
npm run test:smoke

# Run full verification test
bash scripts/test-deployment-verification.sh
# or on Windows:
powershell scripts/test-deployment-verification.ps1
```

---

## Health Check Endpoints

### Basic Health Check
```bash
GET /api/health
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T10:30:45.123Z",
  "uptime": 86400.5,
  "database": { "status": "connected" }
}
```

### Detailed Health Check
```bash
POST /api/health
Content-Type: application/json

{
  "checkDatabase": true,
  "checkRedis": true,
  "checkStorage": true
}
```

---

## Smoke Tests

### Location
```
__smoke_tests__/
├── home.test.js    # Homepage tests
├── health.test.js  # Health endpoint tests
└── api.test.js     # Core API tests
```

### Run Specific Test
```bash
# Run only health tests
npm test -- __smoke_tests__/health.test.js

# Run with custom URL
NEXT_PUBLIC_APP_URL=https://production.com npm run test:smoke
```

---

## CI/CD Deployment Flow

### 1. Deploy
```yaml
aws ecs update-service --cluster prod --service app --force-new-deployment
```

### 2. Wait (30s)
```yaml
sleep 30
```

### 3. Health Check (5 retries)
```yaml
curl -f https://app.com/api/health || exit 1
```

### 4. Smoke Tests
```yaml
npm run test:smoke
```

### 5. Rollback (if failed)
```yaml
aws ecs update-service --cluster prod --service app --rollback
```

---

## Rollback Strategies

### Strategy 1: Task Definition Rollback
**Use:** AWS ECS deployments  
**Time:** ~2-3 minutes  
**Command:**
```bash
aws ecs update-service \
  --cluster prod-cluster \
  --service app-service \
  --task-definition previous-task-arn \
  --force-new-deployment
```

### Strategy 2: Blue-Green Deployment
**Use:** Zero-downtime requirement  
**Time:** <30 seconds  
**Command:**
```bash
# Switch load balancer to blue environment
aws elbv2 modify-listener \
  --listener-arn $LISTENER \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TG
```

### Strategy 3: Canary Rollback
**Use:** Gradual rollout  
**Time:** ~5-10 minutes  
**Action:** Reduce canary traffic to 0%

---

## DevOps Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **MTTD** | Deploy Time → Failure Detection | < 5 min |
| **MTTR** | Failure Detection → Service Restored | < 30 min |
| **CFR** | (Failed Deploys / Total Deploys) × 100 | < 15% |

### Calculate MTTD
```
MTTD = Time(Failure Detected) - Time(Deploy Complete)
Example: 10:32 AM - 10:30 AM = 2 minutes ✅
```

### Calculate MTTR
```
MTTR = Time(Service Restored) - Time(Failure Detected)
Example: 10:37 AM - 10:32 AM = 5 minutes ✅
```

### Calculate CFR
```
CFR = (Failed Deployments / Total Deployments) × 100%
Example: (4 failed / 50 total) × 100% = 8% ✅
```

---

## Troubleshooting

### Health Check Times Out
```bash
# Check if app is running
curl -v http://localhost:3000

# Check Docker container
docker ps | grep trust-x

# View logs
docker logs trust-x-container
```

### Smoke Tests Fail Locally but Pass in CI
```bash
# Check environment variables
echo $NEXT_PUBLIC_APP_URL

# Set correct URL
export NEXT_PUBLIC_APP_URL=http://localhost:3000
npm run test:smoke
```

### Rollback Fails
```bash
# Check ECS service status
aws ecs describe-services --cluster prod --services app

# Manual rollback
aws ecs update-service \
  --cluster prod \
  --service app \
  --task-definition $(aws ecs list-task-definitions --family app --sort DESC --max-items 2 --query 'taskDefinitionArns[1]' --output text) \
  --force-new-deployment

# Verify rollback
curl -f https://app.com/api/health
```

---

## Simulating Failures

### Test 1: Break Health Check
```typescript
// src/app/api/health/route.ts
export async function GET() {
  return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
}
```

### Test 2: Break Smoke Test
```javascript
// __smoke_tests__/home.test.js
it('should fail', () => {
  expect(true).toBe(false); // Intentional failure
});
```

### Test 3: Database Failure
```bash
# Stop database
docker-compose stop postgres

# Health check should show degraded
curl http://localhost:3000/api/health
# { "status": "degraded", "database": { "status": "disconnected" } }
```

---

## GitHub Actions Secrets

Add these secrets in GitHub Settings → Secrets and Variables → Actions:

| Secret | Purpose | Example |
|--------|---------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `myusername` |
| `DOCKER_PASSWORD` | Docker Hub access token | `dckr_pat_xxx` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `PRODUCTION_URL` | Production app URL | `https://trust-x.com` |

---

## Monitoring & Alerts

### CloudWatch Alarms
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --metric-name Errors \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --period 60

# Health check failure alarm
aws cloudwatch put-metric-alarm \
  --alarm-name health-check-failed \
  --metric-name HealthCheckFailed \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

### PagerDuty Integration
```bash
# Send alert on deployment failure
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Deployment failed - rollback initiated",
      "severity": "error",
      "source": "GitHub Actions"
    }
  }'
```

---

## Best Practices Checklist

### Before Deployment
- [ ] All tests pass locally
- [ ] Health endpoint returns 200 OK
- [ ] Smoke tests pass
- [ ] Database migrations tested
- [ ] Environment variables configured

### During Deployment
- [ ] Monitor health check endpoint
- [ ] Watch error rates in CloudWatch
- [ ] Check smoke test results
- [ ] Verify response times

### After Deployment
- [ ] Confirm all health checks green
- [ ] Review deployment metrics
- [ ] Check for error spikes
- [ ] Monitor for 15 minutes

### If Rollback Needed
- [ ] Confirm rollback decision
- [ ] Execute rollback command
- [ ] Verify rolled-back version healthy
- [ ] Alert operations team
- [ ] Document failure cause

---

## Emergency Contacts

**On-Call Engineer:** Check PagerDuty rotation  
**DevOps Team:** Slack #devops-alerts  
**AWS Console:** https://console.aws.amazon.com/ecs/  
**GitHub Actions:** https://github.com/YOUR_REPO/actions

---

## Additional Resources

- **Full Documentation:** [DEPLOYMENT-VERIFICATION-ROLLBACK.md](DEPLOYMENT-VERIFICATION-ROLLBACK.md)
- **CI/CD Pipeline:** [CI-PIPELINE-DOCUMENTATION.md](CI-PIPELINE-DOCUMENTATION.md)
- **Docker Setup:** [DOCKER-BUILD-PUSH-AUTOMATION.md](DOCKER-BUILD-PUSH-AUTOMATION.md)

---

**Last Updated:** January 6, 2026  
**Version:** 1.0.0
