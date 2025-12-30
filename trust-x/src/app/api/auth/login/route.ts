import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "../../../../lib/prisma";
import { generateAccessToken, generateRefreshToken } from "../../../../lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    // Token payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Generate tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      accessToken, // Return in body for client-side storage (optional)
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set refresh token as HTTP-only cookie (secure, SameSite)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/', // Available across all routes
    });

    // Optionally set access token as cookie too
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Login failed", 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}