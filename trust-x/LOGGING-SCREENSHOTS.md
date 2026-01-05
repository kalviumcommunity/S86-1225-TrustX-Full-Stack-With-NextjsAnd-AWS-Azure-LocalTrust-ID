# Logging and Monitoring - Screenshots and Visual Guide

## Dashboard Screenshots

### AWS CloudWatch Dashboard

#### Main Dashboard View
![CloudWatch Dashboard](screenshots/cloudwatch-dashboard.png)

**What you'll see:**
- **Error Count Widget** (Top Left): Line graph showing error rate over time
  - Y-axis: Number of errors
  - X-axis: Time (5-minute intervals)
  - Threshold line at 10 errors

- **API Response Time Widget** (Top Right): Multi-line graph
  - Blue line: Average response time
  - Orange line: P99 response time
  - Target: Keep average under 500ms, P99 under 2s

- **Container Resources Widget** (Bottom Left): Dual-axis graph
  - Green line: CPU Utilization (%)
  - Purple line: Memory Utilization (%)
  - Alert threshold: 80%

- **Failed Login Attempts Widget** (Bottom Right): Bar chart
  - Shows security events over time
  - Alert if >20 attempts in 5 minutes

#### CloudWatch Logs Insights
![CloudWatch Logs Insights](screenshots/cloudwatch-logs.png)

**Sample Query Result:**
```
| @timestamp               | level | message              | requestId         | endpoint      |
|-------------------------|-------|----------------------|-------------------|---------------|
| 2026-01-05 10:30:15.234 | error | Database timeout     | 1736073015234-xyz | /api/users    |
| 2026-01-05 10:28:42.567 | error | Authentication failed| 1736072922567-abc | /api/auth/login|
| 2026-01-05 10:25:11.890 | error | Validation error     | 1736072711890-def | /api/products |
```

#### CloudWatch Alarms
![CloudWatch Alarms](screenshots/cloudwatch-alarms.png)

**Alarm States:**
- 🟢 **OK** - Normal operation (green checkmark)
- 🔴 **ALARM** - Threshold exceeded (red exclamation)
- 🟡 **INSUFFICIENT_DATA** - Not enough data yet (gray question mark)

### Azure Monitor Dashboard

#### Application Insights Overview
![Azure Application Insights](screenshots/azure-app-insights.png)

**Sections Visible:**
1. **Failed Requests** - Count and percentage
2. **Server Response Time** - Average, P50, P95, P99
3. **Server Requests** - Total volume
4. **Availability** - Uptime percentage

#### Azure Log Analytics Query
![Azure Logs Query](screenshots/azure-logs-query.png)

**Sample Kusto Query:**
```kusto
AppServiceConsoleLogs
| where TimeGenerated > ago(1h)
| where Level == "Error"
| project TimeGenerated, Message
| order by TimeGenerated desc
```

**Result Table:**
```
| TimeGenerated            | Message                                                    |
|-------------------------|------------------------------------------------------------|
| 2026-01-05T10:30:15Z    | {"level":"error","message":"Database timeout",...}         |
| 2026-01-05T10:28:42Z    | {"level":"error","message":"Authentication failed",...}    |
```

#### Azure Monitor Metrics
![Azure Monitor Metrics](screenshots/azure-metrics.png)

**Metric Charts:**
- **HTTP 5xx Errors** - Server errors over time
- **Response Time** - P50, P90, P95, P99 percentiles
- **CPU Percentage** - App Service CPU usage
- **Memory Working Set** - Memory consumption

---

## Log Entry Examples

### 1. Successful API Request
```json
{
  "timestamp": "2026-01-05T10:30:00.123Z",
  "level": "info",
  "message": "API request completed",
  "requestId": "1736073000123-abc123",
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

### 2. Error with Stack Trace
```json
{
  "timestamp": "2026-01-05T10:30:15.234Z",
  "level": "error",
  "message": "Database query failed",
  "requestId": "1736073015234-xyz789",
  "context": {
    "service": "trustx-app",
    "environment": "production",
    "endpoint": "/api/products",
    "method": "POST",
    "userId": "user-456"
  },
  "error": {
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n    at Database.query (db.ts:45)\n    at handler (route.ts:23)",
    "code": "ETIMEDOUT"
  }
}
```

### 3. Authentication Event
```json
{
  "timestamp": "2026-01-05T10:28:42.567Z",
  "level": "warn",
  "message": "Authentication: login_failed",
  "requestId": "1736072922567-def456",
  "context": {
    "service": "trustx-app",
    "environment": "production",
    "userId": null,
    "success": false,
    "authEvent": "login_failed",
    "email": "user@example.com"
  }
}
```

### 4. Performance Tracking
```json
{
  "timestamp": "2026-01-05T10:29:30.890Z",
  "level": "debug",
  "message": "Performance: database-query",
  "requestId": "1736072970890-ghi789",
  "context": {
    "service": "trustx-app",
    "environment": "production",
    "operation": "database-query",
    "duration": 234
  }
}
```

### 5. Cache Operation
```json
{
  "timestamp": "2026-01-05T10:31:05.123Z",
  "level": "debug",
  "message": "Cache hit",
  "requestId": "1736073065123-jkl012",
  "context": {
    "service": "trustx-app",
    "environment": "production",
    "cacheKey": "users:list:page=1:limit=10:search="
  }
}
```

---

## Query Examples with Results

### CloudWatch Query: Error Rate by Endpoint

**Query:**
```
fields context.endpoint as endpoint
| filter level = "error"
| stats count() as error_count by endpoint
| sort error_count desc
```

**Result:**
```
| endpoint          | error_count |
|-------------------|-------------|
| /api/products     | 15          |
| /api/users        | 8           |
| /api/auth/login   | 5           |
| /api/orders       | 2           |
```

### Azure Query: Response Time Percentiles

**Query:**
```kusto
AppServiceHTTPLogs
| where TimeGenerated > ago(24h)
| summarize 
    P50 = percentile(TimeTaken, 50),
    P90 = percentile(TimeTaken, 90),
    P95 = percentile(TimeTaken, 95),
    P99 = percentile(TimeTaken, 99)
    by CsUriStem
