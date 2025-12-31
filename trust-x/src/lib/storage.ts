/**
 * Storage Management Module
 * 
 * Provides unified interface for cloud object storage operations with support for:
 * - AWS S3
 * - Azure Blob Storage
 * 
 * Features:
 * - Presigned URL generation for secure uploads
 * - File validation (type, size)
 * - SAS token generation for Azure
 * - Error handling and logging
 * - Type-safe configuration
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import { logger } from './logger';

// ============================================================================
// Configuration Types
// ============================================================================

export type StorageProvider = 'aws' | 'azure' | 'local';

export interface StorageConfig {
  provider: StorageProvider;
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };
  azure?: {
    accountName: string;
    accountKey: string;
    containerName: string;
    connectionString?: string;
  };
}

export interface UploadOptions {
  fileName: string;
  fileType: string;
  fileSize: number;
  folder?: string;
  expiresIn?: number; // Seconds
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: Date;
  fileName: string;
  key: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    maxSize: number;
    allowedTypes: string[];
  };
}

// ============================================================================
// File Validation Configuration
// ============================================================================

const ALLOWED_FILE_TYPES = [
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  // Text
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_EXPIRY = 60 * 15; // 15 minutes

// ============================================================================
// Storage Configuration
// ============================================================================

function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'aws') as StorageProvider;

  if (provider === 'aws') {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'AWS S3 is not configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables. ' +
        'Run ./scripts/setup-aws-s3.sh to set up AWS S3 automatically, or see README.md for manual setup instructions.'
      );
    }

    return {
      provider: 'aws',
      aws: {
        region,
        accessKeyId,
        secretAccessKey,
        bucketName,
      },
    };
  }

  if (provider === 'azure') {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!accountName || (!accountKey && !connectionString) || !containerName) {
      throw new Error(
        'Azure Blob Storage is not configured. Please set AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_CONTAINER_NAME, and either AZURE_STORAGE_ACCOUNT_KEY or AZURE_STORAGE_CONNECTION_STRING environment variables. ' +
        'Run ./scripts/setup-azure-blob.sh to set up Azure Blob Storage automatically, or see README.md for manual setup instructions.'
      );
    }

    return {
      provider: 'azure',
      azure: {
        accountName,
        accountKey: accountKey || '',
        containerName,
        connectionString,
      },
    };
  }

  throw new Error(`Unsupported storage provider: ${provider}. Supported providers are: aws, azure`);
}

// ============================================================================
// AWS S3 Client
// ============================================================================

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const config = getStorageConfig();
  if (!config.aws) {
    throw new Error('AWS configuration not found');
  }

  s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });

  logger.info('S3 client initialized', {
    region: config.aws.region,
    bucket: config.aws.bucketName,
  });

  return s3Client;
}

// ============================================================================
// Azure Blob Client
// ============================================================================

let blobServiceClient: BlobServiceClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
  if (blobServiceClient) return blobServiceClient;

  const config = getStorageConfig();
  if (!config.azure) {
    throw new Error('Azure configuration not found');
  }

  if (config.azure.connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
  } else {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.azure.accountName,
      config.azure.accountKey
    );
    blobServiceClient = new BlobServiceClient(
      `https://${config.azure.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  logger.info('Azure Blob client initialized', {
    accountName: config.azure.accountName,
    container: config.azure.containerName,
  });

  return blobServiceClient;
}

// ============================================================================
// File Validation
// ============================================================================

export function validateFile(
  fileName: string,
  fileType: string,
  fileSize: number,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
  } = {}
): FileValidationResult {
  const allowedTypes = options.allowedTypes || ALLOWED_FILE_TYPES;
  const maxSize = options.maxSize || MAX_FILE_SIZE;

  // Check file type
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      details: {
        fileName,
        fileType,
        fileSize,
        maxSize,
        allowedTypes,
      },
    };
  }

  // Check file size
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      details: {
        fileName,
        fileType,
        fileSize,
        maxSize,
        allowedTypes,
      },
    };
  }

  // Check file name
  if (!fileName || fileName.length > 255) {
    return {
      valid: false,
      error: 'Invalid file name',
      details: {
        fileName,
        fileType,
        fileSize,
        maxSize,
        allowedTypes,
      },
    };
  }

  return {
    valid: true,
    details: {
      fileName,
      fileType,
      fileSize,
      maxSize,
      allowedTypes,
    },
  };
}

// ============================================================================
// Generate Safe File Key
// ============================================================================

function generateFileKey(fileName: string, folder?: string): string {
  // Remove any dangerous characters
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = safeName.split('.').pop();
  const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.')) || safeName;
  
  const uniqueName = `${nameWithoutExt}-${timestamp}-${randomStr}.${extension}`;
  
  return folder ? `${folder}/${uniqueName}` : uniqueName;
}

// ============================================================================
// AWS S3 Operations
// ============================================================================

export async function generateS3PresignedUrl(
  options: UploadOptions
): Promise<PresignedUrlResponse> {
  const config = getStorageConfig();
  if (!config.aws) {
    throw new Error('AWS configuration not found');
  }

  const client = getS3Client();
  const key = generateFileKey(options.fileName, options.folder);
  const expiresIn = options.expiresIn || DEFAULT_EXPIRY;

  const command = new PutObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
    ContentType: options.fileType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;

  logger.info('Generated S3 presigned URL', {
    key,
    bucket: config.aws.bucketName,
    expiresIn,
  });

  return {
    uploadUrl,
    publicUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    fileName: options.fileName,
    key,
  };
}

export async function deleteS3Object(key: string): Promise<void> {
  const config = getStorageConfig();
  if (!config.aws) {
    throw new Error('AWS configuration not found');
  }

  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
  });

  await client.send(command);
  logger.info('Deleted S3 object', { key });
}

export async function checkS3ObjectExists(key: string): Promise<boolean> {
  const config = getStorageConfig();
  if (!config.aws) {
    throw new Error('AWS configuration not found');
  }

  const client = getS3Client();
  const command = new HeadObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
  });

  try {
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// ============================================================================
// Azure Blob Operations
// ============================================================================

export async function generateAzureSasUrl(
  options: UploadOptions
): Promise<PresignedUrlResponse> {
  const config = getStorageConfig();
  if (!config.azure) {
    throw new Error('Azure configuration not found');
  }

  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(config.azure.containerName);
  const blobName = generateFileKey(options.fileName, options.folder);
  const blobClient = containerClient.getBlobClient(blobName);
  const blockBlobClient = blobClient.getBlockBlobClient();

  const expiresIn = options.expiresIn || DEFAULT_EXPIRY;
  const expiresOn = new Date(Date.now() + expiresIn * 1000);

  // Generate SAS token
  const sharedKeyCredential = new StorageSharedKeyCredential(
    config.azure.accountName,
    config.azure.accountKey
  );

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: config.azure.containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('rcw'), // Read, Create, Write
      startsOn: new Date(),
      expiresOn: expiresOn,
    },
    sharedKeyCredential
  ).toString();

  const uploadUrl = `${blockBlobClient.url}?${sasToken}`;
  const publicUrl = blockBlobClient.url;

  logger.info('Generated Azure SAS URL', {
    blobName,
    container: config.azure.containerName,
    expiresIn,
  });

  return {
    uploadUrl,
    publicUrl,
    expiresAt: expiresOn,
    fileName: options.fileName,
    key: blobName,
  };
}

export async function deleteAzureBlob(blobName: string): Promise<void> {
  const config = getStorageConfig();
  if (!config.azure) {
    throw new Error('Azure configuration not found');
  }

  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(config.azure.containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  await blobClient.delete();
  logger.info('Deleted Azure blob', { blobName });
}

export async function checkAzureBlobExists(blobName: string): Promise<boolean> {
  const config = getStorageConfig();
  if (!config.azure) {
    throw new Error('Azure configuration not found');
  }

  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(config.azure.containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  return await blobClient.exists();
}

// ============================================================================
// Unified Storage Interface
// ============================================================================

export async function generatePresignedUrl(
  options: UploadOptions
): Promise<PresignedUrlResponse> {
  const config = getStorageConfig();

  // Validate file first
  const validation = validateFile(options.fileName, options.fileType, options.fileSize);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    if (config.provider === 'aws') {
      return await generateS3PresignedUrl(options);
    } else if (config.provider === 'azure') {
      return await generateAzureSasUrl(options);
    } else {
      throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  } catch (error: any) {
    logger.error('Failed to generate presigned URL', {
      provider: config.provider,
      error: error.message,
      options,
    });
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}

export async function deleteFile(key: string): Promise<void> {
  const config = getStorageConfig();

  try {
    if (config.provider === 'aws') {
      await deleteS3Object(key);
    } else if (config.provider === 'azure') {
      await deleteAzureBlob(key);
    } else {
      throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  } catch (error: any) {
    logger.error('Failed to delete file', {
      provider: config.provider,
      key,
      error: error.message,
    });
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

export async function fileExists(key: string): Promise<boolean> {
  const config = getStorageConfig();

  try {
    if (config.provider === 'aws') {
      return await checkS3ObjectExists(key);
    } else if (config.provider === 'azure') {
      return await checkAzureBlobExists(key);
    } else {
      throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  } catch (error: any) {
    logger.error('Failed to check file existence', {
      provider: config.provider,
      key,
      error: error.message,
    });
    return false;
  }
}

// ============================================================================
// Storage Health Check
// ============================================================================

export async function checkStorageHealth(): Promise<{
  healthy: boolean;
  provider: string;
  message: string;
  details?: any;
}> {
  const config = getStorageConfig();

  try {
    if (config.provider === 'aws') {
      const client = getS3Client();
      // Simple check - try to list objects (will fail if credentials are invalid)
      await client.send(new HeadObjectCommand({
        Bucket: config.aws!.bucketName,
        Key: 'health-check-test',
      })).catch(() => {
        // It's ok if the file doesn't exist, we just want to verify credentials
      });

      return {
        healthy: true,
        provider: 'aws-s3',
        message: 'S3 storage is accessible',
        details: {
          bucket: config.aws!.bucketName,
          region: config.aws!.region,
        },
      };
    } else if (config.provider === 'azure') {
      const client = getBlobServiceClient();
      const containerClient = client.getContainerClient(config.azure!.containerName);
      await containerClient.exists();

      return {
        healthy: true,
        provider: 'azure-blob',
        message: 'Azure Blob storage is accessible',
        details: {
          accountName: config.azure!.accountName,
          container: config.azure!.containerName,
        },
      };
    } else {
      return {
        healthy: false,
        provider: config.provider,
        message: `Unsupported storage provider: ${config.provider}`,
      };
    }
  } catch (error: any) {
    logger.error('Storage health check failed', {
      provider: config.provider,
      error: error.message,
    });

    return {
      healthy: false,
      provider: config.provider,
      message: `Storage health check failed: ${error.message}`,
    };
  }
}
