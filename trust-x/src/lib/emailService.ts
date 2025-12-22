/**
 * Email Service
 * Handles sending emails via SendGrid with logging and error handling
 */

import sendgrid from "@sendgrid/mail";
import { logger } from "./logger";

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  logger.info("SENDGRID_API_KEY is not set in environment variables");
} else {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

/**
 * Send an email using SendGrid
 * @param payload Email payload with recipient, subject, and content
 * @returns Promise with success status and message ID or error
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResponse> {
  const timestamp = new Date().toISOString();

  try {
    // Validate environment variables
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    if (!process.env.SENDGRID_SENDER) {
      throw new Error("SENDGRID_SENDER email is not configured");
    }

    // Prepare email data
    const emailData = {
      to: payload.to,
      from: process.env.SENDGRID_SENDER,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      cc: payload.cc,
      bcc: payload.bcc,
    };

    // Remove undefined fields
    Object.keys(emailData).forEach(
      (key) =>
        emailData[key as keyof typeof emailData] === undefined &&
        delete emailData[key as keyof typeof emailData]
    );

    // Send email
    const response = await sendgrid.send(emailData);

    // Extract message ID from response headers
    const messageId = response[0]?.headers?.["x-message-id"] || "unknown";

    logger.info(`Email sent successfully`, {
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      messageId,
      timestamp,
    });

    return {
      success: true,
      messageId,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`Failed to send email`, {
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      error: errorMessage,
      timestamp,
    });

    return {
      success: false,
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<EmailResponse> {
  const { welcomeTemplate } = await import("./emailTemplates");

  return sendEmail({
    to: email,
    subject: "Welcome to TrustX! 🎉",
    html: welcomeTemplate(userName),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<EmailResponse> {
  const { passwordResetTemplate } = await import("./emailTemplates");

  return sendEmail({
    to: email,
    subject: "Reset Your Password - TrustX",
    html: passwordResetTemplate(userName, resetLink),
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  userName: string,
  orderId: string,
  amount: string
): Promise<EmailResponse> {
  const { orderConfirmationTemplate } = await import("./emailTemplates");

  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderId}`,
    html: orderConfirmationTemplate(userName, orderId, amount),
  });
}

/**
 * Send security alert email
 */
export async function sendSecurityAlertEmail(
  email: string,
  userName: string,
  alertType: string
): Promise<EmailResponse> {
  const { securityAlertTemplate } = await import("./emailTemplates");

  return sendEmail({
    to: email,
    subject: "Security Alert - TrustX",
    html: securityAlertTemplate(userName, alertType),
  });
}

/**
 * Send generic notification email
 */
export async function sendNotificationEmail(
  email: string,
  userName: string,
  title: string,
  message: string
): Promise<EmailResponse> {
  const { notificationTemplate } = await import("./emailTemplates");

  return sendEmail({
    to: email,
    subject: title,
    html: notificationTemplate(userName, title, message),
  });
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<EmailResponse> {
  return sendEmail({
    to: recipients,
    subject,
    html,
  });
}
