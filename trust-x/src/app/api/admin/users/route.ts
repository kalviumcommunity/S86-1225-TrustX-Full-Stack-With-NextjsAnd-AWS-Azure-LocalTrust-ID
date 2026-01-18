import { NextResponse } from "next/server";
import { getDb, ObjectId } from "@/lib/mongodb";
import { handleError } from "@/lib/errorHandler";
import { cacheService } from "@/lib/cache";

export async function PATCH(req: Request) {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({
        success: false,
        message: "User ID and role are required"
      }, { status: 400 });
    }

    // Validate role
    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({
        success: false,
        message: "Invalid role. Must be USER or ADMIN"
      }, { status: 400 });
    }

    const db = await getDb();
    
    // Update user role
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role, updatedAt: new Date() } }
    );
    
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    const formattedUser = updatedUser ? {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt
    } : null;

    // Invalidate all user list caches after updating a user
    const invalidatedCount = await cacheService.delPattern("users:list:*");
    if (invalidatedCount > 0) {
      console.log(`Invalidated ${invalidatedCount} user list cache entries`);
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: formattedUser
    });
  } catch (error) {
    return handleError(error, "PATCH /api/admin/users");
  }
}