import { NextResponse } from 'next/server';

export const sendSuccess = (
  data: unknown,
  message = 'Success',
  status = 200
) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

export const sendError = (
  message = 'Something went wrong',
  code = 'INTERNAL_ERROR',
  status: string | number = 500,
  details?: unknown
) => {
  const statusCode = typeof status === 'string' ? parseInt(status, 10) : status;
  
  return NextResponse.json(
    {
      success: false,
      message,
      error: { code, details },
      timestamp: new Date().toISOString(),
    },
    { status: isNaN(statusCode) ? 500 : statusCode }
  );
};

export default sendSuccess;
