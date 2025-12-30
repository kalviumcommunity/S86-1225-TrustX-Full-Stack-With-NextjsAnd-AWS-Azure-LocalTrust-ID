import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "../../../../lib/prisma";
import { sendWelcomeEmail } from "../../../../lib/emailService";
import { logger } from "../../../../lib/logger";
import { userRegistrationSchema, validateAndSanitize } from "../../../../lib/validation";
import { sanitizeEmail, sanitizeStrict, logSanitization } from "../../../../lib/sanitize";
import { sendSuccess, sendError } from "../../../../lib/responseHandler";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate and sanitize input using Zod schema
    const result = await validateAndSanitize(userRegistrationSchema, body);

    if (!result.success) {
      return sendError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        result.errors.format()
      );
    }

    const { name, email, password, role = "USER" } = result.data;

    // Additional sanitization with logging
    const sanitizedName = sanitizeStrict(name);
    const sanitizedEmail = sanitizeEmail(email);

    if (name !== sanitizedName) {
      logSanitization('name', name, sanitizedName, 'sanitizeStrict');
    }
    if (email !== sanitizedEmail) {
      logSanitization('email', email, sanitizedEmail, 'sanitizeEmail');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return sendError('User already exists', 'USER_EXISTS', 400);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with sanitized data
    const newUser = await prisma.user.create({
      data: { 
        name: sanitizedName, 
        email: sanitizedEmail, 
        password: hashedPassword, 
        role 
      },
    });

    console.log('✅ [SANITIZE] User created safely:', newUser.id);

    // Send welcome email asynchronously (don't block response)
    sendWelcomeEmail(sanitizedEmail, sanitizedName)
      .then((result) => {
        if (result.success) {
          logger.info(`Welcome email sent to ${sanitizedEmail}`, { messageId: result.messageId });
        } else {
          logger.warn(`Failed to send welcome email to ${sanitizedEmail}`, { error: result.error });
        }
      })
      .catch((error) => {
        logger.error(`Error sending welcome email to ${sanitizedEmail}`, { error: error.message });
      });

    return sendSuccess({ user: newUser }, 'Signup successful', 201);
  } catch (error) {
    logger.error('Signup failed', { error });
    return sendError('Signup failed', 'INTERNAL_ERROR', 500);
  }
}