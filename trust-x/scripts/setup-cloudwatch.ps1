# PowerShell script for AWS CloudWatch setup
# Windows-compatible version

param(
    [string]$Region = "ap-south-1",
    [string]$LogGroup = "/ecs/trustx-task",
    [int]$RetentionDays = 14
)

Write-Host "🔧 Setting up AWS CloudWatch Logs and Monitoring..." -ForegroundColor Cyan
Write-Host "Region: $Region"
Write-Host "Log Group: $LogGroup"
Write-Host ""

# Step 1: Create/Update CloudWatch Log Group
Write-Host "📝 Step 1: Creating CloudWatch Log Group..." -ForegroundColor Yellow
try {
    aws logs create-log-group --log-group-name $LogGroup --region $Region 2>$null
    Write-Host "✅ Log group created" -ForegroundColor Green
} catch {
    Write-Host "Log group already exists" -ForegroundColor Gray
}

aws logs put-retention-policy `
    --log-group-name $LogGroup `
    --retention-in-days $RetentionDays `
    --region $Region

Write-Host "✅ Log group configured with $RetentionDays-day retention" -ForegroundColor Green
Write-Host ""

# Step 2: Create Metric Filters
Write-Host "📊 Step 2: Creating Metric Filters..." -ForegroundColor Yellow

# Error Count Metric Filter
aws logs put-metric-filter `
    --log-group-name $LogGroup `
    --filter-name "ErrorCount" `
    --filter-pattern '{ $.level = "error" }' `
    --metric-transformations "metricName=ErrorCount,metricNamespace=TrustX/Application,metricValue=1,unit=Count" `
    --region $Region

Write-Host "✅ ErrorCount metric filter created" -ForegroundColor Green

# Warning Count Metric Filter
aws logs put-metric-filter `
    --log-group-name $LogGroup `
    --filter-name "WarningCount" `
    --filter-pattern '{ $.level = "warn" }' `
    --metric-transformations "metricName=WarningCount,metricNamespace=TrustX/Application,metricValue=1,unit=Count" `
    --region $Region

Write-Host "✅ WarningCount metric filter created" -ForegroundColor Green

# Failed Login Attempts
aws logs put-metric-filter `
    --log-group-name $LogGroup `
    --filter-name "FailedLoginAttempts" `
    --filter-pattern '{ $.context.authEvent = "login_failed" }' `
    --metric-transformations "metricName=FailedLoginAttempts,metricNamespace=TrustX/Security,metricValue=1,unit=Count" `
    --region $Region

Write-Host "✅ FailedLoginAttempts metric filter created" -ForegroundColor Green

# API Response Time
aws logs put-metric-filter `
    --log-group-name $LogGroup `
    --filter-name "APIResponseTime" `
    --filter-pattern '{ $.context.duration = * }' `
    --metric-transformations "metricName=APIResponseTime,metricNamespace=TrustX/Performance,metricValue=`$.context.duration,unit=Milliseconds" `
    --region $Region

Write-Host "✅ APIResponseTime metric filter created" -ForegroundColor Green
Write-Host ""

# Step 3: Create CloudWatch Alarms
Write-Host "🚨 Step 3: Creating CloudWatch Alarms..." -ForegroundColor Yellow

# High Error Rate Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "TrustX-HighErrorRate" `
    --alarm-description "Alert when error rate exceeds 10 errors in 5 minutes" `
    --metric-name ErrorCount `
    --namespace TrustX/Application `
    --statistic Sum `
    --period 300 `
    --evaluation-periods 1 `
    --threshold 10 `
    --comparison-operator GreaterThanThreshold `
    --treat-missing-data notBreaching `
    --region $Region

Write-Host "✅ HighErrorRate alarm created" -ForegroundColor Green

# High Response Time Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "TrustX-HighResponseTime" `
    --alarm-description "Alert when average response time exceeds 2 seconds" `
    --metric-name APIResponseTime `
    --namespace TrustX/Performance `
    --statistic Average `
    --period 300 `
    --evaluation-periods 2 `
    --threshold 2000 `
    --comparison-operator GreaterThanThreshold `
    --treat-missing-data notBreaching `
    --region $Region

Write-Host "✅ HighResponseTime alarm created" -ForegroundColor Green

# Failed Login Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "TrustX-ExcessiveFailedLogins" `
    --alarm-description "Alert when failed login attempts exceed 20 in 5 minutes" `
    --metric-name FailedLoginAttempts `
    --namespace TrustX/Security `
    --statistic Sum `
    --period 300 `
    --evaluation-periods 1 `
    --threshold 20 `
    --comparison-operator GreaterThanThreshold `
    --treat-missing-data notBreaching `
    --region $Region

Write-Host "✅ ExcessiveFailedLogins alarm created" -ForegroundColor Green
Write-Host ""

Write-Host "✨ CloudWatch Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 View your dashboard at:"
Write-Host "   https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 View logs at:"
Write-Host "   https://console.aws.amazon.com/cloudwatch/home?region=$Region#logsV2:log-groups" -ForegroundColor Cyan
