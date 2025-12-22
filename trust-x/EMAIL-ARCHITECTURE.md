# Email Service Architecture & Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TrustX Application                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ src/app/api/auth/signup/route.ts                     │  │
│  │  - User registration                                  │  │
│  │  - Triggers: sendWelcomeEmail()                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ src/app/api/email/route.ts                           │  │
│  │  - POST: Send any email                              │  │
│  │  - GET: Health check                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Other Routes (orders, products, etc.)                │  │
│  │  - Can call email service functions                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ src/lib/emailService.ts                              │  │
│  │                                                        │  │
│  │ ├─ sendEmail()              (base function)          │  │
│  │ ├─ sendWelcomeEmail()                               │  │
│  │ ├─ sendPasswordResetEmail()                         │  │
│  │ ├─ sendOrderConfirmationEmail()                     │  │
│  │ ├─ sendSecurityAlertEmail()                         │  │
│  │ ├─ sendNotificationEmail()                          │  │
│  │ └─ sendBulkEmail()                                  │  │
│  │                                                        │  │
│  │ Features:                                             │  │
│  │ - Error handling with try-catch                      │  │
│  │ - Logging all events                                │  │
│  │ - Returns { success, messageId, error }            │  │
│  │ - Non-blocking async                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Template Layer                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ src/lib/emailTemplates.ts                            │  │
│  │                                                        │  │
│  │ ├─ welcomeTemplate(userName)                        │  │
│  │ ├─ passwordResetTemplate(userName, resetLink)       │  │
│  │ ├─ orderConfirmationTemplate(...)                   │  │
│  │ ├─ securityAlertTemplate(...)                       │  │
│  │ └─ notificationTemplate(title, message)             │  │
│  │                                                        │  │
│  │ Features:                                             │  │
│  │ - Responsive HTML design                             │  │
│  │ - Inline CSS styling                                │  │
│  │ - Personalization tokens                            │  │
│  │ - Professional branding                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            SendGrid SDK Integration                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ @sendgrid/mail npm package                           │  │
│  │                                                        │  │
│  │ ├─ sendgrid.setApiKey(SENDGRID_API_KEY)             │  │
│  │ └─ sendgrid.send(emailData)                         │  │
│  │                                                        │  │
│  │ Environment Variables:                                │  │
│  │ ├─ SENDGRID_API_KEY                                 │  │
│  │ └─ SENDGRID_SENDER                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          SendGrid Cloud Service                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ├─ Email Routing                                     │  │
│  │ ├─ Authentication (SPF, DKIM, DMARC)                 │  │
│  │ ├─ Delivery Tracking                                │  │
│  │ ├─ Bounce & Complaint Handling                       │  │
│  │ ├─ Rate Limiting                                     │  │
│  │ └─ Analytics Dashboard                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Email Service Providers                              │
│  ├─ Gmail                                                    │
│  ├─ Outlook                                                 │
│  ├─ Yahoo Mail                                              │
│  ├─ Corporate Mail Servers                                  │
│  └─ Other SMTP Providers                                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Inbox                                      │
│  📧 Welcome Email                                            │
│  📧 Password Reset Email                                    │
│  📧 Order Confirmation Email                                │
│  📧 Security Alert Email                                   │
│  📧 Notification Email                                     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow - Welcome Email on Signup

```
User Signup Request
        │
        ▼
POST /api/auth/signup
├─ Extract: name, email, password
├─ Hash password with bcrypt
├─ Save user to database (Prisma)
│
└─ Send welcome email (async, non-blocking)
    │
    ├─ sendWelcomeEmail(email, name)
    │   │
    │   ├─ welcomeTemplate(name)
    │   │   │
    │   │   └─ Return HTML template with:
    │   │       - User's name
    │   │       - Welcome message
    │   │       - Dashboard link
    │   │       - Footer
    │   │
    │   └─ sendEmail({to, subject, html})
    │       │
    │       ├─ Validate API key exists
    │       ├─ Validate sender email configured
    │       ├─ Call sendgrid.send()
    │       │
    │       ├─ Success ✅
    │       │   ├─ Extract messageId
    │       │   ├─ Log success
    │       │   └─ Return {success: true, messageId}
    │       │
    │       └─ Error ❌
    │           ├─ Log error details
    │           └─ Return {success: false, error}
    │
    └─ Return 200 OK to client (email send in background)

📧 SendGrid processes email and delivers to provider
📬 User receives welcome email in inbox
```

## State Management & Flow

```
STATE: Email Request
├─ Input Validation
│  ├─ Check recipient (to) exists
│  ├─ Check required fields for template type
│  └─ Validate email addresses
│
├─ Template Rendering
│  ├─ Load template function
│  ├─ Inject user data
│  └─ Render HTML
│
├─ SendGrid Transmission
│  ├─ API Authentication
│  ├─ Email Queuing
│  ├─ SMTP Delivery
│  └─ Recipient Server Response
│
├─ Monitoring
│  ├─ Message ID Tracking
│  ├─ Delivery Status
│  ├─ Opens & Clicks
│  ├─ Bounces & Complaints
│  └─ Dashboard Analytics
│
└─ Logging
   ├─ Success logs with messageId
   ├─ Error logs with details
   ├─ Performance metrics
   └─ Timestamp tracking
```

## Email Processing Timeline

```
Time    Event
────    ─────────────────────────────────────────────
T+0ms   User submits signup form
T+10ms  API validates input
T+20ms  Password hashed with bcrypt
T+30ms  User created in database
T+40ms  Email service called (async)
T+45ms  HTML template rendered
T+50ms  SendGrid API call initiated
T+100ms Email queued in SendGrid
T+150ms Return 200 OK to client
        (user sees success message immediately)

T+1s    SendGrid routes email
T+5s    Email reaches recipient's mail server
T+10s   User receives email in inbox
T+1min  Delivery confirmed in SendGrid dashboard
```

