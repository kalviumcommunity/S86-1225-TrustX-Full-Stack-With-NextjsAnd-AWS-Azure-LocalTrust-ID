#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests all email functionality with various templates
 * 
 * Usage:
 * npx ts-node scripts/test-email.ts
 * or
 * tsx scripts/test-email.ts
 */

import { sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail, sendSecurityAlertEmail, sendNotificationEmail, sendEmail } from "../src/lib/emailService";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

async function testEmails() {
  // Check for required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    log("❌ ERROR: SENDGRID_API_KEY is not set in environment variables", "red");
    log("Please configure your .env file with:", "yellow");
    log("SENDGRID_API_KEY=your-api-key-here", "yellow");
    log("SENDGRID_SENDER=noreply@yourdomain.com", "yellow");
    process.exit(1);
  }

  if (!process.env.SENDGRID_SENDER) {
    log("❌ ERROR: SENDGRID_SENDER is not set in environment variables", "red");
    process.exit(1);
  }

  // Test email address (use your own email for testing)
  const testEmail = process.env.TEST_EMAIL || "test@example.com";

  log("📧 Email Service Test Suite", "blue");
  log(`SendGrid API configured ✓`, "green");
  log(`Sender: ${process.env.SENDGRID_SENDER}`, "green");
  log(`Test recipient: ${testEmail}\n`, "green");

  // Note about sandbox mode
  log("ℹ️  NOTE: If you haven't verified ${testEmail} in SendGrid,", "yellow");
  log("you may get delivery failures. Verify sender in SendGrid dashboard.", "yellow");

  logSection("Test 1: Welcome Email");
  try {
    log("Sending welcome email...", "blue");
    const result = await sendWelcomeEmail(testEmail, "John Doe");

    if (result.success) {
      log("✅ Welcome email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send welcome email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 2: Password Reset Email");
  try {
    log("Sending password reset email...", "blue");
    const resetLink = `https://example.com/reset?token=abc123def456`;
    const result = await sendPasswordResetEmail(testEmail, "Jane Smith", resetLink);

    if (result.success) {
      log("✅ Password reset email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send password reset email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 3: Order Confirmation Email");
  try {
    log("Sending order confirmation email...", "blue");
    const result = await sendOrderConfirmationEmail(
      testEmail,
      "Mike Johnson",
      "ORD-20251222-001",
      "$149.99"
    );

    if (result.success) {
      log("✅ Order confirmation email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send order confirmation email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 4: Security Alert Email");
  try {
    log("Sending security alert email...", "blue");
    const result = await sendSecurityAlertEmail(
      testEmail,
      "Sarah Williams",
      "Unauthorized login attempt from IP 192.168.1.100"
    );

    if (result.success) {
      log("✅ Security alert email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send security alert email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 5: Generic Notification Email");
  try {
    log("Sending notification email...", "blue");
    const result = await sendNotificationEmail(
      testEmail,
      "Alex Brown",
      "Your account activity",
      "Your account has been updated. If this wasn't you, please change your password immediately."
    );

    if (result.success) {
      log("✅ Notification email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send notification email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 6: Custom Email");
  try {
    log("Sending custom HTML email...", "blue");
    const customHtml = `
      <h2>Custom Test Email</h2>
      <p>This is a custom email with HTML content.</p>
      <ul>
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
      </ul>
      <p><strong>Best regards,</strong><br/>TrustX Team</p>
    `;

    const result = await sendEmail({
      to: testEmail,
      subject: "Custom Test Email from TrustX",
      html: customHtml,
    });

    if (result.success) {
      log("✅ Custom email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send custom email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test 7: Bulk Email");
  try {
    log("Sending bulk emails...", "blue");
    const recipients = [testEmail];
    const bulkHtml = `
      <h2>Bulk Email Test</h2>
      <p>This email was sent to multiple recipients.</p>
    `;

    const result = await sendEmail({
      to: recipients,
      subject: "Bulk Email Test from TrustX",
      html: bulkHtml,
    });

    if (result.success) {
      log("✅ Bulk email sent successfully!", "green");
      log(`Message ID: ${result.messageId}`, "green");
      log(`Timestamp: ${result.timestamp}`, "green");
    } else {
      log(`❌ Failed to send bulk email: ${result.error}`, "red");
    }
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }

  logSection("Test Summary");
  log("✅ All email tests completed!", "green");
  log("\nNext steps:", "blue");
  log("1. Check your email inbox for test messages", "yellow");
  log("2. Check SendGrid Dashboard for delivery status", "yellow");
  log("3. Review logs for any failures", "yellow");
  log("4. Verify sender authentication in SendGrid settings", "yellow");
  log("\nDocumentation:", "blue");
  log("- SendGrid: https://sendgrid.com/", "cyan");
  log("- API Docs: https://docs.sendgrid.com/for-developers/sending-email", "cyan");
  log("- Rate Limits: Check your SendGrid plan for email limits", "cyan");
}

// Run tests
testEmails().catch((error) => {
  log(`Fatal error: ${error instanceof Error ? error.message : String(error)}`, "red");
  process.exit(1);
});
