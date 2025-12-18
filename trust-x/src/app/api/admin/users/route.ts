import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update user role",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}