| order by P99 desc
```

**Result:**
```
| CsUriStem         | P50  | P90   | P95   | P99   |
|-------------------|------|-------|-------|-------|
| /api/products     | 145  | 450   | 780   | 1200  |
| /api/users        | 120  | 380   | 620   | 950   |
| /api/orders       | 98   | 290   | 480   | 720   |
| /api/auth/login   | 75   | 210   | 350   | 580   |
```

---

## Alert Configuration Screenshots

### AWS SNS Topic Subscription
![SNS Subscription](screenshots/sns-subscription.png)

**Configuration:**
- Topic Name: `cloudwatch-alarms`
- Protocol: `Email`
- Endpoint: `admin@example.com`
- Status: ✅ Confirmed

### Azure Action Group
![Azure Action Group](screenshots/azure-action-group.png)

**Configuration:**
- Name: `trustx-alerts`
- Short Name: `TrustX`
- Notification Type: `Email`
- Email: `admin@example.com`
- SMS: Optional

---

## Alert Email Example

### CloudWatch Alarm Email

```
From: AWS Notifications <no-reply@sns.amazonaws.com>
Subject: ALARM: "TrustX-HighErrorRate" in AP-SOUTH-1

You are receiving this email because your Amazon CloudWatch Alarm 
"TrustX-HighErrorRate" in the AP-SOUTH-1 region has entered the ALARM state.

Alarm Details:
- Alarm Name: TrustX-HighErrorRate
- Description: Alert when error rate exceeds 10 errors in 5 minutes
- State Change: OK -> ALARM
- Reason: Threshold Crossed: 1 datapoint [15.0] was greater than the threshold [10.0]
- Timestamp: 2026-01-05 10:30:00 UTC

Affected Metric:
- Metric: ErrorCount
- Namespace: TrustX/Application
- Period: 300 seconds
- Statistic: Sum
- Value: 15

View Alarm: https://console.aws.amazon.com/cloudwatch/...
```

### Azure Alert Email

```
From: Azure Alerts <azure-noreply@microsoft.com>
Subject: Fired: TrustX-HighErrorRate on trustx-app

Alert Details:
- Alert Rule: TrustX-HighErrorRate
- Resource: trustx-app
- Severity: Error (2)
- Description: Alert when error rate exceeds 10 errors in 5 minutes
- Fired: 2026-01-05 10:30:00 UTC

Condition:
- Metric: requests/failed
- Aggregation: Total
- Threshold: Greater than 10
- Actual Value: 15
- Evaluation Period: 5 minutes

View in Portal: https://portal.azure.com/#resource/...
```

---

## How to Capture These Screenshots

### AWS CloudWatch

1. **Dashboard:**
   - Navigate to CloudWatch → Dashboards → TrustX-Application-Monitoring
   - Capture full screen or specific widgets

2. **Logs:**
   - CloudWatch → Log groups → /ecs/trustx-task
   - Open Logs Insights
   - Run a query and capture results table

3. **Alarms:**
   - CloudWatch → Alarms → All alarms
   - Capture list showing alarm states

### Azure Monitor

1. **Application Insights:**
   - Portal → Application Insights → trustx-insights
   - Overview blade shows key metrics
   - Capture overview dashboard

2. **Logs:**
   - Monitor → Logs
   - Write Kusto query
   - Execute and capture results

3. **Metrics:**
   - Application Insights → Metrics
   - Select metrics and time range
   - Capture chart

---

## Live Demo Commands

### View Logs in Real-Time (AWS)

```bash
# Tail CloudWatch logs
aws logs tail /ecs/trustx-task --follow --region ap-south-1

# Filter for errors only
aws logs tail /ecs/trustx-task --follow --filter-pattern '{ $.level = "error" }' --region ap-south-1
```

### View Logs in Real-Time (Azure)

```bash
# Stream logs from App Service
az webapp log tail --name trustx-app --resource-group trustx-rg

# Download recent logs
az webapp log download --name trustx-app --resource-group trustx-rg --log-file logs.zip
```

### Test Logging Locally

```bash
# Start the application
npm run dev

# In another terminal, trigger some requests
curl http://localhost:3000/api/users
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test"}'

# Check console for JSON logs
```

---

## Expected Outcomes

After successful setup, you should see:

✅ **In CloudWatch/Azure Monitor:**
- Log groups with structured JSON entries
- Metric filters showing error counts, response times
- Dashboards with real-time graphs
- Alarms configured and in OK state

✅ **In Your Application Logs:**
- Every API request logged with request ID
- Error logs with full stack traces
- Performance metrics for slow operations
- Cache hit/miss tracking

✅ **In Alert Emails:**
- Immediate notification when thresholds exceeded
- Clear alarm details and actual values
- Links to investigate in console

---

## Troubleshooting

If screenshots don't match:

1. **No logs appearing:**
   - Check ECS task definition has `logConfiguration`
   - Verify IAM permissions for CloudWatch Logs
   - Ensure app is outputting to stdout/stderr

2. **Metrics not showing:**
   - Wait 5-10 minutes for metric filters to populate
   - Check filter patterns match log structure
   - Verify metric namespace is correct

3. **Alarms not triggering:**
   - Test by generating errors/load
   - Check alarm evaluation period
   - Verify SNS/Action Group subscriptions confirmed

---

**Note:** Replace placeholder screenshots with actual captures from your deployment for documentation purposes.
