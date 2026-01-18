/**
 * Business Profile Detail API
 * 
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     summary: Get business by ID
 *     tags: [Businesses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business details
 *   put:
 *     summary: Update business profile
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   delete:
 *     summary: Delete business (soft delete)
 *     tags: [Businesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */

import { NextRequest } from 'next/server';
import { getDb, ObjectId } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';

// GET /api/businesses/[id] - Get business details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    
    if (!ObjectId.isValid(params.id)) {
      return sendError('Invalid business ID', 'INVALID_ID', 400);
    }

    const business = await db.collection('businesses').findOne({
      _id: new ObjectId(params.id),
      status: 'active'
    });

    if (!business) {
      return sendError('Business not found', 'NOT_FOUND', 404);
    }

    // Increment view count
    await db.collection('businesses').updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { totalViews: 1 } }
    );

    // Get owner details
    const owner = await db.collection('users').findOne(
      { _id: business.ownerId },
      { projection: { name: 1, email: 1 } }
    );

    // Format response
    const formattedBusiness = {
      id: business._id.toString(),
      name: business.name,
      category: business.category,
      description: business.description,
      location: business.location,
      contactInfo: business.contactInfo,
      trustScore: business.trustScore || 0,
      isVerified: business.isVerified || false,
      verificationBadges: business.verificationBadges || [],
      reviewCount: business.reviewCount || 0,
      averageRating: business.averageRating || 0,
      totalViews: (business.totalViews || 0) + 1,
      logo: business.logo,
      coverImage: business.coverImage,
      gallery: business.gallery || [],
      businessHours: business.businessHours || {},
      socialLinks: business.socialLinks || {},
      owner: owner ? {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email
      } : null,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    };

    return sendSuccess({ business: formattedBusiness }, 'Business retrieved successfully');
  } catch (error) {
    console.error('Error fetching business:', error);
    return sendError('Failed to fetch business', 'INTERNAL_ERROR', 500);
  }
}

// PUT /api/businesses/[id] - Update business profile
export async function PUT(
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
      return sendError('Not authorized to update this business', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    
    // Fields that can be updated
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (body.name) updateFields.name = body.name;
    if (body.category) updateFields.category = body.category;
    if (body.description) updateFields.description = body.description;
    if (body.location) updateFields.location = body.location;
    if (body.contactInfo) updateFields.contactInfo = body.contactInfo;
    if (body.logo) updateFields.logo = body.logo;
    if (body.coverImage) updateFields.coverImage = body.coverImage;
    if (body.gallery) updateFields.gallery = body.gallery;
    if (body.businessHours) updateFields.businessHours = body.businessHours;
    if (body.socialLinks) updateFields.socialLinks = body.socialLinks;

    const result = await db.collection('businesses').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return sendError('No changes made', 'NO_CHANGES', 400);
    }

    const updatedBusiness = await db.collection('businesses').findOne({
      _id: new ObjectId(params.id)
    });

    return sendSuccess(
      {
        business: {
          id: updatedBusiness!._id.toString(),
          ...updatedBusiness
        }
      },
      'Business updated successfully'
    );
  } catch (error) {
    console.error('Error updating business:', error);
    return sendError('Failed to update business', 'INTERNAL_ERROR', 500);
  }
}

// DELETE /api/businesses/[id] - Soft delete business
export async function DELETE(
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
      return sendError('Not authorized to delete this business', 'FORBIDDEN', 403);
    }

    // Soft delete - set status to 'deleted'
    await db.collection('businesses').updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status: 'deleted',
          updatedAt: new Date()
        } 
      }
    );

    return sendSuccess(null, 'Business deleted successfully');
  } catch (error) {
    console.error('Error deleting business:', error);
    return sendError('Failed to delete business', 'INTERNAL_ERROR', 500);
  }
}
