import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errorHandler";

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
    return handleError(error, "PATCH /api/admin/users");
  }
}