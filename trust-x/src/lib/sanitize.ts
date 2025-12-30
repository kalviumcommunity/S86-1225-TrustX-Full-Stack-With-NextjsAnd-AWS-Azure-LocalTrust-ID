/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user inputs and prevent XSS attacks.
 * Uses sanitize-html for server-side sanitization and DOMPurify for client-side.
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize configuration options
 */
const strictSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

const basicSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

const richTextSanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  disallowedTagsMode: 'discard',
};

/**
 * Strict sanitization - removes ALL HTML tags and attributes
 * Use for: usernames, email addresses, search queries, simple text fields
 * 
 * @example
 * sanitizeStrict('<script>alert("XSS")</script>Hello')
 * // Returns: 'Hello'
 */
export function sanitizeStrict(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input, strictSanitizeOptions).trim();
}

/**
 * Basic sanitization - allows minimal safe HTML tags (b, i, em, strong, a, p, br)
 * Use for: comments, descriptions, user bios
 * 
 * @example
 * sanitizeBasic('<p>Hello <script>alert("XSS")</script><strong>World</strong></p>')
 * // Returns: '<p>Hello <strong>World</strong></p>'
 */
export function sanitizeBasic(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input, basicSanitizeOptions).trim();
}

/**
 * Rich text sanitization - allows more HTML tags for formatted content
 * Use for: blog posts, articles, rich text editors
 * 
 * @example
 * sanitizeRichText('<h1>Title</h1><script>alert("XSS")</script><p>Content</p>')
 * // Returns: '<h1>Title</h1><p>Content</p>'
 */
export function sanitizeRichText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input, richTextSanitizeOptions).trim();
}

/**
 * Sanitize email address
 * Removes any HTML and validates basic email format
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = sanitizeStrict(input).toLowerCase();
  
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize URL
 * Ensures URL is safe and uses allowed protocols
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  try {
    const url = new URL(input);
    
    // Only allow http, https, and mailto
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      return '';
    }
    
    return url.toString();
  } catch {
    // Invalid URL
    return '';
  }
}

/**
 * Sanitize filename
 * Removes path traversal characters and dangerous characters
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/\.{2,}/g, '_') // Prevent path traversal
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255); // Limit length
}

/**
 * Sanitize SQL identifier (table/column names)
 * Note: With Prisma, this is rarely needed as it handles escaping
 */
export function sanitizeSqlIdentifier(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Only allow alphanumeric and underscore
  return input.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Sanitize number input
 * Ensures input is a valid number and within optional bounds
 */
export function sanitizeNumber(
  input: unknown,
  options: { min?: number; max?: number; isInteger?: boolean } = {}
): number | null {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (options.isInteger && !Number.isInteger(num)) return null;
  if (options.min !== undefined && num < options.min) return null;
  if (options.max !== undefined && num > options.max) return null;
  
  return num;
}

/**
 * Sanitize boolean input
 * Converts various truthy/falsy values to boolean
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof input === 'number') return input !== 0;
  return false;
}

/**
 * Sanitize object by sanitizing all string values
 * Use for: API request bodies, form data
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (val: string) => string = sanitizeStrict
): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value) as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizer(item) : item
      ) as T[Extract<keyof T, string>];
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, sanitizer) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}

/**
 * Escape HTML entities for safe display
 * Use when you need to display user input as-is without sanitization
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitization utility for logging
 * Removes sensitive patterns before logging
 */
export function sanitizeForLog(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/password["\s:=]+[^\s&]*/gi, 'password=***')
    .replace(/token["\s:=]+[^\s&]*/gi, 'token=***')
    .replace(/api[_-]?key["\s:=]+[^\s&]*/gi, 'api_key=***')
    .replace(/secret["\s:=]+[^\s&]*/gi, 'secret=***');
}

/**
 * Log sanitization audit
 */
export function logSanitization(
  field: string,
  original: string,
  sanitized: string,
  method: string
): void {
  const wasModified = original !== sanitized;
  const emoji = wasModified ? '🧹' : '✅';
  
  if (wasModified) {
    console.log(
      `${emoji} [SANITIZE] Field '${field}' sanitized using ${method}`,
      `\n  Original length: ${original.length}`,
      `\n  Sanitized length: ${sanitized.length}`,
      `\n  Removed: ${original.length - sanitized.length} characters`
    );
  }
}
