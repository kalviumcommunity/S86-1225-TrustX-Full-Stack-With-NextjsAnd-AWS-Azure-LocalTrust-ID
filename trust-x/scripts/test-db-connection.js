#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Tests the database connection and displays detailed information
 * about the connection status, performance, and configuration.
 * 
 * Usage:
 *   node scripts/test-db-connection.js
 *   npm run test:db
 */

const { PrismaClient } = require('@prisma/client');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logSection(message) {
  console.log('');
  log(`${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  let exitCode = 0;

  try {
    logSection('DATABASE CONNECTION TEST');
    
    // Check if DATABASE_URL is set
    logInfo('Checking environment configuration...');
    if (!process.env.DATABASE_URL) {
      logError('DATABASE_URL is not set in environment variables');
      logWarning('Please create a .env.local file with DATABASE_URL');
      process.exit(1);
    }
    
    // Parse connection string (hide password)
    const dbUrl = process.env.DATABASE_URL;
    const urlObj = new URL(dbUrl);
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    logSuccess(`DATABASE_URL is configured`);
    logInfo(`  Host: ${urlObj.hostname}`);
    logInfo(`  Port: ${urlObj.port || '5432'}`);
    logInfo(`  Database: ${urlObj.pathname.slice(1).split('?')[0]}`);
    logInfo(`  User: ${urlObj.username}`);
    logInfo(`  SSL: ${urlObj.searchParams.get('sslmode') || 'not specified'}`);
    
    // Test 1: Basic connectivity
    logSection('TEST 1: Basic Connectivity');
    logInfo('Attempting to connect to database...');
    
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      const responseTime = Date.now() - startTime;
      logSuccess(`Connected successfully in ${responseTime}ms`);
      
      if (responseTime > 1000) {
        logWarning(`Connection is slow (${responseTime}ms). Check network latency.`);
      }
    } catch (error) {
      logError(`Connection failed: ${error.message}`);
      logWarning(getConnectionErrorHint(error));
      throw error;
    }
    
    // Test 2: Database version
    logSection('TEST 2: Database Information');
    logInfo('Retrieving database version...');
    
    try {
      const versionResult = await prisma.$queryRaw`SELECT version()`;
      const version = versionResult[0].version;
      logSuccess(`PostgreSQL Version: ${version.split(',')[0]}`);
    } catch (error) {
      logWarning(`Could not retrieve version: ${error.message}`);
    }
    
    // Test 3: Current database
    logInfo('Checking current database...');
    try {
      const dbResult = await prisma.$queryRaw`SELECT current_database()`;
      const dbName = dbResult[0].current_database;
      logSuccess(`Current Database: ${dbName}`);
    } catch (error) {
      logWarning(`Could not retrieve database name: ${error.message}`);
    }
    
    // Test 4: Connection statistics
    logInfo('Gathering connection statistics...');
    try {
      const statsResult = await prisma.$queryRaw`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as current_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `;
      
      const stats = statsResult[0];
      const usage = ((stats.current_connections / stats.max_connections) * 100).toFixed(1);
      
      logSuccess(`Connection Pool:`);
      logInfo(`  Current: ${stats.current_connections}`);
      logInfo(`  Maximum: ${stats.max_connections}`);
      logInfo(`  Usage: ${usage}%`);
      
      if (parseFloat(usage) > 80) {
        logWarning('Connection pool usage is high (>80%). Consider increasing max_connections.');
      }
    } catch (error) {
      logWarning(`Could not retrieve connection stats: ${error.message}`);
    }
    
    // Test 5: Table access
    logSection('TEST 3: Schema Access');
    logInfo('Checking schema access permissions...');
    
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      if (tables.length === 0) {
        logWarning('No tables found in public schema');
        logInfo('Run "npx prisma migrate deploy" to create tables');
      } else {
        logSuccess(`Found ${tables.length} table(s) in public schema:`);
        tables.forEach(table => {
          logInfo(`  - ${table.table_name}`);
        });
      }
    } catch (error) {
      logWarning(`Could not access schema: ${error.message}`);
      logInfo('User may have limited permissions');
    }
    
    // Test 6: SSL/TLS configuration
    logSection('TEST 4: Security Configuration');
    logInfo('Checking SSL/TLS configuration...');
    
    try {
      const sslResult = await prisma.$queryRaw`
        SELECT 
          ssl as enabled,
          version as ssl_version,
          cipher as ssl_cipher
        FROM pg_stat_ssl 
        WHERE pid = pg_backend_pid()
      `;
      
      if (sslResult.length > 0 && sslResult[0].enabled) {
        logSuccess('SSL/TLS is enabled');
        logInfo(`  Version: ${sslResult[0].ssl_version || 'N/A'}`);
        logInfo(`  Cipher: ${sslResult[0].ssl_cipher || 'N/A'}`);
      } else {
        logWarning('SSL/TLS is NOT enabled');
        if (process.env.NODE_ENV === 'production') {
          logError('SSL should be enabled in production!');
          logInfo('Add "?sslmode=require" to your DATABASE_URL');
        } else {
          logInfo('OK for local development');
        }
      }
    } catch (error) {
      logWarning(`Could not check SSL status: ${error.message}`);
    }
    
    // Test 7: Write test (optional)
    logSection('TEST 5: Write Operations');
    logInfo('Testing write operations...');
    
    try {
      // Try to create and drop a test table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS _connection_test (
          id SERIAL PRIMARY KEY,
          test_value TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      await prisma.$executeRaw`INSERT INTO _connection_test (test_value) VALUES ('test')`;
      
      const testResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM _connection_test`;
      
      await prisma.$executeRaw`DROP TABLE _connection_test`;
      
      logSuccess('Write operations are working');
      logSuccess('Read operations are working');
      logSuccess('Table creation/deletion is working');
    } catch (error) {
      logWarning(`Write test failed: ${error.message}`);
      logInfo('User may have read-only permissions');
    }
    
    // Summary
    logSection('CONNECTION TEST SUMMARY');
    logSuccess('All critical tests passed!');
    logInfo('Your database is properly configured and accessible.');
    
    console.log('');
    logInfo('Next steps:');
    logInfo('  1. Run migrations: npx prisma migrate deploy');
    logInfo('  2. Generate Prisma client: npx prisma generate');
    logInfo('  3. Seed database (if needed): npx prisma db seed');
    logInfo('  4. Start your application: npm run dev');
    
    console.log('');
    logInfo('Health check endpoint:');
    logInfo('  GET  http://localhost:3000/api/health/db');
    logInfo('  GET  http://localhost:3000/api/health/db?detailed=true');
    logInfo('  POST http://localhost:3000/api/health/db (comprehensive test)');
    
  } catch (error) {
    console.log('');
    logSection('CONNECTION TEST FAILED');
    logError(`Error: ${error.message}`);
    
    if (error.code) {
      logInfo(`Error Code: ${error.code}`);
    }
    
    console.log('');
    logWarning('Troubleshooting tips:');
    logInfo(getConnectionErrorHint(error));
    
    console.log('');
    logInfo('For more help, see: scripts/DATABASE-TESTING.md');
    
    exitCode = 1;
  } finally {
    await prisma.$disconnect();
    process.exit(exitCode);
  }
}