## Request/Response Flow

### Send Welcome Email via API

```
REQUEST:
POST /api/email
Content-Type: application/json

{
  "type": "welcome",
  "to": "user@example.com",
  "userName": "John Doe"
}

↓

PROCESSING:
1. Validate request
2. Load welcomeTemplate()
3. Call sendEmail()
4. Invoke sendgrid.send()
5. Handle response

↓

RESPONSE:
HTTP 200 OK
Content-Type: application/json

{
  "success": true,
  "messageId": "01010189b2example123",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "welcome"
}
```

### Error Response Example

```
REQUEST:
POST /api/email
Content-Type: application/json

{
  "type": "password-reset",
  "to": "user@example.com",
  "userName": "John Doe"
  // Missing: resetLink
}

↓

VALIDATION ERROR:
Validation failed - resetLink required

↓

RESPONSE:
HTTP 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "message": "userName and resetLink are required..."
}
```

## Async/Non-Blocking Pattern

```
Traditional (Blocking - BAD):
User submits form
  ├─ Save to database
  ├─ Send email (WAIT - 2-5 seconds)
  └─ Return response
Problem: User waits for email to send ❌

Non-Blocking (Good):
User submits form
  ├─ Save to database
  ├─ Fire email task (don't wait)
  ├─ Return response immediately ✅ (50ms)
  └─ Email sends in background (continues in parallel)

Code:
// Don't await, let it run in background
sendWelcomeEmail(email, name)
  .then(result => logger.info('Email sent'))
  .catch(error => logger.error('Email failed'));

// Return immediately
return NextResponse.json({ success: true });
```

## Integration Points

```
┌─────────────────────────────────────────────┐
│         Available Integration Points        │
├─────────────────────────────────────────────┤
│                                              │
│ 1. User Signup                               │
│    └─ ✅ Already integrated                  │
│       Send welcome email                    │
│                                              │
│ 2. Password Reset                           │
│    └─ 🔄 Ready to integrate                 │
│       Send reset link email                 │
│                                              │
│ 3. Order Creation                           │
│    └─ 🔄 Ready to integrate                 │
│       Send order confirmation email         │
│                                              │
│ 4. Security Events                          │
│    └─ 🔄 Ready to integrate                 │
│       Alert user on suspicious activity     │
│                                              │
│ 5. Admin Notifications                      │
│    └─ 🔄 Ready to integrate                 │
│       Notify admins of important events     │
│                                              │
│ 6. Bulk Newsletter                          │
│    └─ 🔄 Ready to integrate                 │
│       Send to multiple recipients           │
│                                              │
└─────────────────────────────────────────────┘
```

## Performance Characteristics

```
Typical Email Send Latency:
- HTML rendering:        ~5ms
- API validation:        ~5ms
- SendGrid call:         ~50-100ms
- Response return:       ~150ms total

Total user-facing latency: ~150ms (doesn't block response)
Actual email delivery:     1-30 seconds to inbox

Throughput:
- Single email:          1 request/any time
- Bulk emails:           Depends on SendGrid plan
- Rate limits:           Check SendGrid dashboard

Reliability:
- Retry logic:           Built into SendGrid SDK
- Error handling:        Graceful with logging
- Monitoring:            SendGrid dashboard
- Backup:                Logs stored in application
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│          Security Layers                    │
├─────────────────────────────────────────────┤
│                                              │
│ 1. Environment Variables                    │
│    ├─ SENDGRID_API_KEY (never in code)     │
│    └─ SENDGRID_SENDER (verified domain)    │
│                                              │
│ 2. API Validation                          │
│    ├─ Input validation                      │
│    ├─ Type checking                         │
│    └─ Field sanitization                    │
│                                              │
│ 3. Email Content Security                   │
│    ├─ No passwords in emails               │
│    ├─ Secure reset links                    │
│    └─ HTTPS links only                      │
│                                              │
│ 4. Sender Authentication                    │
│    ├─ Verified sender email                │
│    ├─ SPF records                           │
│    ├─ DKIM signing                          │
│    └─ DMARC policy                          │
│                                              │
│ 5. Rate Limiting                            │
│    ├─ API rate limits                       │
│    ├─ SendGrid plan limits                  │
│    └─ Per-user throttling                   │
│                                              │
│ 6. Logging & Monitoring                    │
│    ├─ All email events logged              │
│    ├─ Error tracking                        │
│    ├─ SendGrid analytics                    │
│    └─ Bounce handling                       │
│                                              │
└─────────────────────────────────────────────┘
```

## Template Rendering Example

```
INPUT:
userName = "John Doe"
appName = "TrustX"

welcomeTemplate(userName)
    │
    ├─ HTML structure with placeholders
    │  <h1>Welcome to ${appName}! 🎉</h1>
    │  <p>Hi ${userName},</p>
    │
    └─ Rendered output:
       <h1>Welcome to TrustX! 🎉</h1>
       <p>Hi John Doe,</p>

EMAIL CONTENT:
┌────────────────────────────┐
│  Welcome to TrustX! 🎉     │
├────────────────────────────┤
│ Hi John Doe,               │
│                             │
│ Thank you for joining...    │
│ [Go to Dashboard button]    │
│                             │
│ Best regards,              │
│ The TrustX Team            │
└────────────────────────────┘
```

---

This architecture provides:
✅ Scalability - Can handle thousands of emails
✅ Reliability - Multiple layers of error handling
✅ Security - API keys protected, content validated
✅ Monitoring - Full logging and analytics
✅ Maintainability - Clean separation of concerns
✅ Extensibility - Easy to add new email types
