/**
 * Input Validation Schemas
 * 
 * Zod schemas for validating and sanitizing user inputs.
 * Combines validation with sanitization for robust security.
 */

import { z } from 'zod';
import { sanitizeStrict, sanitizeBasic, sanitizeEmail, sanitizeUrl } from './sanitize';

/**
 * User-related schemas
 */

export const userRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => sanitizeStrict(val)),
  
  email: z.string()
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .email('Invalid email format')
    .transform((val) => sanitizeEmail(val)),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'VIEWER']).optional(),
});

export const userLoginSchema = z.object({
  email: z.string()
    .min(5, 'Email is required')
    .max(255, 'Email is too long')
    .email('Invalid email format')
    .transform((val) => sanitizeEmail(val)),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

export const userUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => sanitizeStrict(val))
    .optional(),
  
  email: z.string()
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .email('Invalid email format')
    .transform((val) => sanitizeEmail(val))
    .optional(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .optional(),
});

/**
 * Project-related schemas
 */

export const projectCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform((val) => sanitizeStrict(val)),
  
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .transform((val) => sanitizeBasic(val))
    .optional(),
  
  status: z.enum(['active', 'inactive', 'completed']).optional(),
  
  userId: z.number().int().positive().optional(),
});

export const projectUpdateSchema = z.object({
  title: z.string()
    .min(1, 'Title must be at least 1 character')
    .max(200, 'Title must be less than 200 characters')
    .transform((val) => sanitizeStrict(val))
    .optional(),
  
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .transform((val) => sanitizeBasic(val))
    .optional(),
  
  status: z.enum(['active', 'inactive', 'completed']).optional(),
});

/**
 * Comment/Content schemas
 */

export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform((val) => sanitizeBasic(val)),
  
  authorName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => sanitizeStrict(val))
    .optional(),
});

/**
 * Search/Filter schemas
 */

export const searchSchema = z.object({
  query: z.string()
    .max(200, 'Search query is too long')
    .transform((val) => sanitizeStrict(val))
    .optional(),
  
  page: z.number().int().positive().max(10000).optional(),
  
  limit: z.number().int().positive().max(100).optional(),
  
  sortBy: z.string()
    .max(50, 'Sort field is too long')
    .transform((val) => sanitizeStrict(val))
    .optional(),
  
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * File upload schemas
 */

export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename is too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  
  mimetype: z.string()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid mimetype'),
  
  size: z.number().int().positive().max(10485760), // 10MB max
});

/**
 * Generic ID validation
 */

export const idSchema = z.object({
  id: z.number().int().positive(),
});

export const stringIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

/**
 * Contact form schema
 */

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .transform((val) => sanitizeStrict(val)),
  
  email: z.string()
    .min(5, 'Valid email is required')
    .email('Invalid email format')
    .transform((val) => sanitizeEmail(val)),
  
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject is too long')
    .transform((val) => sanitizeStrict(val)),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message is too long')
    .transform((val) => sanitizeBasic(val)),
});

/**
 * Pagination schema
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Helper function to validate and sanitize data
 */
export async function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}
