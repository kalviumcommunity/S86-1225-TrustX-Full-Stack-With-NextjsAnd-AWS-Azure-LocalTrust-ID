import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    const db = await getDb();
    const reviewsCollection = db.collection('reviews');

    let query = {};
    if (businessId) {
      query = { businessId };
    }

    const reviews = await reviewsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Transform reviews to include user names
    const usersCollection = db.collection('users');
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await usersCollection.findOne({ _id: review.userId });
        return {
          id: review._id.toString(),
          businessId: review.businessId?.toString() || review.businessId,
          userId: review.userId?.toString() || review.userId,
          userName: user?.name || 'Anonymous',
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { reviews: enrichedReviews },
      message: 'Reviews retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reviews',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { businessId, rating, comment } = body;

    if (!businessId || !rating) {
      return NextResponse.json(
        { error: 'Business ID and rating are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const reviewsCollection = db.collection('reviews');

    // Get user from token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: decoded.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newReview = {
      businessId,
      userId: user._id,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await reviewsCollection.insertOne(newReview);

    return NextResponse.json(
      {
        success: true,
        data: {
          review: {
            id: result.insertedId.toString(),
            ...newReview,
            userId: user._id.toString(),
          },
        },
        message: 'Review created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create review',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
