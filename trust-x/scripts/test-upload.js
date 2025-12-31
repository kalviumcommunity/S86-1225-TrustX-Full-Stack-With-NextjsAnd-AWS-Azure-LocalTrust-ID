#!/usr/bin/env node

/**
 * Upload Testing Script
 * 
 * Tests the complete file upload flow:
 * 1. Request presigned URL from API
 * 2. Upload file to cloud storage
 * 3. Verify upload completion
 * 
 * Usage:
 *   npm run test:upload
 *   node scripts/test-upload.js [file-path]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_FILE_PATH = process.argv[2] || createTestFile();

/**
 * Create a test file if none provided
 */
function createTestFile() {
  const testDir = path.join(process.cwd(), 'temp-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, 'test-upload.txt');
  const content = `Test file created at ${new Date().toISOString()}\n\nThis is a test file for cloud storage upload.\n`;
  fs.writeFileSync(filePath, content);

  info(`Created test file: ${filePath}`);
  return filePath;
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }

    req.end();
  });
}

/**
 * Test 1: Check API configuration
 */
async function testApiConfiguration() {
  log('\n========================================', 'cyan');
  log('Test 1: Check Upload Configuration', 'cyan');
  log('========================================\n', 'cyan');

  try {
    const response = await makeRequest(`${API_BASE_URL}/api/upload/presigned-url`);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      if (data.success) {
        success('Upload configuration loaded successfully');
        info(`  Provider: ${data.data.provider}`);
        info(`  Max File Size: ${data.data.maxFileSizeMB}MB`);
        info(`  Allowed Types: ${data.data.allowedTypes.length} types`);
        return true;
      } else {
        error(`Configuration error: ${data.message}`);
        return false;
      }
    } else {
      error(`HTTP ${response.statusCode}: ${response.body}`);
      return false;
    }
  } catch (err) {
    error(`Configuration check failed: ${err.message}`);
    warning('Make sure the dev server is running (npm run dev)');
    return false;
  }
}

/**
 * Test 2: Check storage health
 */
async function testStorageHealth() {
  log('\n========================================', 'cyan');
  log('Test 2: Check Storage Health', 'cyan');
  log('========================================\n', 'cyan');

  try {
    const response = await makeRequest(`${API_BASE_URL}/api/upload/health`);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      if (data.data.healthy) {
        success(`Storage is healthy (${data.data.provider})`);
        info(`  Message: ${data.data.message}`);
        
        if (data.data.details) {
          Object.entries(data.data.details).forEach(([key, value]) => {
            info(`  ${key}: ${value}`);
          });
        }
        return true;
      } else {
        error(`Storage unhealthy: ${data.data.message}`);
        return false;
      }
    } else {
      error(`HTTP ${response.statusCode}: Storage health check failed`);
      return false;
    }
  } catch (err) {
    error(`Health check failed: ${err.message}`);
    warning('Check your storage credentials in .env.local');
    return false;
  }
}

/**
 * Test 3: Upload file
 */
