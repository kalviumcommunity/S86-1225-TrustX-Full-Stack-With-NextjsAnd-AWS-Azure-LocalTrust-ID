/**
 * User Signup/Registration Endpoint
 * 
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account with email and password. Sends a welcome email upon successful registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must contain at least 8 characters
 *                 example: SecurePass123!
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 default: USER
 *                 description: User role (defaults to USER)
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: USER_EXISTS
 *               message: User already exists
 *               statusCode: 409
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb, ObjectId } from "../../../../lib/mongodb";
import { sendWelcomeEmail } from "../../../../lib/emailService";
import { logger } from "../../../../lib/logger";
import { userRegistrationSchema, validateAndSanitize } from "../../../../lib/validation";
import { sanitizeEmail, sanitizeStrict, logSanitization } from "../../../../lib/sanitize";
import { sendSuccess, sendError } from "../../../../lib/responseHandler";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check for missing required fields first
    if (!body.name || !body.email || !body.password) {
      const missing = [];
      if (!body.name) missing.push('name');
      if (!body.email) missing.push('email');
      if (!body.password) missing.push('password');
      
      return sendError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        400,
        { missingFields: missing }
      );
    }

    // Validate and sanitize input using Zod schema
    const validationResult = await validateAndSanitize(userRegistrationSchema, body);

    if (!validationResult.success) {
      // Format validation errors into user-friendly messages
      const errors = 'errors' in validationResult ? validationResult.errors.issues : [];
      const errorMessages = errors.map(err => `${err.path.join('.')}: ${err.message}`);
      
      return sendError(
        errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation failed',
        'VALIDATION_ERROR',
        400,
        'errors' in validationResult ? validationResult.errors.format() : undefined
      );
    }

    const { name, email, password, role = "USER" } = validationResult.data;

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
    const db = await getDb();
    const existingUser = await db.collection('users').findOne({ email: sanitizedEmail });
    if (existingUser) {
      return sendError(
        `An account with email "${sanitizedEmail}" already exists. Please login or use a different email.`,
        'USER_EXISTS',
        409
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with sanitized data
    const userData = { 
      name: sanitizedName, 
      email: sanitizedEmail, 
      password: hashedPassword, 
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const insertResult = await db.collection('users').insertOne(userData);
    const newUser = { ...userData, _id: insertResult.insertedId, id: insertResult.insertedId.toString() };

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

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    return sendSuccess({ user: userWithoutPassword }, 'Signup successful', 201);
  } catch (error) {
    logger.error('Signup failed', { error });
    return sendError('Signup failed', 'INTERNAL_ERROR', 500);
  }
}