function getConnectionErrorHint(error) {
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('econnrefused')) {
    return '• Database server is not reachable\n' +
           '  - Check if the server is running\n' +
           '  - Verify firewall rules allow access from your IP\n' +
           '  - Check security group configuration (AWS/Azure)';
  }
  
  if (errorMessage.includes('timeout')) {
    return '• Connection timed out\n' +
           '  - Check network connectivity\n' +
           '  - Verify security group rules\n' +
           '  - Increase DATABASE_CONNECTION_TIMEOUT if needed';
  }
  
  if (errorMessage.includes('authentication') || errorMessage.includes('password')) {
    return '• Authentication failed\n' +
           '  - Verify username and password are correct\n' +
           '  - Check if password contains special characters that need escaping\n' +
           '  - Ensure user has proper database permissions';
  }
  
  if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
    return '• Database does not exist\n' +
           '  - Create the database on your cloud provider\n' +
           '  - Check the database name in your connection string\n' +
           '  - Run database creation scripts';
  }
  
  if (errorMessage.includes('ssl') || errorMessage.includes('tls')) {
    return '• SSL/TLS connection issue\n' +
           '  - Add "?sslmode=require" for cloud databases\n' +
           '  - Use "?sslmode=disable" for local development only\n' +
           '  - Check if SSL certificates are valid';
  }
  
  if (errorMessage.includes('too many connections')) {
    return '• Connection pool exhausted\n' +
           '  - Increase DATABASE_CONNECTION_LIMIT\n' +
           '  - Check for connection leaks in your code\n' +
           '  - Consider using connection pooling (PgBouncer)';
  }

  return '• Check your DATABASE_URL environment variable\n' +
         '  - Ensure format: postgresql://user:password@host:5432/dbname\n' +
         '  - Verify all connection parameters are correct\n' +
         '  - Check cloud provider documentation for connection strings';
}

// Run the test
testDatabaseConnection();
