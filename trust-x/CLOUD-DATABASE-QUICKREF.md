# Cloud Database Quick Reference Card

## Setup Commands

### AWS RDS PostgreSQL
```bash
# Provision database
./scripts/setup-aws-rds.sh

# Customize
DB_INSTANCE_IDENTIFIER=trustx-prod-db \
AWS_REGION=us-west-2 \
DB_INSTANCE_CLASS=db.t3.small \
./scripts/setup-aws-rds.sh
```

### Azure Database for PostgreSQL
```bash
# Provision database
./scripts/setup-azure-postgresql.sh

# Customize
RESOURCE_GROUP=trustx-prod-rg \
LOCATION=westus2 \
SKU_NAME=Standard_B2s \
./scripts/setup-azure-postgresql.sh
```

## Connection Strings

### AWS RDS
```bash
DATABASE_URL="postgresql://adminuser:PASSWORD@trustx-db.abc123.us-east-1.rds.amazonaws.com:5432/trustxdb?schema=public&sslmode=require"
```

### Azure PostgreSQL
```bash
DATABASE_URL="postgresql://adminuser:PASSWORD@trustx-db-server.postgres.database.azure.com:5432/trustxdb?schema=public&sslmode=require"
```

### Local Development
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/trustxdb?schema=public&sslmode=disable"
```

## Testing

```bash
# Comprehensive connection test
npm run test:db

# Health check API
npm run db:health

# Quick curl test
curl http://localhost:3000/api/health/db

# Detailed health check
curl "http://localhost:3000/api/health/db?detailed=true"

# Comprehensive test (POST)
curl -X POST http://localhost:3000/api/health/db
```

## Migrations

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Push schema changes (dev)
npx prisma db push

# Create new migration
npx prisma migrate dev --name add_feature

# Open Prisma Studio (GUI)
npx prisma studio
```

## Manual Connection (psql)

### AWS RDS
```bash
psql -h trustx-db.abc123.us-east-1.rds.amazonaws.com \
     -U adminuser \
     -d trustxdb \
     -p 5432
```

### Azure PostgreSQL
```bash
psql "host=trustx-db-server.postgres.database.azure.com port=5432 dbname=trustxdb user=adminuser sslmode=require"
```

### Useful psql Commands
```sql
\dt                  -- List tables
\d users             -- Describe users table
\du                  -- List users
\l                   -- List databases
SELECT version();    -- PostgreSQL version
SELECT current_database();  -- Current database
\q                   -- Quit
```

## Monitoring

### Check Status

**AWS RDS**:
```bash
aws rds describe-db-instances \
  --db-instance-identifier trustx-db \
  --query "DBInstances[0].DBInstanceStatus"
```

**Azure PostgreSQL**:
```bash
az postgres flexible-server show \
  --resource-group trustx-rg \
  --name trustx-db-server \
  --query state
```

### View Logs

**AWS CloudWatch**:
```bash
aws logs tail /aws/rds/instance/trustx-db/postgresql --follow
```

**Azure Monitor**:
```bash
az monitor activity-log list \
  --resource-group trustx-rg \
  --resource-id /subscriptions/.../providers/Microsoft.DBforPostgreSQL/flexibleServers/trustx-db
```

## Backups

### Create Manual Backup

**AWS RDS**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier trustx-db \
  --db-snapshot-identifier trustx-backup-$(date +%Y%m%d)
```

**Azure PostgreSQL**:
```bash
# Backups are automatic, but you can restore:
az postgres flexible-server restore \
  --resource-group trustx-rg \
  --name trustx-db-restored \
  --source-server trustx-db-server \
  --restore-time "2025-12-31T10:00:00Z"
```

### Export with pg_dump

```bash
# Full database
pg_dump -h trustx-db.abc123.us-east-1.rds.amazonaws.com \
        -U adminuser \
        -d trustxdb \
        -F c \
        -f trustxdb-backup-$(date +%Y%m%d).dump

# Specific table
pg_dump -h trustx-db.abc123.us-east-1.rds.amazonaws.com \
        -U adminuser \
        -d trustxdb \
        -t users \
        > users-backup.sql

# Restore
pg_restore -h trustx-db.abc123.us-east-1.rds.amazonaws.com \
           -U adminuser \
           -d trustxdb \
           trustxdb-backup.dump
```

## Firewall Rules

### Add Your IP

**AWS Security Group**:
```bash
# Get your IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --cidr ${MY_IP}/32 \
  --protocol tcp \
  --port 5432
```

**Azure Firewall**:
```bash
# Get your IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add rule
az postgres flexible-server firewall-rule create \
  --resource-group trustx-rg \
  --name trustx-db-server \
  --rule-name MyIPAccess \
  --start-ip-address ${MY_IP} \
  --end-ip-address ${MY_IP}
