/**
 * Email API Route
 * Endpoint for sending emails with validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendSecurityAlertEmail,
  sendNotificationEmail,
} from "@/lib/emailService";
import { logger } from "@/lib/logger";
import { handleError } from "@/lib/errorHandler";

/**
 * POST /api/email
 * Send an email
 *
 * Request body:
 * {
 *   "type": "welcome" | "password-reset" | "order-confirmation" | "security-alert" | "notification" | "custom",
 *   "to": "recipient@example.com" | ["email1@example.com", "email2@example.com"],
 *   "subject": "Email Subject",
 *   "html": "<h1>HTML Content</h1>",
 *   "userName"?: "John Doe",
 *   "resetLink"?: "https://...",
 *   "orderId"?: "ORDER123",
 *   "amount"?: "$99.99",
 *   "alertType"?: "Unauthorized Access",
 *   "title"?: "Notification Title",
 *   "message"?: "Notification message"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate request method
    if (request.method !== "POST") {
      return NextResponse.json(
        {
          success: false,
          message: "Only POST requests are allowed",
        },
        { status: 405 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      type = "custom",
      to,
      subject,
      html,
      userName,
      resetLink,
      orderId,
      amount,
      alertType,
      title,
      message,
      cc,
      bcc,
      replyTo,
    } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient email (to) is required",
        },
        { status: 400 }
      );
    }

    logger.info(`Email request received`, { type, to, subject });

    let result;

    // Process email based on type
    switch (type) {
      case "welcome":
        if (!userName) {
          return NextResponse.json(
            {
              success: false,
              message: "userName is required for welcome emails",
            },
            { status: 400 }
          );
        }
        result = await sendWelcomeEmail(
          typeof to === "string" ? to : to[0],
          userName
        );
        break;

      case "password-reset":
        if (!userName || !resetLink) {
          return NextResponse.json(
            {
              success: false,
              message:
                "userName and resetLink are required for password reset emails",
            },
            { status: 400 }
          );
        }
        result = await sendPasswordResetEmail(
          typeof to === "string" ? to : to[0],
          userName,
          resetLink
        );
        break;

      case "order-confirmation":
        if (!userName || !orderId || !amount) {
          return NextResponse.json(
            {
              success: false,
              message:
                "userName, orderId, and amount are required for order confirmation emails",
            },
            { status: 400 }
          );
        }
        result = await sendOrderConfirmationEmail(
          typeof to === "string" ? to : to[0],
          userName,
          orderId,
          amount
        );
        break;

      case "security-alert":
        if (!userName || !alertType) {
          return NextResponse.json(
            {
              success: false,
              message:
                "userName and alertType are required for security alert emails",
            },
            { status: 400 }
          );
        }
        result = await sendSecurityAlertEmail(
          typeof to === "string" ? to : to[0],
          userName,
          alertType
        );
        break;

      case "notification":
        if (!userName || !title || !message) {
          return NextResponse.json(
            {
              success: false,
              message:
                "userName, title, and message are required for notification emails",
            },
            { status: 400 }
          );
        }
        result = await sendNotificationEmail(
          typeof to === "string" ? to : to[0],
          userName,
          title,
          message
        );
        break;

      case "custom":
        if (!subject || !html) {
          return NextResponse.json(
            {
              success: false,
              message: "subject and html are required for custom emails",
            },
            { status: 400 }
          );
        }
        result = await sendEmail({
          to,
          subject,
          html,
          cc,
          bcc,
          replyTo,
        });
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: `Unknown email type: ${type}`,
          },
          { status: 400 }
        );
    }

    // Return success response
    if (result.success) {
      logger.info(`Email sent successfully`, {
        type,
        messageId: result.messageId,
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          timestamp: result.timestamp,
          type,
        },
        { status: 200 }
      );
    } else {
      // Return error from email service
      logger.error(`Email service error`, {
        type,
        error: result.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error(`Email API error`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return handleError(error, "email API");
  }
}

/**
 * GET /api/email
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "email",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
