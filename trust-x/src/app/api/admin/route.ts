import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Get user info from middleware headers
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    // Get all users for admin dashboard
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

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
        users: users,
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