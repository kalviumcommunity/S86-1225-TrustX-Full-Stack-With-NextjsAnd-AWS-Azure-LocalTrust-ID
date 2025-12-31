/**
 * Presigned URL Generation API
 * 
 * Generates secure presigned URLs for direct file uploads to cloud storage.
 * Supports both AWS S3 and Azure Blob Storage.
 * 
 * POST /api/upload/presigned-url
 * 
 * Request Body:
 * {
 *   fileName: string;
 *   fileType: string;
 *   fileSize: number;
 *   folder?: string;
 * }
 * 
 * Response:
 * {
 *   uploadUrl: string;      // Use this URL to PUT the file
 *   publicUrl: string;       // URL to access the file after upload
 *   expiresAt: string;       // ISO timestamp when URL expires
 *   fileName: string;        // Original file name
 *   key: string;             // Storage key/blob name
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl, validateFile } from '@/lib/storage';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize, folder } = body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return sendError(
        'Missing required fields: fileName, fileType, fileSize',
        'VALIDATION_ERROR',
        400
      );
    }

    // Validate file
    const validation = validateFile(fileName, fileType, fileSize);
    if (!validation.valid) {
      return sendError(
        validation.error || 'File validation failed',
        'FILE_VALIDATION_ERROR',
        400
      );
    }

    // Generate presigned URL
    const result = await generatePresignedUrl({
      fileName,
      fileType,
      fileSize,
      folder: folder || 'uploads',
      expiresIn: 60 * 15, // 15 minutes
    });

    logger.info('Presigned URL generated', {
      fileName,
      fileType,
      fileSize,
      key: result.key,
    });

    return sendSuccess(result, 'Presigned URL generated successfully');
  } catch (error: any) {
    logger.error('Failed to generate presigned URL', {
      error: error.message,
      stack: error.stack,
    });

    return sendError(
      error.message || 'Failed to generate presigned URL',
      'PRESIGNED_URL_ERROR',
      500
    );
  }
}

// GET method to check supported file types and size limits
export async function GET() {
  try {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'text/csv',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const provider = process.env.STORAGE_PROVIDER || 'aws';

    // Check if storage is configured
    let configured = false;
    let configMessage = '';

    if (provider === 'aws') {
      configured = !!(
        process.env.AWS_REGION &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET_NAME &&
        process.env.AWS_S3_BUCKET_NAME !== 'your-bucket-name'
      );
      if (!configured) {
        configMessage = 'AWS S3 is not configured. Run ./scripts/setup-aws-s3.sh to set up automatically.';
      }
    } else if (provider === 'azure') {
      configured = !!(
        process.env.AZURE_STORAGE_ACCOUNT_NAME &&
        process.env.AZURE_STORAGE_CONTAINER_NAME &&
        (process.env.AZURE_STORAGE_ACCOUNT_KEY || process.env.AZURE_STORAGE_CONNECTION_STRING)
      );
      if (!configured) {
        configMessage = 'Azure Blob Storage is not configured. Run ./scripts/setup-azure-blob.sh to set up automatically.';
      }
    }

    return sendSuccess({
      allowedTypes,
      maxFileSize,
      maxFileSizeMB: (maxFileSize / 1024 / 1024).toFixed(2),
      provider,
      configured,
      configMessage,
    }, 'Upload configuration retrieved successfully');
  } catch (error: any) {
    logger.error('Failed to retrieve upload configuration', {
      error: error.message,
    });

    return sendError(
      error.message || 'Failed to retrieve upload configuration',
      'CONFIG_ERROR',
      500
    );
  }
}