async function testFileUpload() {
  log('\n========================================', 'cyan');
  log('Test 3: Upload File', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // Check if file exists
    if (!fs.existsSync(TEST_FILE_PATH)) {
      error(`File not found: ${TEST_FILE_PATH}`);
      return false;
    }

    const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
    const fileName = path.basename(TEST_FILE_PATH);
    const fileStats = fs.statSync(TEST_FILE_PATH);
    const fileType = getFileType(fileName);

    info(`File: ${fileName}`);
    info(`Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    info(`Type: ${fileType}`);

    // Step 1: Get presigned URL
    log('\nStep 1: Requesting presigned URL...', 'yellow');
    
    const presignedResponse = await makeRequest(
      `${API_BASE_URL}/api/upload/presigned-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({
        fileName,
        fileType,
        fileSize: fileStats.size,
        folder: 'test-uploads',
      })
    );

    if (presignedResponse.statusCode !== 200) {
      error(`Failed to get presigned URL: HTTP ${presignedResponse.statusCode}`);
      error(presignedResponse.body);
      return false;
    }

    const presignedData = JSON.parse(presignedResponse.body);
    
    if (!presignedData.success) {
      error(`Failed to get presigned URL: ${presignedData.message}`);
      return false;
    }

    success('Presigned URL generated');
    const { uploadUrl, publicUrl, key, expiresAt } = presignedData.data;
    info(`  Key: ${key}`);
    info(`  Expires: ${new Date(expiresAt).toLocaleString()}`);

    // Step 2: Upload to cloud storage
    log('\nStep 2: Uploading to cloud storage...', 'yellow');

    const uploadResponse = await makeRequest(
      uploadUrl,
      {
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileStats.size,
        },
      },
      fileBuffer
    );

    if (uploadResponse.statusCode < 200 || uploadResponse.statusCode >= 300) {
      error(`Upload failed: HTTP ${uploadResponse.statusCode}`);
      error(uploadResponse.body);
      return false;
    }

    success('File uploaded to cloud storage');

    // Step 3: Complete upload
    log('\nStep 3: Verifying upload...', 'yellow');

    const completeResponse = await makeRequest(
      `${API_BASE_URL}/api/upload/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({
        key,
        fileName,
        fileType,
        fileSize: fileStats.size,
        publicUrl,
      })
    );

    if (completeResponse.statusCode !== 200) {
      error(`Upload verification failed: HTTP ${completeResponse.statusCode}`);
      error(completeResponse.body);
      return false;
    }

    const completeData = JSON.parse(completeResponse.body);
    
    if (!completeData.success) {
      error(`Upload verification failed: ${completeData.message}`);
      return false;
    }

    success('Upload completed and verified');
    info(`  File ID: ${completeData.data.id}`);
    info(`  Public URL: ${completeData.data.url}`);

    return true;
  } catch (err) {
    error(`Upload test failed: ${err.message}`);
    console.error(err);
    return false;
  }
}

/**
 * Get file MIME type based on extension
 */
function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.csv': 'text/csv',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Run all tests
 */
async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Cloud Storage Upload Test Suite     ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');

  info(`API Base URL: ${API_BASE_URL}`);
  info(`Test File: ${TEST_FILE_PATH}\n`);

  const results = [];

  // Test 1: Configuration
  const test1 = await testApiConfiguration();
  results.push({ name: 'Configuration', passed: test1 });

  if (!test1) {
    warning('\nSkipping remaining tests due to configuration failure');
    printSummary(results);
    process.exit(1);
  }

  // Test 2: Health Check
  const test2 = await testStorageHealth();
  results.push({ name: 'Storage Health', passed: test2 });

  if (!test2) {
    warning('\nSkipping upload test due to storage health failure');
    printSummary(results);
    process.exit(1);
  }

  // Test 3: Upload
  const test3 = await testFileUpload();
  results.push({ name: 'File Upload', passed: test3 });

  printSummary(results);

  // Cleanup test file if we created it
  if (TEST_FILE_PATH.includes('temp-test')) {
    fs.unlinkSync(TEST_FILE_PATH);
    fs.rmdirSync(path.dirname(TEST_FILE_PATH));
    info('\nCleaned up test file');
  }

  process.exit(results.every(r => r.passed) ? 0 : 1);
}

/**
 * Print test summary
 */
function printSummary(results) {
  log('\n========================================', 'cyan');
  log('Test Summary', 'cyan');
  log('========================================\n', 'cyan');

  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}: PASSED`);
    } else {
      error(`${result.name}: FAILED`);
    }
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'red');

  if (passed === total) {
    log('\n✓ All tests passed! Cloud storage is working correctly.', 'green');
  } else {
    log('\n✗ Some tests failed. Please check the errors above.', 'red');
    log('\nCommon issues:', 'yellow');
    log('  • Server not running: npm run dev', 'yellow');
    log('  • Missing credentials: Check .env.local', 'yellow');
    log('  • Storage not configured: Run setup scripts', 'yellow');
    log('  • Bucket/container not created: Check cloud console', 'yellow');
  }
}

// Run tests
runTests().catch(err => {
  error(`\nFatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
