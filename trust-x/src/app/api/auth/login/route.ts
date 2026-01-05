import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "../../../../lib/prisma";
import { generateAccessToken, generateRefreshToken } from "../../../../lib/jwt";
import { logger } from "../../../../lib/logger";
import { createRequestContext, logRequestCompletion } from "../../../../lib/requestLogger";

export async function POST(req: NextRequest) {
  const context = createRequestContext(req);

  try {
    const { email, password } = await req.json();

    logger.debug('Login attempt', {
      requestId: context.requestId,
      email,
    });

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.logAuth('login_failed', undefined, false, context.requestId);
      logger.warn('Login failed - user not found', {
        requestId: context.requestId,
        email,
      });
      logRequestCompletion(context, req, 404);
      return NextResponse.json(
        { success: false, message: "User not found", requestId: context.requestId },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.logAuth('login_failed', user.id, false, context.requestId);
      logger.warn('Login failed - invalid password', {
        requestId: context.requestId,
        userId: user.id,
      });
      logRequestCompletion(context, req, 401);
      return NextResponse.json(
        { success: false, message: "Invalid credentials", requestId: context.requestId },
        { status: 401 }
      );
    }

    // Generate tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Log successful authentication
    logger.logAuth('login_success', user.id, true, context.requestId);
    logger.info('User logged in successfully', {
      requestId: context.requestId,
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      requestId: context.requestId,
    });

    // Set refresh token as HTTP-only cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Optionally set access token as cookie
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    // Add request ID to response headers
    response.headers.set('X-Request-ID', context.requestId);

    logger.debug('Cookies set successfully', {
      requestId: context.requestId,
      userId: user.id,
      secure: process.env.NODE_ENV === 'production',
    });

    logRequestCompletion(context, req, 200);
    return response;
  } catch (error) {
    logger.error('Login error', {
      requestId: context.requestId,
    }, error as Error);

    logRequestCompletion(context, req, 500);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.requestId,
      },
      { status: 500 }
    );
  }
}