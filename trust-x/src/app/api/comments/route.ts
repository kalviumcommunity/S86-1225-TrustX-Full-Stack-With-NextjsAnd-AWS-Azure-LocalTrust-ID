/**
 * Example: Secure Comment API with Input Sanitization
 * POST /api/comments - Create a comment with sanitized input
 * GET /api/comments - Get comments (demonstrates safe output)
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { sanitizeBasic, sanitizeStrict, logSanitization } from '@/lib/sanitize';
import { commentSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

/**
 * GET - Fetch comments (safe output demonstration)
 */
export async function GET(req: NextRequest) {
  const context = requireAuth(req);
  
  if (context instanceof Response) {
    return context;
  }

  try {
    // Fetch comments from database
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        content: true,
        authorName: true,
        createdAt: true,
      },
    });

    // Additional sanitization on output (defense in depth)
    const sanitizedComments = comments.map(comment => ({
      ...comment,
      content: sanitizeBasic(comment.content),
      authorName: sanitizeStrict(comment.authorName || 'Anonymous'),
    }));

    return sendSuccess(sanitizedComments, 'Comments fetched successfully', 200);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return sendError('Failed to fetch comments', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST - Create a comment with input sanitization
 */
export async function POST(req: NextRequest) {
  const context = requireAuth(req);
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const body = await req.json();

    // Log original input (sanitized for logging)
    console.log('📥 [INPUT] Received comment data');

    // Validate and sanitize using Zod schema
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return sendError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.error.format()
      );
    }

    const { content, authorName } = result.data;

    // Additional manual sanitization with logging
    const sanitizedContent = sanitizeBasic(content);
    const sanitizedAuthorName = authorName ? sanitizeStrict(authorName) : 'Anonymous';

    // Log sanitization results
    if (content !== sanitizedContent) {
      logSanitization('content', content, sanitizedContent, 'sanitizeBasic');
    }
    if (authorName && authorName !== sanitizedAuthorName) {
      logSanitization('authorName', authorName, sanitizedAuthorName, 'sanitizeStrict');
    }

    // Create comment in database (using parameterized query - SQL injection safe)
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        authorName: sanitizedAuthorName,
      },
    });

    console.log('✅ [SANITIZE] Comment created safely:', comment.id);

    return sendSuccess(comment, 'Comment created successfully', 201);
  } catch (error) {
    console.error('Error creating comment:', error);
    return sendError('Failed to create comment', 'INTERNAL_ERROR', 500);
  }
}
