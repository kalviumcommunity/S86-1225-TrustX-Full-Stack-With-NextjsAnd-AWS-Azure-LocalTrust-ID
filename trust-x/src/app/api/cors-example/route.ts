/**
 * Example API Route with CORS Configuration
 * 
 * Demonstrates secure CORS setup for cross-origin API access
 * Shows how to restrict API access to trusted domains only
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { ERROR_CODES } from '@/lib/errorCodes';

// Allowed origins (customize for your deployment)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://your-production-domain.com',
  'https://your-staging-domain.com',
  // Add more trusted domains as needed
];

/**
 * Set CORS headers for API response
 */
function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, { 
      status: 403,
      statusText: 'Forbidden - Origin not allowed'
    });
  }

  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * GET /api/cors-example
 * Public endpoint demonstrating CORS configuration
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  
  // Log CORS request for monitoring
  console.log('📡 [CORS] Request from origin:', origin || 'same-origin');
  
  const data = {
    message: 'CORS configured securely',
    timestamp: new Date().toISOString(),
    origin: origin || 'same-origin',
    allowed: origin ? ALLOWED_ORIGINS.includes(origin) : true,
    headers: {
      'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'Not allowed',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    },
    security: {
      'HSTS': 'Enabled (2 years)',
      'CSP': 'Enabled (restrictive policy)',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    },
  };
  
  const response = sendSuccess(data, 'CORS example response');
  return setCorsHeaders(response, origin);
}

/**
 * POST /api/cors-example
 * Example POST endpoint with CORS
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  
  // Verify origin is allowed for POST requests
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return sendError(
      'Origin not allowed',
      'VALIDATION_ERROR',
      403
    );
  }
  
  try {
    const body = await req.json();
    
    console.log('📡 [CORS POST] Request from origin:', origin || 'same-origin');
    console.log('📥 [CORS POST] Body:', body);
    
    const data = {
      received: body,
      timestamp: new Date().toISOString(),
      origin: origin || 'same-origin',
    };
    
    const response = sendSuccess(data, 'Data received successfully');
    return setCorsHeaders(response, origin);
    
  } catch (error) {
    return sendError(
      'Invalid JSON body',
      ERROR_CODES.VALIDATION_ERROR,
      400,
      error
    );
  }
}

/**
 * Example: Testing CORS from another domain
 * 
 * From your frontend (if deployed on a different domain):
 * 
 * fetch('https://your-api-domain.com/api/cors-example', {
 *   method: 'GET',
 *   credentials: 'include', // Important for cookies/auth
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 * })
 * .then(res => res.json())
 * .then(data => console.log(data))
 * .catch(err => console.error('CORS error:', err));
 * 
 * If the request fails with CORS error:
 * 1. Check that your origin is in ALLOWED_ORIGINS array
 * 2. Verify the API returns Access-Control-Allow-Origin header
 * 3. Check that credentials: 'include' is set if using cookies
 */
