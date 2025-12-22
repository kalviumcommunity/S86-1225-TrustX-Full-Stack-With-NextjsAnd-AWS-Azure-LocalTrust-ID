# Email Service Integration Guide

## Overview

The TrustX application includes a fully integrated transactional email service using **SendGrid**. This enables automatic sending of user notifications including welcome emails, password resets, order confirmations, security alerts, and custom notifications.

## Why Transactional Emails Matter

Transactional emails are critical for:
- **User Engagement**: Confirm important actions like signups and purchases
- **Trust & Security**: Alert users to account changes and security threats
- **Compliance**: Send legally required notifications and confirmations
- **User Experience**: Provide immediate feedback without requiring page navigation

## Architecture

The email system is composed of three main layers:

```
┌─────────────────────────────────────────┐
│        Email API Route                  │
│   src/app/api/email/route.ts            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Email Service                    │
│   src/lib/emailService.ts               │
│  - sendEmail()                          │
│  - sendWelcomeEmail()                   │
│  - sendPasswordResetEmail()             │
│  - sendOrderConfirmationEmail()         │
│  - sendSecurityAlertEmail()             │
│  - sendNotificationEmail()              │
│  - sendBulkEmail()                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Email Templates                  │
│   src/lib/emailTemplates.ts             │
│  - welcomeTemplate()                    │
│  - passwordResetTemplate()              │
│  - orderConfirmationTemplate()          │
│  - securityAlertTemplate()              │
│  - notificationTemplate()               │
└─────────────────────────────────────────┘
```

## Setup & Configuration

### Prerequisites

- Node.js 18+
- SendGrid account (free tier available)
- SendGrid API Key and verified sender email

### Step 1: Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Navigate to **Settings → Sender Authentication**
3. Verify your sender email or domain
4. Create an API Key under **Settings → API Keys** with "Full Access"

### Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your-actual-api-key-here
SENDGRID_SENDER=noreply@yourdomain.com

# Optional: For testing
TEST_EMAIL=your-test-email@example.com
```

### Step 3: Install Dependencies

```bash
npm install @sendgrid/mail
```

*(Already included in package.json)*

## Usage

### 1. Sending Welcome Emails

Automatically sent when users sign up:

```typescript
import { sendWelcomeEmail } from '@/lib/emailService';

const result = await sendWelcomeEmail('user@example.com', 'John Doe');

// Response:
// {
//   "success": true,
//   "messageId": "01010189b2example123",
//   "timestamp": "2025-12-22T10:30:00Z"
// }
```

The welcome email is automatically triggered in the signup flow:

```typescript
// src/app/api/auth/signup/route.ts
sendWelcomeEmail(email, name)
  .then((result) => {
    if (result.success) {
      logger.info(`Welcome email sent to ${email}`);
    }
  })
  .catch((error) => {
    logger.error(`Email send failed: ${error.message}`);
  });
```

### 2. Password Reset Emails

```typescript
import { sendPasswordResetEmail } from '@/lib/emailService';

const resetLink = `https://yourapp.com/reset?token=${token}`;
const result = await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  resetLink
);
```

### 3. Order Confirmation Emails

```typescript
import { sendOrderConfirmationEmail } from '@/lib/emailService';

const result = await sendOrderConfirmationEmail(
  'user@example.com',
  'John Doe',
  'ORD-20251222-001',
  '$149.99'
);
```

### 4. Security Alert Emails

```typescript
import { sendSecurityAlertEmail } from '@/lib/emailService';

const result = await sendSecurityAlertEmail(
  'user@example.com',
  'John Doe',
  'Unauthorized login attempt from IP 192.168.1.100'
);
```

### 5. Generic Notifications

```typescript
import { sendNotificationEmail } from '@/lib/emailService';

const result = await sendNotificationEmail(
  'user@example.com',
  'John Doe',
  'Account Update',
  'Your account settings have been changed.'
);
```

### 6. Custom Email

```typescript
import { sendEmail } from '@/lib/emailService';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Message',
  html: '<h1>Hello</h1><p>Custom HTML content</p>',
  cc: 'manager@example.com',
  bcc: 'archive@example.com'
});
```

### 7. Bulk Email

```typescript
import { sendBulkEmail } from '@/lib/emailService';

