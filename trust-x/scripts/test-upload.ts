// File Upload API Test Script
// Run with: npx ts-node scripts/test-upload.ts

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testUploadAPI() {
  console.log('🧪 Testing File Upload API with AWS S3 Pre-signed URLs\n');

  try {
    // Test 1: Generate pre-signed URL
    console.log('1. Testing pre-signed URL generation...');
    const uploadRequest = {
      filename: 'test-document.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 500, // 500KB
    };

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadRequest),
    });

    const uploadData = await uploadRes.json() as {
      success: boolean;
      uploadURL?: string;
      fileKey?: string;
      message?: string;
    };

    if (!uploadData.success) {
      console.error('❌ Failed to generate pre-signed URL:', uploadData.message);
      return;
    }

    console.log('✅ Pre-signed URL generated successfully');
    console.log('   Upload URL:', uploadData.uploadURL?.substring(0, 50) + '...');
    console.log('   File Key:', uploadData.fileKey);

    // Test 2: Store file metadata (simulating successful upload)
    console.log('\n2. Testing file metadata storage...');
    const fileData = {
      fileName: uploadRequest.filename,
      fileKey: uploadData.fileKey!,
      fileSize: uploadRequest.fileSize,
      fileType: uploadRequest.fileType,
    };

    const storeRes = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    });

    const storeData = await storeRes.json() as {
      success: boolean;
      file?: {
        id: number;
        name: string;
        url: string;
        size: number;
        type: string;
        userId: number;
        createdAt: string;
        updatedAt: string;
      };
      message?: string;
    };

    if (!storeData.success) {
      console.error('❌ Failed to store file metadata:', storeData.message);
      return;
    }

    console.log('✅ File metadata stored successfully');
    console.log('   File ID:', storeData.file?.id);
    console.log('   File URL:', storeData.file?.url);

    // Test 3: Retrieve files
    console.log('\n3. Testing file retrieval...');
    const getRes = await fetch(`${BASE_URL}/api/files`);
    const getData = await getRes.json() as {
      success: boolean;
      files?: Array<{
        id: number;
        name: string;
        url: string;
        size: number;
        type: string;
        userId: number;
        createdAt: string;
        updatedAt: string;
      }>;
      message?: string;
    };

    if (!getData.success) {
      console.error('❌ Failed to retrieve files:', getData.message);
      return;
    }

    console.log('✅ Files retrieved successfully');
    console.log('   Total files:', getData.files?.length);
    if (getData.files && getData.files.length > 0) {
      console.log('   Latest file:', getData.files[0].name);
    }

    console.log('\n🎉 All tests passed! File upload API is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Set up real AWS S3 credentials in .env');
    console.log('   2. Create an S3 bucket and configure CORS');
    console.log('   3. Test actual file upload from frontend at /upload');
    console.log('   4. Verify files appear in S3 console');

  } catch (error: unknown) {
    console.error('❌ Test failed with error:', error instanceof Error ? error.message : String(error));
  }
}

// Validation tests
async function testValidation() {
  console.log('\n🔍 Testing input validation...\n');

  const testCases = [
    {
      name: 'Invalid file type',
      data: { filename: 'test.exe', fileType: 'application/exe', fileSize: 1024 },
      expectedError: true,
    },
    {
      name: 'File too large',
      data: { filename: 'large.pdf', fileType: 'application/pdf', fileSize: 20 * 1024 * 1024 },
      expectedError: true,
    },
    {
      name: 'Valid file',
      data: { filename: 'valid.pdf', fileType: 'application/pdf', fileSize: 1024 },
      expectedError: false,
    },
  ];

  for (const testCase of testCases) {
    try {
      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data),
      });

      const data = await res.json() as {
        success: boolean;
        uploadURL?: string;
        fileKey?: string;
        message?: string;
      };

      if (testCase.expectedError && !data.success) {
        console.log(`✅ ${testCase.name}: Correctly rejected`);
      } else if (!testCase.expectedError && data.success) {
        console.log(`✅ ${testCase.name}: Correctly accepted`);
      } else {
        console.log(`❌ ${testCase.name}: Unexpected result`);
      }
    } catch (error: unknown) {
      console.log(`❌ ${testCase.name}: Error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testUploadAPI();
  await testValidation();
}

runAllTests();