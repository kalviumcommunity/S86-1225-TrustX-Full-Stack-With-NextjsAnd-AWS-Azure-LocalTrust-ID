#!/bin/bash

# AWS CloudWatch Logs Setup Script
# Creates log groups, metric filters, and alarms for monitoring

set -e

# Configuration
AWS_REGION="${AWS_REGION:-ap-south-1}"
LOG_GROUP_NAME="/ecs/trustx-task"
RETENTION_DAYS=14
SNS_TOPIC_ARN="${SNS_TOPIC_ARN:-arn:aws:sns:${AWS_REGION}:YOUR_ACCOUNT_ID:cloudwatch-alarms}"

echo "🔧 Setting up AWS CloudWatch Logs and Monitoring..."
echo "Region: $AWS_REGION"
echo "Log Group: $LOG_GROUP_NAME"

# Step 1: Create/Update CloudWatch Log Group
echo ""
echo "📝 Step 1: Creating CloudWatch Log Group..."
aws logs create-log-group \
  --log-group-name "$LOG_GROUP_NAME" \
  --region "$AWS_REGION" 2>/dev/null || echo "Log group already exists"

# Set retention policy
aws logs put-retention-policy \
  --log-group-name "$LOG_GROUP_NAME" \
  --retention-in-days "$RETENTION_DAYS" \
  --region "$AWS_REGION"

echo "✅ Log group configured with ${RETENTION_DAYS}-day retention"

# Step 2: Create Metric Filters
echo ""
echo "📊 Step 2: Creating Metric Filters..."

# Error Count Metric Filter
aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name "ErrorCount" \
  --filter-pattern '{ $.level = "error" }' \
  --metric-transformations \
    metricName=ErrorCount,\
metricNamespace=TrustX/Application,\
metricValue=1,\
unit=Count \
  --region "$AWS_REGION"

echo "✅ ErrorCount metric filter created"

# Warning Count Metric Filter
aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name "WarningCount" \
  --filter-pattern '{ $.level = "warn" }' \
  --metric-transformations \
    metricName=WarningCount,\
metricNamespace=TrustX/Application,\
metricValue=1,\
unit=Count \
  --region "$AWS_REGION"

echo "✅ WarningCount metric filter created"

# Failed Login Attempts
aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name "FailedLoginAttempts" \
  --filter-pattern '{ $.context.authEvent = "login_failed" }' \
  --metric-transformations \
    metricName=FailedLoginAttempts,\
metricNamespace=TrustX/Security,\
metricValue=1,\
unit=Count \
  --region "$AWS_REGION"

echo "✅ FailedLoginAttempts metric filter created"

# API Response Time (p50)
aws logs put-metric-filter \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name "APIResponseTime" \
  --filter-pattern '{ $.context.duration = * }' \
  --metric-transformations \
    metricName=APIResponseTime,\
metricNamespace=TrustX/Performance,\
metricValue=$.context.duration,\
unit=Milliseconds \
  --region "$AWS_REGION"

echo "✅ APIResponseTime metric filter created"

# Step 3: Create CloudWatch Alarms
echo ""
echo "🚨 Step 3: Creating CloudWatch Alarms..."

# High Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "TrustX-HighErrorRate" \
  --alarm-description "Alert when error rate exceeds 10 errors in 5 minutes" \
  --metric-name ErrorCount \
  --namespace TrustX/Application \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region "$AWS_REGION"

echo "✅ HighErrorRate alarm created"

# High Response Time Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "TrustX-HighResponseTime" \
  --alarm-description "Alert when average response time exceeds 2 seconds" \
  --metric-name APIResponseTime \
  --namespace TrustX/Performance \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 2000 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region "$AWS_REGION"

echo "✅ HighResponseTime alarm created"

# Failed Login Alarm (Security)
aws cloudwatch put-metric-alarm \
  --alarm-name "TrustX-ExcessiveFailedLogins" \
  --alarm-description "Alert when failed login attempts exceed 20 in 5 minutes" \
  --metric-name FailedLoginAttempts \
  --namespace TrustX/Security \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --region "$AWS_REGION"

echo "✅ ExcessiveFailedLogins alarm created"

# Step 4: Create Dashboard
echo ""
echo "📈 Step 4: Creating CloudWatch Dashboard..."

DASHBOARD_BODY=$(cat <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["TrustX/Application", "ErrorCount", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$AWS_REGION",
        "title": "Error Count (5min)",
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["TrustX/Performance", "APIResponseTime", {"stat": "Average"}],
          ["...", {"stat": "p99"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$AWS_REGION",
        "title": "API Response Time (ms)",
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "$AWS_REGION",
        "title": "Container Resources"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["TrustX/Security", "FailedLoginAttempts", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "$AWS_REGION",
        "title": "Failed Login Attempts (5min)"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '$LOG_GROUP_NAME'\n| fields @timestamp, level, message, context.requestId\n| filter level = \"error\"\n| sort @timestamp desc\n| limit 20",
        "region": "$AWS_REGION",
        "title": "Recent Errors",
        "stacked": false
      }
    }
  ]
}
EOF
)

aws cloudwatch put-dashboard \
  --dashboard-name "TrustX-Application-Monitoring" \
  --dashboard-body "$DASHBOARD_BODY" \
  --region "$AWS_REGION"

echo "✅ Dashboard created: TrustX-Application-Monitoring"

# Step 5: Summary
echo ""
echo "✨ CloudWatch Setup Complete!"
echo ""
echo "📊 View your dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=TrustX-Application-Monitoring"
echo ""
echo "📝 View logs:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/\$252Fecs\$252Ftrustx-task"
echo ""
echo "🔍 Sample log queries:"
echo "   # All errors in last hour:"
echo "   fields @timestamp, message, context.requestId"
echo "   | filter level = \"error\""
echo "   | sort @timestamp desc"
echo ""
echo "   # Slow API requests (>1s):"
echo "   fields @timestamp, context.endpoint, context.duration"
echo "   | filter context.duration > 1000"
echo "   | sort context.duration desc"
echo ""
echo "   # Failed login attempts:"
echo "   fields @timestamp, context.email, context.userId"
echo "   | filter context.authEvent = \"login_failed\""
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Update YOUR_ACCOUNT_ID in this script"
echo "   2. Create SNS topic for alarm notifications"
echo "   3. Subscribe to alarm notifications (email/Slack)"
