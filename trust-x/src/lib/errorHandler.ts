import { NextResponse } from "next/server";
import { logger } from "./logger";

export function handleError(error: unknown, context: string) {
  const isProd = process.env.NODE_ENV === "production";

  // Safely extract error properties
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  const errorResponse = {
    success: false,
    message: isProd
      ? "Something went wrong. Please try again later."
      : errorMessage,
    ...(isProd ? {} : { stack: errorStack }),
  };

  logger.error(`Error in ${context}`, {
    message: errorMessage,
    stack: isProd ? "REDACTED" : errorStack,
  });

  return NextResponse.json(errorResponse, { status: 500 });
}