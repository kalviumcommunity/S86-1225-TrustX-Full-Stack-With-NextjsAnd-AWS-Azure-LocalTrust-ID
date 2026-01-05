# Logging and Monitoring Setup Guide

## Overview

This document describes the comprehensive logging and monitoring infrastructure for TrustX, including structured logging, cloud-based monitoring, dashboards, and alerting.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Structured Logging](#structured-logging)
3. [AWS CloudWatch Setup](#aws-cloudwatch-setup)
4. [Azure Monitor Setup](#azure-monitor-setup)
5. [Log Queries and Analysis](#log-queries-and-analysis)
6. [Dashboards](#dashboards)
7. [Alerts and Notifications](#alerts-and-notifications)
8. [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Routes  │  │  Middleware  │  │   Services   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └────────────┬────┴──────────────────┘              │
│                      ▼                                      │
│           ┌──────────────────────┐                         │
│           │  Structured Logger   │                         │
│           │  (JSON Format)       │                         │
│           └──────────┬───────────┘                         │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │   Container Runtime     │
         │   (stdout/stderr)       │
         └─────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌────────────────┐
│ AWS CloudWatch│    │ Azure Monitor  │
│   Logs        │    │ + App Insights │
└───────┬───────┘    └────────┬───────┘
        │                     │
        ├─────────────────────┤
        │                     │
        ▼                     ▼
┌─────────────────────────────────────┐
│  Metrics, Dashboards & Alerts       │
│  - Error rates                      │
│  - Response times                   │
│  - Resource utilization             │
│  - Security events                  │
└─────────────────────────────────────┘
```

---

## Structured Logging

### Log Format

All logs follow a structured JSON format for easy parsing and analysis:

```json
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "info",
  "message": "API request completed",
  "requestId": "1736073000000-abc123",
  "context": {
    "service": "trustx-app",
    "environment": "production",
    "endpoint": "/api/users",
    "method": "GET",
    "statusCode": 200,
    "duration": 145,
    "userId": "user-123"
  }
}
```

### Log Levels

| Level   | Usage                                    | Example                          |
|---------|------------------------------------------|----------------------------------|
| `debug` | Development/troubleshooting info         | Cache hits, DB queries           |
| `info`  | Normal operational events                | API requests, successful logins  |
| `warn`  | Potential issues, degraded performance   | Slow queries, failed validations |
| `error` | Errors requiring attention               | Exceptions, failed operations    |

### Request Correlation

Every API request is assigned a unique `requestId` that flows through all related log entries:

```typescript
// Automatic in middleware
const requestId = logger.generateRequestId();

// Available in all subsequent logs
logger.info('Processing request', { requestId });
logger.error('Request failed', { requestId }, error);
```

### Usage Examples

#### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Info log
logger.info('User profile updated', {
  userId: 'user-123',
  fields: ['name', 'email']
});

// Error log with exception
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    userId: 'user-123'
  }, error as Error);
}
```

#### API Route Logging

```typescript
import { createRequestContext, logRequestCompletion } from '@/lib/requestLogger';

export async function GET(req: NextRequest) {
  const context = createRequestContext(req);
  
  try {
    // Your logic here
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

#### Authentication Logging

```typescript
// Log successful login
logger.logAuth('login_success', userId, true, requestId);

// Log failed login
logger.logAuth('login_failed', undefined, false, requestId);

// Log security event
logger.logSecurity('suspicious_activity', 'high', {
  requestId,
  userId,
  reason: 'Multiple failed attempts',
});
```

#### Performance Tracking

```typescript
import { performance } from '@/lib/logger';

const timer = performance.start('database-query', requestId);
const results = await prisma.user.findMany();
const duration = timer.end(); // Automatically logs duration
```

---

## AWS CloudWatch Setup

### Prerequisites

- AWS CLI installed and configured
- ECS cluster with task running
- IAM permissions for CloudWatch Logs

### Automatic Setup

Run the setup script:

```bash
# Linux/Mac
chmod +x scripts/setup-cloudwatch.sh
./scripts/setup-cloudwatch.sh

# Windows PowerShell
.\scripts\setup-cloudwatch.ps1 -Region ap-south-1
```

### Manual Configuration

#### 1. Log Group Configuration

The ECS task definition already includes CloudWatch logging:

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/trustx-task",
      "awslogs-region": "ap-south-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

#### 2. Metric Filters

Create metric filters to track specific events:

**Error Count:**
```
Pattern: { $.level = "error" }
Metric: TrustX/Application/ErrorCount
```

**Failed Logins:**
```
Pattern: { $.context.authEvent = "login_failed" }
Metric: TrustX/Security/FailedLoginAttempts
```

**API Response Time:**
```
Pattern: { $.context.duration = * }
Metric: TrustX/Performance/APIResponseTime (use $.context.duration)
```

#### 3. CloudWatch Alarms

Configure alarms for critical events:

| Alarm                      | Metric              | Threshold        | Period |
|----------------------------|---------------------|------------------|--------|
| High Error Rate            | ErrorCount          | > 10 errors      | 5 min  |
| Slow API Response          | APIResponseTime     | > 2000ms (avg)   | 5 min  |
| Excessive Failed Logins    | FailedLoginAttempts | > 20 attempts    | 5 min  |
| High CPU Utilization       | CPUUtilization      | > 80%            | 5 min  |

### Viewing Logs

**Console:**
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#logsV2:log-groups/log-group/$252Fecs$252Ftrustx-task
```

**AWS CLI:**
```bash
# Stream logs in real-time
aws logs tail /ecs/trustx-task --follow --region ap-south-1

# Query logs
aws logs start-query \
  --log-group-name "/ecs/trustx-task" \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, message | filter level = "error"'
```

---

## Azure Monitor Setup

### Prerequisites

- Azure CLI installed and configured
- App Service or Container Apps deployed
- Resource Group created

### Automatic Setup

Run the setup script:

```bash
chmod +x scripts/setup-azure-monitor.sh
export RESOURCE_GROUP="trustx-rg"
export APP_SERVICE_NAME="trustx-app"
export EMAIL_ADDRESS="admin@example.com"
./scripts/setup-azure-monitor.sh
```

### Components

#### 1. Log Analytics Workspace

Central repository for all logs with 30-day retention.

#### 2. Application Insights

Provides:
- Request tracking
- Dependency monitoring
- Performance metrics
- Failure analysis
- User analytics

#### 3. Diagnostic Settings

Captures:
- `AppServiceConsoleLogs` - Application logs
- `AppServiceHTTPLogs` - HTTP request logs
- `AppServiceAppLogs` - Application-level logs

### Viewing Logs

**Azure Portal:**
```
Monitor → Logs → Select workspace → Run Kusto queries
```

**Azure CLI:**
```bash
# Query logs
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "AppServiceConsoleLogs | where Level == 'Error' | limit 100"
```

---

## Log Queries and Analysis

### Common CloudWatch Queries

See [scripts/cloudwatch-queries.txt](scripts/cloudwatch-queries.txt) for complete list.

**Find errors:**
```
fields @timestamp, level, message, context.requestId, context.endpoint
| filter level = "error"
| sort @timestamp desc
| limit 100
```

**Track slow requests:**
```
fields @timestamp, context.endpoint, context.duration
| filter context.duration > 1000
| sort context.duration desc
| limit 50
```

**Analyze error patterns:**
```
fields context.endpoint as endpoint
| filter level = "error"
| stats count() by endpoint
| sort count desc
```

### Common Azure Kusto Queries

See [scripts/azure-monitor-queries.txt](scripts/azure-monitor-queries.txt) for complete list.

**Find errors:**
```kusto
AppServiceConsoleLogs
| where TimeGenerated > ago(1h)
| where Level == "Error"
| project TimeGenerated, Message
| order by TimeGenerated desc
```

**Response time percentiles:**
```kusto
AppServiceHTTPLogs
| where TimeGenerated > ago(24h)
| summarize 
    P50 = percentile(TimeTaken, 50),
    P90 = percentile(TimeTaken, 90),
    P99 = percentile(TimeTaken, 99)
    by CsUriStem
```

---

## Dashboards

### AWS CloudWatch Dashboard

The setup script creates `TrustX-Application-Monitoring` with:

1. **Error Count** - 5-minute error rate
2. **API Response Time** - Average and P99 latency
3. **Container Resources** - CPU and Memory utilization
4. **Failed Login Attempts** - Security monitoring
5. **Recent Errors** - Last 20 error log entries

**Access:**
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=TrustX-Application-Monitoring
```

### Azure Monitor Dashboard

Create custom dashboards in Azure Portal:

1. Go to **Dashboards** → **New Dashboard**
2. Add tiles:
   - **Metrics Chart** - Request rate, response time
   - **Logs Query** - Recent errors
   - **Metric Alert** - Current alert status

---

## Alerts and Notifications

### Alert Configuration

| Alert Name                  | Condition                       | Action              |
|-----------------------------|---------------------------------|---------------------|
| High Error Rate             | > 10 errors in 5 minutes        | Email, Slack        |
| Slow API Response           | Avg > 2s for 2 periods          | Email               |
| Excessive Failed Logins     | > 20 attempts in 5 minutes      | Email, PagerDuty    |
| High CPU                    | > 80% for 5 minutes             | Email               |
| High Memory                 | > 85% for 5 minutes             | Email               |

### Notification Channels

**AWS SNS:**
```bash
# Create SNS topic
aws sns create-topic --name cloudwatch-alarms

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:ACCOUNT_ID:cloudwatch-alarms \
  --protocol email \
  --notification-endpoint admin@example.com
```

**Azure Action Groups:**
```bash
az monitor action-group create \
  --name trustx-alerts \
  --resource-group trustx-rg \
  --short-name TrustX \
  --email-receiver name=admin email=admin@example.com
```

### Escalation Process

1. **Level 1 - Info** → Email to dev team
2. **Level 2 - Warning** → Email + Slack notification
3. **Level 3 - Critical** → Email + Slack + PagerDuty

---

## Best Practices

### 1. Log Retention

- **Operational logs:** 7-14 days (cost-effective)
- **Audit logs:** 90+ days (compliance)
- **Archive:** Move old logs to S3/Blob Storage

### 2. Correlation IDs

Always include `requestId` to trace requests across services:

```typescript
// Each request gets unique ID
const requestId = logger.generateRequestId();

// Use it everywhere
logger.info('Starting process', { requestId });
await someService(requestId);
logger.info('Process complete', { requestId });
```

### 3. Sensitive Data

**Never log:**
- Passwords
- API keys
- Credit card numbers
- Personal identification numbers

```typescript
// ❌ BAD
logger.info('User login', { email, password });

// ✅ GOOD
logger.info('User login', { email });
```

### 4. Performance

- Use `logger.debug()` for verbose logs (disabled in production)
- Avoid logging large objects
- Use sampling for high-volume endpoints

### 5. Error Context

Always include relevant context with errors:

```typescript
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', {
    requestId,
    userId,
    operation: 'updateProfile',
    input: { /* safe data */ }
  }, error as Error);
}
```

### 6. Monitoring Checklist

- [ ] All API routes have structured logging
- [ ] Request IDs flow through all operations
- [ ] Errors include stack traces
- [ ] Sensitive data is redacted
- [ ] Alerts are configured for critical metrics
- [ ] Team members are subscribed to notifications
- [ ] Dashboards are accessible to all engineers
- [ ] Log retention policy is documented
- [ ] Runbooks exist for common alerts

---

## Troubleshooting

### Logs Not Appearing

**AWS:**
1. Check ECS task definition has `logConfiguration`
2. Verify IAM role has CloudWatch Logs permissions
3. Check log group exists: `/ecs/trustx-task`

**Azure:**
1. Enable diagnostic settings in App Service
2. Verify Log Analytics workspace is linked
3. Check Application Insights connection string

### High Costs

1. Reduce log retention period
2. Use metric filters instead of querying raw logs
3. Archive old logs to cheaper storage (S3/Blob)
4. Sample high-volume endpoints

### Missing Correlation

1. Ensure middleware adds `requestId` to all requests
2. Pass `requestId` to all function calls
3. Include in error responses for client-side tracking

---

## Reflection

### What We Achieved

✅ **Structured Logging**
- JSON format for easy parsing
- Correlation IDs for request tracing
- Multiple log levels (debug, info, warn, error)
- Performance tracking utilities

✅ **Cloud Integration**
- AWS CloudWatch Logs with ECS
- Azure Monitor with Application Insights
- Automated log collection and aggregation
- Real-time log streaming

✅ **Metrics and Monitoring**
- Custom metric filters (error rate, response time)
- Performance metrics (CPU, memory, latency)
- Security metrics (failed logins, suspicious activity)

✅ **Alerting**
- Threshold-based alarms
- Multi-channel notifications (email, Slack)
- Escalation policies

✅ **Observability**
- Dashboards for operational visibility
- Query templates for common analysis
- Request correlation for debugging

### On-Call Readiness

**Runbook Template:**

```markdown
# Alert: High Error Rate

## Severity: High

## Description
Error rate exceeded 10 errors in 5 minutes

## Investigation Steps
1. Check CloudWatch dashboard: [link]
2. Run error query: [query]
3. Check recent deployments
4. Review error messages for patterns

## Common Causes
- Bad deployment
- Database connectivity issues
- External service outage
- Configuration error

## Mitigation
- Rollback last deployment
- Restart service
- Check database status
- Verify external dependencies

## Escalation
If not resolved in 30 minutes, contact: [name]
```

### Team Workflows

1. **Daily:** Review dashboard for anomalies
2. **Weekly:** Analyze error trends, optimize slow endpoints
3. **Monthly:** Review alert thresholds, update runbooks
4. **Quarterly:** Archive old logs, review retention policy

### Cost Optimization

- Log retention: 14 days (operational), 90 days (audit)
- Estimated costs: $5-20/month for small-medium apps
- Archive to S3/Blob after 30 days
- Use sampling for high-traffic endpoints

---

## Additional Resources

- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Azure Monitor Kusto Query Language](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
- [scripts/cloudwatch-queries.txt](scripts/cloudwatch-queries.txt) - Sample queries
- [scripts/azure-monitor-queries.txt](scripts/azure-monitor-queries.txt) - Kusto queries
- [src/lib/logger.ts](src/lib/logger.ts) - Logger implementation
- [src/lib/requestLogger.ts](src/lib/requestLogger.ts) - Request middleware

---

**Last Updated:** January 5, 2026
