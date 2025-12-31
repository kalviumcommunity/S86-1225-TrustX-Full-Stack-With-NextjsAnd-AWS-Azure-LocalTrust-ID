# Database Connection Test Scripts

This directory contains scripts for testing and validating database connections to cloud providers (AWS RDS, Azure PostgreSQL).

## Quick Test

Test your database connection:

```bash
npm run test:db
```

## Available Scripts

### 1. Basic Connection Test
```bash
node scripts/test-db-connection.js
```

Tests:
- Database connectivity
- Query execution
- Response time
- Connection pool status

### 2. Comprehensive Health Check
```bash
node scripts/test-db-health.js
```

Tests:
- All basic connection tests
- Database version and info
- Table access permissions
- Connection pool limits
- SSL/TLS configuration

### 3. Load Test
```bash
node scripts/test-db-load.js
```

Simulates:
- Concurrent connections
- Query load
- Connection pool exhaustion
- Recovery from failures

## Manual Testing

### Using psql (PostgreSQL CLI)

**AWS RDS:**
```bash
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U adminuser \
     -d trustxdb \
     -p 5432
```

**Azure PostgreSQL:**
```bash
psql "host=your-server.postgres.database.azure.com \
      port=5432 \
      dbname=trustxdb \
      user=adminuser \
      sslmode=require"
```

### Using curl (API Health Check)

**Quick Health Check:**
```bash
curl http://localhost:3000/api/health/db
```

**Detailed Health Check:**
```bash
curl "http://localhost:3000/api/health/db?detailed=true"
```

**Comprehensive Test:**
```bash
curl -X POST http://localhost:3000/api/health/db
```

## Troubleshooting

### Connection Refused
- Check if database server is running
- Verify firewall rules allow your IP
- Confirm security group configuration

### Authentication Failed
- Verify username and password
- Check if user has proper permissions
- Ensure password doesn't contain special characters that need escaping

### SSL/TLS Errors
- Add `?sslmode=require` to connection string for cloud databases
- Use `?sslmode=disable` for local development only
- Verify SSL certificates are not expired

### Connection Pool Exhausted
- Increase `DATABASE_CONNECTION_LIMIT` environment variable
- Check for connection leaks in your code
- Monitor connection usage with health check endpoint

### Timeout Errors
- Increase `DATABASE_CONNECTION_TIMEOUT`
- Check network latency to database server
- Verify database server is not overloaded

## Environment Variables

```bash
# Connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Connection pool settings
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_POOL_TIMEOUT=10000
DATABASE_STATEMENT_TIMEOUT=30000

# For Vercel and serverless platforms
DIRECT_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

## Best Practices

1. **Use Environment Variables**: Never hardcode credentials
2. **Enable SSL**: Always use `sslmode=require` for production
3. **Connection Pooling**: Configure appropriate pool size for your workload
4. **Health Checks**: Implement health check endpoints for monitoring
5. **Retry Logic**: Use retry mechanisms for transient failures
6. **Monitoring**: Set up alerts for connection failures
7. **Timeouts**: Configure appropriate timeouts for your use case

## Resources

- [Prisma Cloud Database Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Azure Database for PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
