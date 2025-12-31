# Secret Rotation Strategy Guide

## Overview

This document outlines the **secret rotation strategy** for the TrustX application, including automated rotation procedures, manual rotation steps, access review practices, and monitoring recommendations.

Proper secret rotation is critical for maintaining security and limiting the impact of potential credential leaks.

---

## Table of Contents

1. [Why Rotate Secrets?](#why-rotate-secrets)
2. [Rotation Schedule](#rotation-schedule)
3. [Automated Rotation (AWS)](#automated-rotation-aws)
4. [Automated Rotation (Azure)](#automated-rotation-azure)
5. [Manual Rotation Procedures](#manual-rotation-procedures)
6. [Access Review & Auditing](#access-review--auditing)
7. [Emergency Rotation](#emergency-rotation)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Why Rotate Secrets?

**Security Benefits:**
- ✅ **Limits exposure window** if credentials are compromised
- ✅ **Reduces attack surface** by invalidating old credentials
- ✅ **Compliance requirement** for many security standards (SOC 2, PCI DSS, HIPAA)
- ✅ **Detects dormant accounts** through access pattern changes
- ✅ **Forces review** of who has access to what

**Real-World Scenario:**
> A developer accidentally commits a database password to a public GitHub repository. With regular 90-day rotation, that password is only valid for a maximum of 90 days, significantly limiting the potential damage.

---

## Rotation Schedule

### Recommended Frequencies

| Secret Type | Rotation Frequency | Priority | Automation |
|-------------|-------------------|----------|------------|
| **Database Passwords** | Every 90 days | 🔴 High | Recommended |
| **API Keys** (external services) | Every 180 days | 🟡 Medium | Optional |
| **JWT Secrets** | Every 365 days | 🟢 Low | Manual |
| **Service Principal Secrets** | Every 365 days | 🟡 Medium | Manual |
| **Encryption Keys** | Every 2-3 years | 🟢 Low | Manual |
| **Access Review** | Monthly | 🔴 High | Manual |

### Compliance Requirements

- **SOC 2:** Requires documented rotation procedures and quarterly reviews
- **PCI DSS:** Requires password changes every 90 days
- **HIPAA:** Recommends unique passwords changed at least annually
- **GDPR:** Requires regular security reviews and access audits

---

## Automated Rotation (AWS)

### Prerequisites

1. AWS Secrets Manager secret created
2. Lambda function for rotation logic
3. IAM role with appropriate permissions

### Step 1: Create Rotation Lambda Function

```bash
# Clone AWS rotation template
git clone https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas

# Deploy PostgreSQL rotation function
cd SecretsManagerRDSPostgreSQLRotationSingleUser
sam build
sam deploy --guided
```

### Step 2: Enable Automatic Rotation

```bash
# Enable rotation for database secret
aws secretsmanager rotate-secret \
  --secret-id nextjs/trustx-app-secrets \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:SecretsManagerRotation \
  --rotation-rules AutomaticallyAfterDays=90

# Verify rotation configuration
aws secretsmanager describe-secret --secret-id nextjs/trustx-app-secrets
```

### Step 3: Test Rotation

```bash
# Trigger immediate rotation test
aws secretsmanager rotate-secret \
  --secret-id nextjs/trustx-app-secrets \
  --rotation-lambda-arn arn:aws:lambda:REGION:ACCOUNT:function:SecretsManagerRotation

# Check rotation status
aws secretsmanager describe-secret \
  --secret-id nextjs/trustx-app-secrets \
  --query 'RotationEnabled'
```

### Rotation Lambda Example (Simplified)

```python
import boto3
import psycopg2
import random
import string

def lambda_handler(event, context):
    service_client = boto3.client('secretsmanager')
    secret_arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    if step == "createSecret":
        # Generate new password
        new_password = generate_password()
        service_client.put_secret_value(
            SecretId=secret_arn,
            ClientRequestToken=token,
            SecretString=json.dumps({"password": new_password}),
            VersionStages=['AWSPENDING']
        )
    
    elif step == "setSecret":
        # Update database with new password
        current_secret = get_secret(secret_arn, "AWSCURRENT")
        pending_secret = get_secret(secret_arn, "AWSPENDING")
        
        conn = psycopg2.connect(**current_secret)
        cursor = conn.cursor()
        cursor.execute(f"ALTER USER {current_secret['username']} PASSWORD %s", 
                      (pending_secret['password'],))
        conn.commit()
    
    elif step == "testSecret":
        # Verify new password works
        pending_secret = get_secret(secret_arn, "AWSPENDING")
        test_conn = psycopg2.connect(**pending_secret)
        test_conn.close()
    
    elif step == "finishSecret":
        # Move AWSPENDING to AWSCURRENT
        service_client.update_secret_version_stage(
            SecretId=secret_arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token
        )
```

---

## Automated Rotation (Azure)

### Prerequisites

1. Azure Key Vault created
2. Azure Function or Logic App for rotation
3. Managed Identity with Key Vault permissions

### Step 1: Create Azure Function for Rotation

```bash
# Create function app
az functionapp create \
  --name func-secret-rotation \
  --resource-group trustx-resources \
  --storage-account trustxstorage \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4

# Enable managed identity
az functionapp identity assign \
  --name func-secret-rotation \
  --resource-group trustx-resources

# Grant Key Vault permissions
PRINCIPAL_ID=$(az functionapp identity show --name func-secret-rotation --resource-group trustx-resources --query principalId --output tsv)

az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee $PRINCIPAL_ID \
  --scope "/subscriptions/SUBSCRIPTION_ID/resourceGroups/trustx-resources/providers/Microsoft.KeyVault/vaults/kv-trustx-app"
```

### Step 2: Deploy Rotation Function

**function.json:**
```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 0 */90 * *"
    }
  ]
}
```

**index.js:**
```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
const { Client } = require('pg');

module.exports = async function (context, myTimer) {
  const vaultUrl = process.env.KEYVAULT_URL;
  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  
  // Get current database password
  const currentSecret = await client.getSecret('DATABASE-URL');
  const currentPassword = extractPassword(currentSecret.value);
  
  // Generate new password
  const newPassword = generatePassword(32);
  
  // Update database
  const dbClient = new Client({ connectionString: currentSecret.value });
  await dbClient.connect();
  await dbClient.query(`ALTER USER adminuser PASSWORD '${newPassword}'`);
  await dbClient.end();
  
  // Update Key Vault
  const newConnectionString = currentSecret.value.replace(currentPassword, newPassword);
  await client.setSecret('DATABASE-URL', newConnectionString);
  
  context.log('Password rotated successfully');
};

function generatePassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function extractPassword(connectionString) {
  const match = connectionString.match(/:([^@]+)@/);
  return match ? match[1] : null;
}
```

### Step 3: Test Rotation

```bash
# Manually trigger function
az functionapp function test \
  --name func-secret-rotation \
  --function-name RotateSecrets \
  --resource-group trustx-resources

# Check function logs
az functionapp logs tail \
  --name func-secret-rotation \
  --resource-group trustx-resources
```

---

## Manual Rotation Procedures

### Database Passwords

#### PostgreSQL (AWS RDS)

1. **Generate new password:**
```bash
NEW_PASSWORD=$(openssl rand -base64 24)
echo $NEW_PASSWORD
```

2. **Update database:**
```bash
# Connect with current credentials
psql "postgresql://adminuser:CURRENT_PASSWORD@your-rds-endpoint:5432/trustxdb"

# Change password
ALTER USER adminuser PASSWORD 'NEW_PASSWORD';
\q
```

3. **Update Secrets Manager:**
```bash
# Get current secret
aws secretsmanager get-secret-value \
  --secret-id nextjs/trustx-app-secrets \
  --query SecretString \
  --output text > current-secret.json

# Update password in JSON
jq '.DATABASE_URL = "postgresql://adminuser:NEW_PASSWORD@your-rds-endpoint:5432/trustxdb?sslmode=require"' \
  current-secret.json > new-secret.json

# Update secret
aws secretsmanager put-secret-value \
  --secret-id nextjs/trustx-app-secrets \
  --secret-string file://new-secret.json

# Clean up
rm current-secret.json new-secret.json
```

4. **Verify application:**
```bash
# Test secret retrieval
curl https://your-app.com/api/health/secrets

# Check application logs
aws logs tail /aws/lambda/your-function-name --follow
```

#### PostgreSQL (Azure)

1. **Generate new password:**
```bash
NEW_PASSWORD=$(openssl rand -base64 24)
echo $NEW_PASSWORD
```

2. **Update database:**
```bash
# Connect with current credentials
psql "host=your-server.postgres.database.azure.com port=5432 dbname=trustxdb user=adminuser@your-server password=CURRENT_PASSWORD sslmode=require"

# Change password
ALTER USER adminuser PASSWORD 'NEW_PASSWORD';
\q
```

3. **Update Key Vault:**
```bash
# Update secret
az keyvault secret set \
  --vault-name kv-trustx-app \
  --name DATABASE-URL \
  --value "postgresql://adminuser:NEW_PASSWORD@your-server.postgres.database.azure.com:5432/trustxdb?sslmode=require"
```

4. **Force cache refresh:**
```bash
curl -X POST https://your-app.com/api/health/secrets/refresh
```

### JWT Secrets

1. **Generate new JWT secret:**
```bash
NEW_JWT_SECRET=$(openssl rand -base64 64)
echo $NEW_JWT_SECRET
```

2. **Update secrets manager:**
```bash
# AWS
aws secretsmanager put-secret-value \
  --secret-id nextjs/trustx-app-secrets \
  --secret-string "{\"JWT_SECRET\":\"$NEW_JWT_SECRET\", ...other secrets...}"

# Azure
az keyvault secret set \
  --vault-name kv-trustx-app \
  --name JWT-SECRET \
  --value "$NEW_JWT_SECRET"
```

3. **Gradual rollout strategy:**
   - Keep old secret active for 24 hours
   - Allow both old and new tokens during transition
   - Fully switch to new secret after grace period

### API Keys (External Services)

1. **SendGrid API Key:**
```bash
# Generate new key in SendGrid dashboard
# https://app.sendgrid.com/settings/api_keys

# Update secrets
aws secretsmanager put-secret-value \
  --secret-id nextjs/trustx-app-secrets \
  --secret-string "{\"SENDGRID_API_KEY\":\"NEW_KEY\", ...}"

# Delete old key in SendGrid dashboard
```

2. **AWS Access Keys:**
```bash
# Create new access key
aws iam create-access-key --user-name trustx-storage-uploader

# Update secrets
aws secretsmanager put-secret-value \
  --secret-id nextjs/trustx-app-secrets \
  --secret-string "{\"AWS_ACCESS_KEY_ID\":\"NEW_KEY\", \"AWS_SECRET_ACCESS_KEY\":\"NEW_SECRET\", ...}"

# Delete old access key
aws iam delete-access-key --user-name trustx-storage-uploader --access-key-id OLD_KEY_ID
```

### Service Principal (Azure)

```bash
# Reset service principal credentials
az ad sp credential reset \
  --id APP_ID \
  --append

# Get new secret
NEW_SECRET=$(az ad sp credential list --id APP_ID --query "[0].secretText" --output tsv)

# Update Key Vault
az keyvault secret set \
  --vault-name kv-trustx-app \
  --name AZURE-CLIENT-SECRET \
  --value "$NEW_SECRET"

# Remove old credentials (after verifying new ones work)
az ad sp credential delete \
  --id APP_ID \
  --key-id OLD_KEY_ID
```

---

## Access Review & Auditing

### Monthly Access Review Checklist

- [ ] **Review IAM users/roles** with secrets access
- [ ] **Check CloudTrail/Azure Activity logs** for unauthorized access
- [ ] **Audit who can modify secrets**
- [ ] **Remove access for departed employees**
- [ ] **Verify least-privilege principle** is followed
- [ ] **Document any exceptions** to rotation schedule

### AWS CloudTrail Monitoring

```bash
# Query secrets access events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::SecretsManager::Secret \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --max-results 50

# Create CloudWatch alarm for secret access
aws cloudwatch put-metric-alarm \
  --alarm-name UnauthorizedSecretAccess \
  --metric-name SecretAccess \
  --namespace AWS/SecretsManager \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:region:account-id:SecurityAlerts
```

### Azure Audit Logs

```bash
# Query Key Vault access logs
az monitor activity-log list \
  --resource-id "/subscriptions/SUBSCRIPTION_ID/resourceGroups/trustx-resources/providers/Microsoft.KeyVault/vaults/kv-trustx-app" \
  --start-time 2025-01-01T00:00:00Z \
  --query "[?contains(operationName.value, 'MICROSOFT.KEYVAULT')]"

# Enable diagnostic logging
az monitor diagnostic-settings create \
  --name KeyVaultAudit \
  --resource "/subscriptions/SUBSCRIPTION_ID/resourceGroups/trustx-resources/providers/Microsoft.KeyVault/vaults/kv-trustx-app" \
  --logs '[{"category":"AuditEvent","enabled":true}]' \
  --workspace LOG_ANALYTICS_WORKSPACE_ID
```

---

## Emergency Rotation

### When to Perform Emergency Rotation

🚨 **Immediate rotation required when:**
- Secret committed to public repository
- Employee with access departs unexpectedly
- Suspected compromise or breach
- Security audit finding
- Compliance violation

### Emergency Rotation Procedure

1. **Assess scope of exposure**
2. **Rotate affected secrets immediately**
3. **Revoke old credentials**
4. **Force application restart** (to load new secrets)
5. **Review access logs** for unauthorized usage
6. **Document incident** for compliance
7. **Notify security team**

### Example: GitHub Leak Response

```bash
# 1. Immediately rotate all secrets
./scripts/emergency-rotate.sh

# 2. Revoke compromised credentials
aws iam delete-access-key --access-key-id LEAKED_KEY_ID --user-name trustx-app

# 3. Force application restart
aws ecs update-service --cluster trustx-cluster --service trustx-app --force-new-deployment

# 4. Search GitHub for leaked credentials
gh api /search/code?q="AWS_ACCESS_KEY_ID+LEAKED_KEY_ID"

# 5. File DMCA takedown if found in public repos
# https://github.com/contact/dmca

# 6. Document incident
echo "$(date) - Emergency rotation due to GitHub leak" >> security-incidents.log
```

---

## Best Practices

### Do's ✅

- **Use secrets manager** for all sensitive values
- **Enable automatic rotation** where possible
- **Use Managed Identity/IAM roles** instead of credentials
- **Monitor access** with CloudTrail/Azure logs
- **Test rotation** before enabling automation
- **Document procedures** for manual rotation
- **Set calendar reminders** for manual rotations
- **Use strong passwords** (24+ random characters)
- **Implement gradual rollout** for JWT secrets
- **Keep rotation history** for audit compliance

### Don'ts ❌

- **Never commit secrets** to version control
- **Don't use same password** across environments
- **Avoid manual password** generation (use tools)
- **Don't skip testing** after rotation
- **Never share secrets** via email/Slack
- **Don't hardcode credentials** in application code
- **Avoid overly frequent rotation** (can cause outages)
- **Don't forget database connection pools** (need restart)
- **Never delete old versions** immediately (keep 2-3 for rollback)

---

## Troubleshooting

### Common Issues

#### Application Can't Connect After Rotation

**Cause:** Application still using cached old credentials

**Solution:**
```bash
# Force secrets cache refresh
curl -X POST https://your-app.com/api/health/secrets/refresh

# Or restart application
aws ecs update-service --cluster trustx-cluster --service trustx-app --force-new-deployment
```

#### Rotation Lambda Times Out

**Cause:** Database connection taking too long

**Solution:**
- Increase Lambda timeout (default 3s → 30s)
- Check database security group allows Lambda access
- Verify VPC configuration if Lambda is in VPC

#### Rotation Fails Halfway

**Cause:** Error during password update

**Solution:**
```bash
# Rollback to previous version
aws secretsmanager update-secret-version-stage \
  --secret-id nextjs/trustx-app-secrets \
  --version-stage AWSCURRENT \
  --remove-from-version-id CURRENT_VERSION \
  --move-to-version-id PREVIOUS_VERSION
```

#### Access Denied After Rotation

**Cause:** IAM policy references specific secret ARN version

**Solution:**
- Use wildcard in ARN: `arn:aws:secretsmanager:region:account:secret:name-*`
- Update IAM policy to allow all versions

---

## Monitoring & Alerts

### Metrics to Track

| Metric | Threshold | Action |
|--------|-----------|--------|
| Days since last rotation | > 90 days | Trigger rotation |
| Failed rotation attempts | > 3 in 24h | Investigate |
| Secret access count | > 1000/hour | Check for abuse |
| Unauthorized access attempts | > 0 | Security review |

### Setup Alerts

**AWS CloudWatch:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name SecretsNotRotated \
  --metric-name DaysSinceRotation \
  --namespace Custom/SecretsManager \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:region:account:SecurityAlerts
```

**Azure Monitor:**
```bash
az monitor metrics alert create \
  --name SecretsNotRotated \
  --resource-group trustx-resources \
  --scopes "/subscriptions/SUBSCRIPTION_ID/resourceGroups/trustx-resources/providers/Microsoft.KeyVault/vaults/kv-trustx-app" \
  --condition "count KeyVaultRequests > 1000" \
  --window-size 1h \
  --evaluation-frequency 5m \
  --action security-alerts
```

---

## Compliance Checklist

### SOC 2

- [ ] Document rotation procedures
- [ ] Quarterly access reviews
- [ ] Audit logs retained for 1 year
- [ ] Automated alerts configured
- [ ] Incident response plan documented

### PCI DSS

- [ ] Passwords changed every 90 days
- [ ] Password complexity requirements met
- [ ] Audit trail of password changes
- [ ] Least-privilege access enforced
- [ ] Encryption at rest and in transit

### HIPAA

- [ ] Unique passwords for each user
- [ ] Annual password changes minimum
- [ ] Access logs monitored
- [ ] Breach notification procedures
- [ ] Encryption of ePHI

---

## Additional Resources

- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [Azure Key Vault Rotation](https://learn.microsoft.com/en-us/azure/key-vault/secrets/tutorial-rotation)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

**Last Updated:** December 31, 2025  
**Version:** 1.0  
**Owner:** Security Team
