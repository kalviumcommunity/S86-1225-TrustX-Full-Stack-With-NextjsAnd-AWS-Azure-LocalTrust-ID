Global API Response Handler
===========================

This project uses a centralized response handler to ensure all API routes return a consistent envelope.

Response envelope format
------------------------

{
  "success": boolean,
  "message": string,
  "data"?: any,
  "error"?: { "code": string, "details"?: string },
  "timestamp": string
}

Files
- `src/lib/responseHandler.ts` — exports `sendSuccess` and `sendError` helpers.
- `src/lib/errorCodes.ts` — standard error code mappings.

Usage examples
--------------

// Success
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 12, "name": "Charlie" },
  "timestamp": "2025-10-30T10:00:00Z"
}

// Error
{
  "success": false,
  "message": "Missing required field: name",
  "error": { "code": "VALIDATION_ERROR" },
  "timestamp": "2025-10-30T10:00:00Z"
}

Route usage
-----------

Import and use the helpers inside any route:

import { sendSuccess, sendError } from '@/lib/responseHandler';
import { ERROR_CODES } from '@/lib/errorCodes';

try {
  // ...logic
  return sendSuccess(data, 'Fetched successfully', 200);
} catch (err) {
  return sendError('Internal error', ERROR_CODES.INTERNAL_ERROR, 500, err);
}

Defined error codes
-------------------

VALIDATION_ERROR — E001
NOT_FOUND — E002
DATABASE_FAILURE — E003
INTERNAL_ERROR — E500

Benefits
--------
- Predictable responses for front-end consumers
- Easier error tracing with error codes and timestamps
- Simplified monitoring and observability integration

Input validation with Zod
------------------------

This project uses Zod to validate incoming `POST` and `PUT` requests for products.

Files:
- `src/lib/schemas/productSchema.ts` — Zod schemas for creating and updating products.

Example usage (server-side):

import { productCreateSchema } from '@/lib/schemas/productSchema';
import { ZodError } from 'zod';

try {
  const body = await req.json();
  const validated = productCreateSchema.parse(body);
  // use validated values
} catch (err) {
  if (err instanceof ZodError) {
    // return structured validation errors
  }
}

Validation benefits:
- Prevents invalid records entering the database
- Provides clear client-facing error messages
- Enables reuse of schemas on client and server
