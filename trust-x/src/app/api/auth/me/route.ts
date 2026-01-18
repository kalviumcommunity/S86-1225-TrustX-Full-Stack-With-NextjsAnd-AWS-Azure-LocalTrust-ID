import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
    
    const db = await getDb();
    
    // JWT contains email, not id
    const userData = await db.collection('users').findOne(
      { email: decoded.email },
      { projection: { password: 0 } }
    );
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = {
      id: userData._id.toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role || 'USER',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };

    return NextResponse.json({ 
      data: { user },
      success: true,
      message: 'User profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
