/**
 * Upload Completion Verification API
 * 
 * Verifies that a file upload was successful by checking if the file exists
 * in cloud storage and optionally saves metadata to the database.
 * 
 * POST /api/upload/complete
 * 
 * Request Body:
 * {
 *   key: string;             // File key/blob name returned from presigned URL
 *   fileName: string;        // Original file name
 *   fileType: string;        // MIME type
 *   fileSize: number;        // File size in bytes
 *   publicUrl: string;       // Public URL of the uploaded file
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 *   file: {
 *     id: string;
 *     name: string;
 *     url: string;
 *     size: number;
 *     type: string;
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fileExists } from '@/lib/storage';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { logger } from '@/lib/logger';
import { getDb, ObjectId } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, fileName, fileType, fileSize, publicUrl } = body;

    // Validate required fields
    if (!key || !fileName || !fileType || !fileSize || !publicUrl) {
      return sendError(
        'Missing required fields: key, fileName, fileType, fileSize, publicUrl',
        'VALIDATION_ERROR',
        400
      );
    }

    // Verify file exists in storage
    const exists = await fileExists(key);
    if (!exists) {
      return sendError(
        'File not found in storage. Upload may have failed.',
        'FILE_NOT_FOUND',
        404
      );
    }

    // Save file metadata to database
    const db = await getDb();
    const now = new Date();
    const result = await db.collection('files').insertOne({
      name: fileName,
      url: publicUrl,
      size: fileSize,
      type: fileType,
      createdAt: now,
      updatedAt: now,
    });

    const file = {
      id: result.insertedId.toString(),
      name: fileName,
      url: publicUrl,
      size: fileSize,
      type: fileType,
      createdAt: now,
      updatedAt: now,
    };

    logger.info('File upload completed', {
      fileId: file.id,
      fileName,
      key,
      fileSize,
    });

    return sendSuccess(
      {
        id: file.id,
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
        uploadedAt: file.createdAt,
      },
      'File uploaded successfully'
    );
  } catch (error: any) {
    logger.error('Failed to complete upload', {
      error: error.message,
      stack: error.stack,
    });

    return sendError(
      error.message || 'Failed to complete upload',
      'UPLOAD_COMPLETION_ERROR',
      500
    );
  }
}

// GET method to retrieve upload history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDb();
    const files = await db.collection('files')
      .find({}, {
        projection: {
          _id: 1,
          name: 1,
          url: 1,
          size: 1,
          type: 1,
          createdAt: 1,
        },
        sort: { createdAt: -1 },
        limit: limit,
        skip: offset,
      })
      .toArray();

    const total = await db.collection('files').countDocuments();

    // Map createdAt to uploadedAt for client compatibility
    const filesWithUploadedAt = files.map(file => ({
      id: file._id.toString(),
      name: file.name,
      url: file.url,
      size: file.size,
      type: file.type,
      createdAt: file.createdAt,
      uploadedAt: file.createdAt,
    }));

    return sendSuccess({
      files: filesWithUploadedAt,
      total,
      limit,
      offset,
      hasMore: offset + files.length < total,
    }, 'Upload history retrieved successfully');
  } catch (error: any) {
    logger.error('Failed to retrieve upload history', {
      error: error.message,
    });

    return sendError(
      error.message || 'Failed to retrieve upload history',
      'UPLOAD_HISTORY_ERROR',
      500
    );
  }
}

// DELETE method to remove a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return sendError(
        'Missing required parameter: id',
        'VALIDATION_ERROR',
        400
      );
    }

    // Get file from database
    const db = await getDb();
    if (!ObjectId.isValid(fileId)) {
      return sendError(
        'Invalid file ID',
        'VALIDATION_ERROR',
        400
      );
    }

    const file = await db.collection('files').findOne({
      _id: new ObjectId(fileId),
    });

    if (!file) {
      return sendError(
        'File not found',
        'FILE_NOT_FOUND',
        404
      );
    }

    // Extract key from URL (since we don't store path separately)
    const urlParts = file.url.split('/');
    const key = urlParts.slice(-1)[0]; // Get last part of URL

    // Delete from storage
    const { deleteFile } = await import('@/lib/storage');
    try {
      await deleteFile(key);
    } catch (storageError) {
      logger.warn('Failed to delete from storage, continuing with database deletion', { storageError });
    }

    // Delete from database
    await db.collection('files').deleteOne({
      _id: new ObjectId(fileId),
    });

    logger.info('File deleted', {
      fileId,
      fileName: file.name,
      key,
    });

    return sendSuccess(
      { id: fileId },
      'File deleted successfully'
    );
  } catch (error: any) {
    logger.error('Failed to delete file', {
      error: error.message,
    });

    return sendError(
      error.message || 'Failed to delete file',
      'FILE_DELETE_ERROR',
      500
    );
  }
}
