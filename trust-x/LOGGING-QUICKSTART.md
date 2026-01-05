# Logging and Monitoring - Quick Start

## 🚀 Quick Setup

### 1. Logging is Already Configured

Your application already has structured JSON logging configured with:
- ✅ Correlation IDs for request tracing
- ✅ Multiple log levels (debug, info, warn, error)
- ✅ Performance metrics tracking
- ✅ Security event logging

### 2. Choose Your Cloud Platform

#### AWS CloudWatch

```bash
# Run setup script
chmod +x scripts/setup-cloudwatch.sh
./scripts/setup-cloudwatch.sh

# Or Windows PowerShell
.\scripts\setup-cloudwatch.ps1 -Region ap-south-1
```

This will:
- Create CloudWatch log group
- Set up metric filters
- Create alarms for errors, slow responses, and security events
- Build a monitoring dashboard

#### Azure Monitor

```bash
# Set your configuration
export RESOURCE_GROUP="trustx-rg"
export APP_SERVICE_NAME="trustx-app"
export EMAIL_ADDRESS="your-email@example.com"

# Run setup script
chmod +x scripts/setup-azure-monitor.sh
./scripts/setup-azure-monitor.sh
```

This will:
- Create Log Analytics workspace
- Enable Application Insights
- Configure diagnostic settings
- Set up metric alerts

### 3. View Your Logs

#### AWS CloudWatch

**Console:**
```
AWS Console → CloudWatch → Log groups → /ecs/trustx-task
```

**CLI (tail logs):**
```bash
aws logs tail /ecs/trustx-task --follow --region ap-south-1
```

**Dashboard:**
```
AWS Console → CloudWatch → Dashboards → TrustX-Application-Monitoring
```

#### Azure Monitor

**Portal:**
```
Azure Portal → Monitor → Logs → Select workspace
```

**Run Kusto Query:**
```kusto
AppServiceConsoleLogs
| where TimeGenerated > ago(1h)
| where Level == "Error"
| limit 100
```

### 4. Common Log Queries

#### Find All Errors (CloudWatch)
```
fields @timestamp, message, context.requestId, context.endpoint
| filter level = "error"
| sort @timestamp desc
| limit 100
```

#### Find Slow Requests (CloudWatch)
```
fields @timestamp, context.endpoint, context.duration
| filter context.duration > 1000
| sort context.duration desc
```

#### Track Request Flow
```
fields @timestamp, level, message
| filter context.requestId = "YOUR_REQUEST_ID"
| sort @timestamp asc
```

See [scripts/cloudwatch-queries.txt](scripts/cloudwatch-queries.txt) and [scripts/azure-monitor-queries.txt](scripts/azure-monitor-queries.txt) for more examples.

### 5. Using Logs in Code

#### Basic Logging
```typescript
import { logger } from '@/lib/logger';

logger.info('Operation completed', { userId, action: 'update' });
logger.error('Operation failed', { userId }, error);
```

#### API Routes
```typescript
import { createRequestContext, logRequestCompletion } from '@/lib/requestLogger';

export async function GET(req: NextRequest) {
  const context = createRequestContext(req);
  
  try {
    const data = await fetchData();
    logRequestCompletion(context, req, 200);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('API error', { requestId: context.requestId }, error);
    logRequestCompletion(context, req, 500);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 6. Monitoring Alerts

Your setup includes these alerts:

| Alert                     | Threshold              | Action |
|---------------------------|------------------------|--------|
| High Error Rate           | >10 errors in 5 min    | Email  |
| Slow API Response         | >2s average            | Email  |
| Excessive Failed Logins   | >20 attempts in 5 min  | Email  |
| High CPU                  | >80% for 5 min         | Email  |

Configure notification emails in:
- **AWS:** SNS Topic subscriptions
- **Azure:** Action Group email receivers

---

## 📚 Full Documentation

For complete details, see [LOGGING-MONITORING.md](LOGGING-MONITORING.md):

- Architecture overview
- Detailed logging patterns
- Advanced query examples
- Dashboard configuration
- Alert escalation workflows
- Best practices and troubleshooting

---

## 🔍 What Gets Logged

### API Requests
```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "info",
  "message": "API request completed",
  "requestId": "1736073000000-abc123",
  "context": {
    "endpoint": "/api/users",
    "method": "GET",
    "statusCode": 200,
    "duration": 145,
    "userId": "user-123"
  }
}
```

### Errors
```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "requestId": "1736073000000-abc123",
  "error": {
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n    at ...",
    "code": "ECONNREFUSED"
  }
}
```

### Authentication Events
```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "info",
  "message": "Authentication: login_success",
  "requestId": "1736073000000-abc123",
  "context": {
    "userId": "user-123",
    "success": true,
    "authEvent": "login_success"
  }
}
```

---

## ⚡ Key Features

✅ **Request Correlation** - Trace all logs for a single request  
✅ **Performance Tracking** - Measure operation duration  
✅ **Security Logging** - Track authentication and suspicious activity  
✅ **Error Context** - Full stack traces with business context  
✅ **Cloud Integration** - Works with AWS CloudWatch and Azure Monitor  
✅ **Real-time Dashboards** - Visualize metrics and trends  
✅ **Automated Alerts** - Get notified of critical issues  

---

**Ready to deploy?** Your logging infrastructure is production-ready! 🎉
