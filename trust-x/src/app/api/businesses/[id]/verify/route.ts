/**
 * Business Verification API
 * 
 * @swagger
 * /api/businesses/{id}/verify:
 *   post:
 *     summary: Verify business information (lightweight KYC)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationType:
 *                 type: string
 *                 enum: [email, phone, address, identity]
 *               verificationData:
 *                 type: object
 */

import { NextRequest } from 'next/server';
import { getDb, ObjectId, Db } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';

// POST /api/businesses/[id]/verify - Add verification
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = requireAuth(req);
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const db = await getDb();
    
    if (!ObjectId.isValid(params.id)) {
      return sendError('Invalid business ID', 'INVALID_ID', 400);
    }

    const business = await db.collection('businesses').findOne({
      _id: new ObjectId(params.id)
    });

    if (!business) {
      return sendError('Business not found', 'NOT_FOUND', 404);
    }

    // Check if user is the owner or admin
    if (business.ownerId.toString() !== context.userId && context.role !== 'ADMIN') {
      return sendError('Not authorized to verify this business', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const { verificationType, verificationData } = body;

    if (!verificationType) {
      return sendError('Verification type is required', 'VALIDATION_ERROR', 400);
    }

    const validTypes = ['email', 'phone', 'address', 'identity'];
    if (!validTypes.includes(verificationType)) {
      return sendError('Invalid verification type', 'VALIDATION_ERROR', 400);
    }

    const now = new Date();
    
    // Create verification record
    const verificationRecord = {
      type: verificationType,
      data: verificationData || {},
      status: 'pending',
      submittedAt: now,
      verifiedAt: null,
      verifiedBy: null
    };

    // For demo purposes, auto-verify email and phone if data provided
    const badges = business.verificationBadges || [];
    let newBadge = null;

    if (verificationType === 'email' && verificationData?.email) {
      verificationRecord.status = 'verified';
      verificationRecord.verifiedAt = now;
      newBadge = 'email_verified';
    } else if (verificationType === 'phone' && verificationData?.phone) {
      verificationRecord.status = 'verified';
      verificationRecord.verifiedAt = now;
      newBadge = 'phone_verified';
    } else if (verificationType === 'address' && verificationData?.address) {
      verificationRecord.status = 'verified';
      verificationRecord.verifiedAt = now;
      newBadge = 'address_verified';
    }

    // Add badge if not already present
    if (newBadge && !badges.includes(newBadge)) {
      badges.push(newBadge);
    }

    // Update business
    const updateData: Record<string, unknown> = {
      $push: {
        verificationHistory: verificationRecord
      },
      $set: {
        verificationBadges: badges,
        updatedAt: now
      }
    };

    // If has all 3 badges, mark as fully verified
    if (badges.length >= 3) {
      (updateData.$set as Record<string, unknown>).isVerified = true;
    }

    await db.collection('businesses').updateOne(
      { _id: new ObjectId(params.id) },
      updateData
    );

    // Recalculate trust score
    await recalculateTrustScore(params.id, db);

    return sendSuccess(
      {
        verification: verificationRecord,
        badges,
        isVerified: badges.length >= 3
      },
      'Verification submitted successfully',
      201
    );
  } catch (error) {
    console.error('Error submitting verification:', error);
    return sendError('Failed to submit verification', 'INTERNAL_ERROR', 500);
  }
}

// GET /api/businesses/[id]/verify - Get verification status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    
    if (!ObjectId.isValid(params.id)) {
      return sendError('Invalid business ID', 'INVALID_ID', 400);
    }

    const business = await db.collection('businesses').findOne(
      { _id: new ObjectId(params.id) },
      {
        projection: {
          isVerified: 1,
          verificationBadges: 1,
          verificationHistory: 1
        }
      }
    );

    if (!business) {
      return sendError('Business not found', 'NOT_FOUND', 404);
    }

    return sendSuccess({
      isVerified: business.isVerified || false,
      badges: business.verificationBadges || [],
      history: business.verificationHistory || []
    }, 'Verification status retrieved successfully');
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return sendError('Failed to fetch verification status', 'INTERNAL_ERROR', 500);
  }
}

// Helper function to recalculate trust score
async function recalculateTrustScore(businessId: string, db: Db) {
  const business = await db.collection('businesses').findOne({
    _id: new ObjectId(businessId)
  });

  if (!business) return;

  let score = 0;

  // Base score from reviews (0-40 points)
  const avgRating = business.averageRating || 0;
  const reviewCount = business.reviewCount || 0;
  score += (avgRating / 5) * 30; // Max 30 points for rating
  score += Math.min(reviewCount, 10); // Max 10 points for review count

  // Verification badges (0-30 points)
  const badges = business.verificationBadges || [];
  score += badges.length * 10; // 10 points per badge, max 3 badges

  // Business age (0-15 points)
  const ageInDays = Math.floor((Date.now() - business.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  score += Math.min(ageInDays / 30, 15); // Max 15 points for 30+ days

  // Activity (0-15 points)
  const views = business.totalViews || 0;
  score += Math.min(views / 100, 15); // Max 15 points for 100+ views

  // Cap at 100
  score = Math.min(Math.round(score), 100);

  await db.collection('businesses').updateOne(
    { _id: new ObjectId(businessId) },
    { $set: { trustScore: score } }
  );
}