const recipients = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
];

const result = await sendBulkEmail(
  recipients,
  'Newsletter Subject',
  '<h2>Newsletter</h2><p>Content here</p>'
);
```

## API Endpoint

### POST /api/email

Send emails via HTTP request:

```bash
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "user@example.com",
    "userName": "John Doe"
  }'
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Email type: `welcome`, `password-reset`, `order-confirmation`, `security-alert`, `notification`, `custom` (default: `custom`) |
| `to` | string \| string[] | Yes | Recipient email(s) |
| `subject` | string | Yes* | Email subject (*required for custom) |
| `html` | string | Yes* | HTML email content (*required for custom) |
| `userName` | string | For typed emails | User's display name |
| `resetLink` | string | For password-reset | Password reset link |
| `orderId` | string | For order-confirmation | Order ID |
| `amount` | string | For order-confirmation | Order amount |
| `alertType` | string | For security-alert | Alert description |
| `title` | string | For notification | Notification title |
| `message` | string | For notification | Notification message |
| `cc` | string \| string[] | No | Carbon copy recipients |
| `bcc` | string \| string[] | No | Blind carbon copy recipients |
| `replyTo` | string | No | Reply-to email address |

#### Response Examples

**Success Response (200)**
```json
{
  "success": true,
  "messageId": "01010189b2example123",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "welcome"
}
```

**Error Response (400/500)**
```json
{
  "success": false,
  "error": "Recipient email (to) is required",
  "timestamp": "2025-12-22T10:30:00Z"
}
```

## Email Templates

All templates are responsive and styled HTML emails located in `src/lib/emailTemplates.ts`:

### Welcome Template
- Greeting and welcome message
- Link to dashboard
- Support contact info
- Professional footer

### Password Reset Template
- Security-focused design
- Reset link button
- 24-hour expiration warning
- Fall-back text link

### Order Confirmation Template
- Order summary with ID and amount
- Order status
- Tracking link
- Support information

### Security Alert Template
- Alert type prominently displayed
- Urgent action items
- Password change instructions
- Account security recommendations

### Notification Template
- Flexible title and message
- Professional branding
- Clear call-to-action

## Testing

### 1. Test Script

Run the comprehensive email test suite:

```bash
# Using tsx
npx tsx scripts/test-email.ts

# Or using ts-node
npx ts-node scripts/test-email.ts
```

Set test email address:
```bash
TEST_EMAIL=your-email@example.com npx tsx scripts/test-email.ts
```

The test script will:
1. Verify SendGrid configuration
2. Send test emails for all templates
3. Display message IDs and delivery status
4. Show color-coded results

### 2. Manual Testing with cURL

```bash
# Welcome Email
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "student@example.com",
    "userName": "Student Name"
  }'

# Password Reset
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password-reset",
    "to": "student@example.com",
    "userName": "Student Name",
    "resetLink": "https://app.example.com/reset?token=abc123"
  }'

# Order Confirmation
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order-confirmation",
    "to": "student@example.com",
    "userName": "Student Name",
    "orderId": "ORD-20251222-001",
    "amount": "$99.99"
  }'

# Custom Email
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "to": "student@example.com",
    "subject": "Welcome to Kalvium",
    "html": "<h3>Hello from TrustX 🚀</h3><p>Your account is ready!</p>"
  }'
```

### 3. Test via Postman

1. Create a new POST request
2. URL: `http://localhost:3000/api/email`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "type": "welcome",
  "to": "your-email@example.com",
  "userName": "Test User"
}
```
5. Send and check response

## Monitoring & Logging

### Log Files

All email activity is logged to the application logger (`src/lib/logger.ts`):

```
INFO: Email sent successfully
  - to: user@example.com
  - subject: Welcome to TrustX
  - messageId: 01010189b2example123
  - timestamp: 2025-12-22T10:30:00Z

ERROR: Failed to send email
  - to: user@example.com
  - subject: Welcome
  - error: Authentication failed
  - timestamp: 2025-12-22T10:30:00Z
