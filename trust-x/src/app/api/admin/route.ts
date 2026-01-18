import { NextResponse } from "next/server";
import { getDb, ObjectId } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    const db = await getDb();
    
    // Get all users for admin dashboard
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Convert _id to id for response
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));

    const userCount = await db.collection('users').countDocuments();
    const adminCount = await db.collection('users').countDocuments({ role: "ADMIN" });

    return NextResponse.json({
      success: true,
      message: "Welcome Admin! You have full access.",
      data: {
        userEmail,
        userRole,
        stats: {
          totalUsers: userCount,
          adminUsers: adminCount,
          regularUsers: userCount - adminCount,
        },
        users: formattedUsers,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to fetch admin data",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}