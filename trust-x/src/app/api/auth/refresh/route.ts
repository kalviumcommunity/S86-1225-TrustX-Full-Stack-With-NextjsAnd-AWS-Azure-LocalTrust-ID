import { NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '../../../../lib/jwt';
import { getDb, ObjectId } from '../../../../lib/mongodb';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from HTTP-only cookie
 * 
 * Flow:
 * 1. Extract refresh token from cookie
 * 2. Verify refresh token validity
 * 3. Check if user still exists
 * 4. Generate new access token
 * 5. Return new access token
 */
export async function POST(req: Request) {
  try {
    // Extract refresh token from HTTP-only cookie
    const refreshToken = req.headers.get('cookie')
      ?.split('; ')
      .find(row => row.startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token missing' },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error instanceof Error ? error.message : 'Invalid refresh token'
        },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new access token with current user data
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Create response with new access token
    const response = NextResponse.json({
      success: true,
      message: 'Access token refreshed',
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Update access token cookie
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
