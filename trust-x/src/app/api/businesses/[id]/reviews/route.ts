/**
 * Business Reviews API
 * 
 * @swagger
 * /api/businesses/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a business
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   post:
 *     summary: Add a review to a business
 *     tags: [Reviews]
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
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 */

import { NextRequest } from 'next/server';
import { getDb, ObjectId, Db } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';

// GET /api/businesses/[id]/reviews - Get all reviews
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const db = await getDb();
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return sendError('Invalid business ID', 'INVALID_ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get reviews with user details
    const reviews = await db.collection('reviews')
      .aggregate([
        {
          $match: {
            businessId: new ObjectId(resolvedParams.id),
            status: 'active'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            'user._id': 1,
            'user.name': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    const total = await db.collection('reviews').countDocuments({
      businessId: new ObjectId(resolvedParams.id),
      status: 'active'
    });

    const formattedReviews = reviews.map(review => ({
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      user: {
        id: review.user._id.toString(),
        name: review.user.name
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    return sendSuccess({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Reviews retrieved successfully');
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return sendError('Failed to fetch reviews', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/businesses/[id]/reviews - Add a review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = requireAuth(req);
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const resolvedParams = await params;
    const db = await getDb();
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return sendError('Invalid business ID', 'INVALID_ID', 400);
    }

    const body = await req.json();
    const { rating, comment } = body;

    // Validate
    if (!rating || !comment) {
      return sendError('Rating and comment are required', 'VALIDATION_ERROR', 400);
    }

    if (rating < 1 || rating > 5) {
      return sendError('Rating must be between 1 and 5', 'VALIDATION_ERROR', 400);
    }

    // Check if business exists
    const business = await db.collection('businesses').findOne({
      _id: new ObjectId(resolvedParams.id),
      status: 'active'
    });

    if (!business) {
      return sendError('Business not found', 'NOT_FOUND', 404);
    }

    // Check if user already reviewed
    const existingReview = await db.collection('reviews').findOne({
      businessId: new ObjectId(resolvedParams.id),
      userId: new ObjectId(context.userId)
    });

    if (existingReview) {
      return sendError('You have already reviewed this business', 'ALREADY_REVIEWED', 409);
    }

    // Create review
    const now = new Date();
    const reviewData = {
      businessId: new ObjectId(resolvedParams.id),
      userId: new ObjectId(context.userId),
      rating,
      comment,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('reviews').insertOne(reviewData);

    // Update business stats
    const allReviews = await db.collection('reviews')
      .find({ businessId: new ObjectId(resolvedParams.id), status: 'active' })
      .toArray();

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await db.collection('businesses').updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        $set: {
          reviewCount: allReviews.length,
          averageRating: parseFloat(averageRating.toFixed(2)),
          updatedAt: now
        }
      }
    );

    // Recalculate trust score
    await recalculateTrustScore(resolvedParams.id, db);

    const review = {
      id: result.insertedId.toString(),
      ...reviewData,
      businessId: reviewData.businessId.toString(),
      userId: reviewData.userId.toString()
    };

    return sendSuccess(
      { review },
      'Review added successfully',
      201
    );
  } catch (error) {
    console.error('Error adding review:', error);
    return sendError('Failed to add review', 'INTERNAL_ERROR', 500);
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
