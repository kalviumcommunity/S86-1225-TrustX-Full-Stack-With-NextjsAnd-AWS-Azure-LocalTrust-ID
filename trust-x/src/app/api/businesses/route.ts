/**
 * Business Profile API
 * 
 * @swagger
 * /api/businesses:
 *   get:
 *     summary: Get all businesses (with search/filter)
 *     tags: [Businesses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by business category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: minTrustScore
 *         schema:
 *           type: number
 *         description: Minimum trust score
 *     responses:
 *       200:
 *         description: List of businesses
 *   post:
 *     summary: Create a new business profile
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *               contactInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Business created successfully
 */

import { NextRequest } from 'next/server';
import { getDb, ObjectId } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';

// GET /api/businesses - List all businesses with filters
export async function GET(req: NextRequest) {
  try {
    console.log('[API] GET /api/businesses - Starting request');
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const verified = searchParams.get('verified');
    const minTrustScore = searchParams.get('minTrustScore');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    console.log('[API] Connecting to database...');
    const db = await getDb();
    console.log('[API] Database connected successfully');
    
    // Build query filter
    const query: Record<string, unknown> = { status: 'active' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    
    if (verified === 'true') {
      query.isVerified = true;
    }
    
    if (minTrustScore) {
      query.trustScore = { $gte: parseFloat(minTrustScore) };
    }

    // Get businesses with aggregation for trust score calculation
    const businesses = await db.collection('businesses')
      .find(query)
      .sort({ trustScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('businesses').countDocuments(query);

    // Format response
    const formattedBusinesses = businesses.map(business => ({
      id: business._id.toString(),
      ownerId: business.ownerId?.toString() || null,
      name: business.name,
      category: business.category,
      description: business.description,
      location: business.location,
      trustScore: business.trustScore || 0,
      isVerified: business.isVerified || false,
      verificationBadges: business.verificationBadges || [],
      reviewCount: business.reviewCount || 0,
      averageRating: business.averageRating || 0,
      contactInfo: business.contactInfo,
      logo: business.logo,
      coverImage: business.coverImage,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    }));

    return sendSuccess({
      businesses: formattedBusinesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Businesses retrieved successfully');
  } catch (error) {
    console.error('[API] Error fetching businesses:', error);
    console.error('[API] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return sendError(
      `Failed to fetch businesses: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      'INTERNAL_ERROR', 
      500
    );
  }
}

// POST /api/businesses - Create new business profile
export async function POST(req: NextRequest) {
  const context = requireAuth(req);
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const body = await req.json();
    const db = await getDb();

    // Validate required fields
    const { name, category, description, location, contactInfo } = body;

    if (!name || !category || !description) {
      return sendError('Missing required fields: name, category, description', 'VALIDATION_ERROR', 400);
    }

    // Check if user already has a business
    const existingBusiness = await db.collection('businesses').findOne({
      ownerId: new ObjectId(context.userId)
    });

    if (existingBusiness) {
      return sendError('User already has a business profile', 'BUSINESS_EXISTS', 409);
    }

    // Create business profile
    const now = new Date();
    const businessData = {
      ownerId: new ObjectId(context.userId),
      name,
      category,
      description,
      location: location || {},
      contactInfo: contactInfo || {},
      
      // Trust & Verification
      trustScore: 0,
      isVerified: false,
      verificationBadges: [],
      verificationHistory: [],
      
      // Stats
      reviewCount: 0,
      averageRating: 0,
      totalViews: 0,
      
      // Media
      logo: body.logo || null,
      coverImage: body.coverImage || null,
      gallery: body.gallery || [],
      
      // Business hours
      businessHours: body.businessHours || {},
      
      // Social links
      socialLinks: body.socialLinks || {},
      
      // Status
      status: 'active',
      
      // Timestamps
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('businesses').insertOne(businessData);

    const business = {
      id: result.insertedId.toString(),
      ...businessData,
      ownerId: businessData.ownerId.toString()
    };

    return sendSuccess(
      { business },
      'Business profile created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating business:', error);
    return sendError('Failed to create business', 'INTERNAL_ERROR', 500);
  }
}
