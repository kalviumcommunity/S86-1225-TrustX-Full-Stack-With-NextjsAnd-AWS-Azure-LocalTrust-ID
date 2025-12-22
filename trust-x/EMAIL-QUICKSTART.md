# Email Service Quick Start

## 1. Configure Environment

Add to `.env.local`:
```env
SENDGRID_API_KEY=your-api-key-from-sendgrid
SENDGRID_SENDER=noreply@yourdomain.com
```

Get your API key from: https://app.sendgrid.com/settings/api_keys

## 2. Files Created

```
src/lib/
  ├── emailService.ts         # Main email service functions
  └── emailTemplates.ts       # HTML email templates

src/app/api/email/
  └── route.ts                # Email API endpoint

scripts/
  └── test-email.ts           # Test script

.env.example                  # Updated with email config
```

## 3. Send Emails

### Via TypeScript/Code
```typescript
import { sendWelcomeEmail } from '@/lib/emailService';

// Send welcome email
const result = await sendWelcomeEmail('user@example.com', 'John Doe');
console.log(result.messageId); // Track message
```

### Via API
```bash
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "user@example.com",
    "userName": "John Doe"
  }'
```

## 4. Available Email Types

| Type | Function | Required Fields |
|------|----------|---|
| `welcome` | New user signup | `to`, `userName` |
| `password-reset` | Password recovery | `to`, `userName`, `resetLink` |
| `order-confirmation` | Purchase confirmation | `to`, `userName`, `orderId`, `amount` |
| `security-alert` | Security notification | `to`, `userName`, `alertType` |
| `notification` | Generic notification | `to`, `userName`, `title`, `message` |
| `custom` | Custom HTML email | `to`, `subject`, `html` |

## 5. Test Email Service

```bash
# Set test email and run tests
TEST_EMAIL=your-email@example.com npx tsx scripts/test-email.ts
```

## 6. Key Features

✅ **Automatic signup emails** - Welcome email sent on user registration
✅ **Multiple templates** - Pre-built HTML templates for common scenarios
✅ **Async sending** - Non-blocking email sending (doesn't slow down your API)
✅ **Error handling** - Comprehensive logging and error tracking
✅ **Flexible API** - Use via code or HTTP endpoint
✅ **Rate limiting ready** - Built for high volume
✅ **Security** - API key in env vars, no sensitive data in emails

## 7. Monitoring

### View logs in your app:
```
INFO: Email sent successfully
  - to: user@example.com
  - messageId: abc123xyz
```

### View in SendGrid Dashboard:
1. Go to https://app.sendgrid.com
2. Click "Mail Send"
3. See delivery status

## 8. Common Tasks

### Send email on user signup
Already integrated! Check `src/app/api/auth/signup/route.ts`

### Send password reset email
```typescript
import { sendPasswordResetEmail } from '@/lib/emailService';

const resetLink = `https://app.com/reset?token=${token}`;
await sendPasswordResetEmail(email, name, resetLink);
```

### Send to multiple recipients
```typescript
import { sendBulkEmail } from '@/lib/emailService';

const recipients = ['user1@example.com', 'user2@example.com'];
await sendBulkEmail(recipients, 'Subject', '<h1>HTML content</h1>');
```

### Create custom template
Edit `src/lib/emailTemplates.ts` and add new function:
```typescript
export const myTemplate = (name: string) => `
  <h2>Hello ${name}</h2>
  <p>Custom content here</p>
`;
```

## 9. Troubleshooting

**Email not sending?**
- Check `.env.local` has API key
- Verify sender email in SendGrid dashboard
- Check logs for error message
- Run test script: `npx tsx scripts/test-email.ts`

**Email going to spam?**
- Verify sender domain (not just email)
- Check SPF/DKIM records
- View SendGrid spam reports

**Rate limit errors?**
- Check SendGrid plan limits
- Implement retry logic
- Use background jobs for bulk sends

## 10. Documentation

Full documentation: [EMAIL-SERVICE.md](./EMAIL-SERVICE.md)

## Next Steps

1. ✅ Get SendGrid API key
2. ✅ Configure `.env.local`
3. ✅ Test with `npx tsx scripts/test-email.ts`
4. ✅ Check emails in your inbox
5. ✅ Monitor in SendGrid dashboard
6. ✅ Integrate into your features

---

**Pro Tip**: "Emails are the heartbeat of trust in digital systems — automate them carefully, monitor them consistently, and secure them relentlessly."