```

### Remove Rule

**AWS**:
```bash
aws ec2 revoke-security-group-ingress \
  --group-id sg-xxx \
  --cidr ${MY_IP}/32 \
  --protocol tcp \
  --port 5432
```

**Azure**:
```bash
az postgres flexible-server firewall-rule delete \
  --resource-group trustx-rg \
  --name trustx-db-server \
  --rule-name MyIPAccess
```

## Cost Management

### Stop Instance (Dev/Test Only)

**AWS**:
```bash
# Stop
aws rds stop-db-instance --db-instance-identifier trustx-dev-db

# Start
aws rds start-db-instance --db-instance-identifier trustx-dev-db
```

**Azure**:
```bash
# Stop
az postgres flexible-server stop -g trustx-rg -n trustx-dev-db

# Start
az postgres flexible-server start -g trustx-rg -n trustx-dev-db
```

### Check Cost

**AWS Cost Explorer**:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Azure Cost Management**:
```bash
az costmanagement query \
  --type Usage \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceGroup\",\"operator\":\"In\",\"values\":[\"trustx-rg\"]}}]}" \
  --timeframe MonthToDate
```

## Troubleshooting

### Connection Refused
```bash
# 1. Check database is running
aws rds describe-db-instances --db-instance-identifier trustx-db

# 2. Check firewall allows your IP
aws ec2 describe-security-groups --group-ids sg-xxx

# 3. Verify endpoint in DATABASE_URL
echo $DATABASE_URL
```

### Authentication Failed
```bash
# Reset password
aws rds modify-db-instance \
  --db-instance-identifier trustx-db \
  --master-user-password "NewPassword!" \
  --apply-immediately

# Update .env.local
echo 'DATABASE_URL="postgresql://adminuser:NewPassword!@..."' >> .env.local
```

### SSL Connection Error
```bash
# Add sslmode=require to connection string
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Connection Pool Exhausted
```bash
# Increase pool limit in .env.local
DATABASE_CONNECTION_LIMIT=20

# Check current usage
curl "http://localhost:3000/api/health/db?detailed=true" | jq '.details.connections'
```

### Slow Queries
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add index
CREATE INDEX idx_users_email ON users(email);
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/db?schema=public&sslmode=require

# Optional (for serverless)
DIRECT_URL=postgresql://user:password@host:5432/db?schema=public&sslmode=require

# Connection pool settings
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_POOL_TIMEOUT=10000
DATABASE_STATEMENT_TIMEOUT=30000
```

## Security Checklist

- [ ] SSL/TLS enabled (`sslmode=require`)
- [ ] Firewall rules restrict to specific IPs (not `0.0.0.0/0`)
- [ ] Strong password (20+ characters)
- [ ] Automated backups enabled (7+ days retention)
- [ ] Deletion protection enabled
- [ ] CloudWatch/Azure Monitor logs enabled
- [ ] Least-privilege database user created
- [ ] Credentials in environment variables (not hardcoded)
- [ ] Regular password rotation (90 days)
- [ ] Backup restore tested (quarterly)

## Performance Tuning

### Connection Pool Size

| Application Load | Pool Size |
|------------------|-----------|
| Low (<100 req/min) | 5-10 |
| Medium (100-1000 req/min) | 10-20 |
| High (>1000 req/min) | 20-50 |

### Query Optimization

```typescript
// ❌ Bad - N+1 query
for (const user of users) {
  await prisma.order.findMany({ where: { userId: user.id } });
}

// ✅ Good - Single query with join
await prisma.user.findMany({ include: { orders: true } });
```

### Caching

```typescript
// Check Redis cache first
const cached = await redis.get(`user:${id}`);
if (cached) return JSON.parse(cached);

// Query database
const user = await prisma.user.findUnique({ where: { id } });

// Cache for 5 minutes
await redis.setex(`user:${id}`, 300, JSON.stringify(user));
```

## Cost Estimates (Monthly)

| Configuration | AWS RDS | Azure PostgreSQL |
|---------------|---------|------------------|
| Dev/Test (t3.micro/B1ms, 20-32GB) | $19 | $22 |
| Small Prod (t3.small/B2s, 40-64GB) | $35 | $40 |
| Medium Prod (t3.medium/D2s v3, 100-128GB) | $75 | $85 |

**Savings**:
- Stop when not in use: ~70%
- Reserved instances (1 year): 30-40%
- Reserved instances (3 years): 50-60%

## Useful Links

- **AWS RDS Console**: https://console.aws.amazon.com/rds/
- **Azure Portal**: https://portal.azure.com
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Keep this card handy for quick reference!**

For detailed documentation, see:
- [README.md](README.md) - Cloud Database Configuration section
- [CLOUD-DATABASE-SUMMARY.md](CLOUD-DATABASE-SUMMARY.md) - Complete implementation summary
- [scripts/DATABASE-TESTING.md](scripts/DATABASE-TESTING.md) - Testing guide
