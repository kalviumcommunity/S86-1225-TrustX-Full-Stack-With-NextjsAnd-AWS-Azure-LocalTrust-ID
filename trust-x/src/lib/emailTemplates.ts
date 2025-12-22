/**
 * Email Templates for TrustX Application
 * Provides reusable HTML templates for transactional emails
 */

export const welcomeTemplate = (userName: string, appName: string = "TrustX") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background: white; padding: 30px; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .button { background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      a { color: #0066cc; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to ${appName}! 🎉</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>Thank you for joining ${appName}! We're thrilled to have you on board.</p>
        <p>You can now access your dashboard and start exploring all the amazing features we have to offer.</p>
        <a href="${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.example.com'}/dashboard" class="button">
          Go to Dashboard
        </a>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The ${appName} Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export const passwordResetTemplate = (userName: string, resetLink: string, appName: string = "TrustX") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: #ff6b6b; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background: white; padding: 30px; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .button { background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request 🔐</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetLink}" class="button">
          Reset Password
        </a>
        <div class="warning">
          <strong>⚠️ Important:</strong> This link expires in 24 hours. If you didn't request this, please ignore this email.
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;"><code>${resetLink}</code></p>
        <p>If you have questions, contact our support team.</p>
        <p>Best regards,<br/>The ${appName} Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export const orderConfirmationTemplate = (userName: string, orderId: string, amount: string, appName: string = "TrustX") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: #27ae60; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background: white; padding: 30px; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .order-summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .row { display: flex; justify-content: space-between; margin: 10px 0; }
      .button { background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Order Confirmed ✅</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>Thank you for your order! We've received your payment and your order is being processed.</p>
        <div class="order-summary">
          <h3>Order Summary</h3>
          <div class="row">
            <strong>Order ID:</strong>
            <span>${orderId}</span>
          </div>
          <div class="row">
            <strong>Total Amount:</strong>
            <span>${amount}</span>
          </div>
          <div class="row">
            <strong>Status:</strong>
            <span style="color: #27ae60; font-weight: bold;">Processing</span>
          </div>
        </div>
        <p>You'll receive a shipping notification once your order is on its way.</p>
        <a href="${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.example.com'}/orders/${orderId}" class="button">
          Track Order
        </a>
        <p>If you have any questions about your order, please contact our support team.</p>
        <p>Best regards,<br/>The ${appName} Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export const securityAlertTemplate = (userName: string, alertType: string, appName: string = "TrustX") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: #e74c3c; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background: white; padding: 30px; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .alert-box { background: #ffe8e8; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
      .button { background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Security Alert 🚨</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <div class="alert-box">
          <strong>Alert Type:</strong> ${alertType}
        </div>
        <p>We detected unusual activity on your account. If this wasn't you, please secure your account immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.example.com'}/security" class="button">
          Review Account Activity
        </a>
        <p><strong>What you should do:</strong></p>
        <ul>
          <li>Change your password immediately</li>
          <li>Enable two-factor authentication</li>
          <li>Review your account activity log</li>
        </ul>
        <p>If you believe your account has been compromised, please contact our support team immediately.</p>
        <p>Best regards,<br/>The ${appName} Security Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export const notificationTemplate = (userName: string, title: string, message: string, appName: string = "TrustX") => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
      .header { background: #3498db; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background: white; padding: 30px; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>${message}</p>
        <p>Best regards,<br/>The ${appName} Team</p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;