```

### SendGrid Dashboard

Monitor email delivery in real-time:

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Mail Send**
3. View delivery statistics:
   - Delivered
   - Bounced
   - Spam Reports
   - Opens
   - Clicks

## Common Issues & Solutions

### Issue: "SENDGRID_API_KEY is not set"

**Solution:**
- Check `.env.local` has correct variable name (case-sensitive)
- Restart your development server: `npm run dev`
- Verify API key in SendGrid dashboard hasn't expired

### Issue: "Email from address not verified"

**Solution:**
- Login to SendGrid dashboard
- Go to **Settings → Sender Authentication**
- Verify your sender email or domain
- Wait for verification (email may take a few minutes)
- For sandbox mode, also verify recipient addresses

### Issue: "Authentication failed"

**Solution:**
- Verify API key is correct in `.env.local`
- API keys are case-sensitive
- Check the key is "Full Access" or has Email Send permissions
- Regenerate key if compromised

### Issue: "No such email account" or "550 User does not exist"

**Solution:**
- Verify recipient email address is valid
- In SendGrid sandbox mode, you must also verify recipient
- For production, ensure domain is fully authenticated

### Issue: Slow email delivery

**Solution:**
- Email is sent asynchronously, don't block response
- Use background jobs for high volume
- Check SendGrid rate limits (based on your plan)
- Monitor queue in SendGrid dashboard

### Issue: Emails going to spam

**Solution:**
- Implement SPF, DKIM, and DMARC records
- Verify sender domain, not just email
- Keep unsubscribe links in emails
- Monitor spam complaints in SendGrid
- Use authentication headers in templates

## Rate Limits & Throttling

### SendGrid Rate Limits

| Plan | Emails per day | Requests per second |
|------|---|---|
| Free | 100 | 600/min |
| Pro | Unlimited | Varies |
| Enterprise | Custom | Custom |

### Handling Rate Limits

Implement exponential backoff:

```typescript
async function sendWithRetry(
  emailFn: () => Promise<EmailResponse>,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await emailFn();
    } catch (error) {
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

## Bounce Handling

### What are bounces?

Bounces occur when SendGrid can't deliver emails due to:
- **Hard Bounce**: Invalid email address (permanent)
- **Soft Bounce**: Mailbox full, server temporarily unavailable (temporary)

### Bounce Management

1. Monitor bounces in SendGrid dashboard
2. Mark invalid emails in your database
3. Remove from mailing lists automatically
4. Notify users to update email address

```typescript
// Example: Handle bounce in database
if (result.error?.includes('550')) {
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: false }
  });
}
```

## Security Considerations

### API Key Security

✅ **DO:**
- Store API key in `.env.local` (not committed to git)
- Use environment variables in production
- Rotate keys regularly
- Grant minimal permissions needed

❌ **DON'T:**
- Commit `.env.local` to git
- Share API key in logs
- Display key in browser console
- Use the same key across environments

### Email Content Security

✅ **DO:**
- Sanitize user input in email templates
- Include unsubscribe links
- Use secure links (https://)
- Add authentication to sensitive links

❌ **DON'T:**
- Send passwords in emails
- Include sensitive data in plaintext
- Use misleading sender names
- Send spam

### Rate Limiting on API

```typescript
// In route handler
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // Max 10 requests per minute
});

app.post('/api/email', limiter, async (req, res) => {
  // Handle email request
});
```

## Advanced Features

### HTML Email Tips

1. **Responsive Design**: Use inline CSS for compatibility
2. **Fallback Text**: Always include plain text version
3. **Image Handling**: Use absolute URLs, not relative
4. **Button Links**: Use `<a>` tags styled as buttons
5. **Test Tools**: Use [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/)

### Personalization

```typescript
// Dynamic personalization tokens
const template = (userName: string, customData: string) => `
  <p>Hello ${userName},</p>
  <p>Your custom data: ${customData}</p>
`;
```

### Unsubscribe Management

```typescript
// Add unsubscribe link
const unsubscribeLink = `https://app.example.com/unsubscribe?token=${token}`;
const template = `
  <footer>
    <a href="${unsubscribeLink}">Unsubscribe</a>
  </footer>
`;
```

### A/B Testing

```typescript
// Test different subjects
const subject = Math.random() > 0.5
  ? "Welcome to TrustX! 🎉"
  : "Join TrustX Today";

await sendEmail({
  to: email,
  subject,
  html: template
});
```

## Best Practices

### 1. Always await async operations
```typescript
// ✅ Good
const result = await sendWelcomeEmail(email, name);
if (result.success) { /* ... */ }

// ❌ Bad
sendWelcomeEmail(email, name); // Fire and forget, can't check success
```

### 2. Don't block responses on email
```typescript
// ✅ Good - Background task
sendWelcomeEmail(email, name).catch(err => logger.error(err));
return NextResponse.json({ success: true });

// ❌ Bad - Blocks response
const result = await sendWelcomeEmail(email, name);
return NextResponse.json({ success: result.success });
```

### 3. Log email activity
```typescript
// ✅ Always log
logger.info('Email sent', { to, subject, messageId });
logger.error('Email failed', { to, subject, error });
```

### 4. Validate email addresses
```typescript
// ✅ Validate before sending
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}
```

### 5. Handle errors gracefully
```typescript
// ✅ Catch and handle
try {
  const result = await sendEmail(payload);
  if (!result.success) {
    logger.warn(`Email failed: ${result.error}`);
    // Don't fail the entire request
  }
} catch (error) {
  logger.error(`Email error: ${error}`);
  // Handle gracefully
}
```

## Integration Examples

### Welcome Email on Signup

```typescript
// src/app/api/auth/signup/route.ts
import { sendWelcomeEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  // ... create user ...
  
  // Send welcome email asynchronously
  sendWelcomeEmail(email, name).catch(err =>
    logger.error('Welcome email failed', err)
  );
  
  return NextResponse.json({ success: true });
}
```

### Password Reset Email

```typescript
// src/app/api/auth/password-reset/route.ts
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  const { email } = await req.json();
  
  // Generate reset token
  const token = generateResetToken();
  
  // Store token in database
  await db.passwordReset.create({
    email,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  
  // Send email
  const resetLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reset/${token}`;
  await sendPasswordResetEmail(email, user.name, resetLink);
  
  return NextResponse.json({ success: true });
}
```

### Order Confirmation Email

```typescript
// src/app/api/orders/route.ts
import { sendOrderConfirmationEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  // ... create order ...
  
  // Send confirmation
  await sendOrderConfirmationEmail(
    user.email,
    user.name,
    order.id,
    `$${order.total.toFixed(2)}`
  );
  
  return NextResponse.json({ success: true, order });
}
```

## Troubleshooting Checklist

- [ ] SendGrid account created and API key generated
- [ ] Sender email verified in SendGrid
- [ ] `.env.local` contains `SENDGRID_API_KEY` and `SENDGRID_SENDER`
- [ ] Development server restarted after `.env` changes
- [ ] Dependencies installed (`npm install @sendgrid/mail`)
- [ ] Test email address verified (for sandbox mode)
- [ ] Email templates rendered correctly (check logs)
- [ ] Message IDs returned in responses
- [ ] Emails checked in recipient inbox
- [ ] Spam folder checked if not in inbox
- [ ] SendGrid dashboard shows delivery status

## Resources

- **SendGrid Official**: https://sendgrid.com/
- **SendGrid API Docs**: https://docs.sendgrid.com/for-developers/sending-email
- **Node.js SDK**: https://github.com/sendgrid/sendgrid-nodejs
- **Email Standards**: https://www.rfc-editor.org/rfc/rfc5321.html
- **Email Testing**: https://www.emailonacid.com/
- **SPF/DKIM/DMARC**: https://sendgrid.com/blog/spf-dkim-dmarc/

## Summary

The TrustX email service provides:
✅ Multiple email templates for different use cases
✅ Async/non-blocking email sending
✅ Comprehensive error handling and logging
✅ SendGrid integration for reliable delivery
✅ Easy API endpoint for testing and integration
✅ Rate limiting protection
✅ Security best practices

For questions or issues, check the SendGrid documentation or review the implementation in `src/lib/emailService.ts` and `src/lib/emailTemplates.ts`.
