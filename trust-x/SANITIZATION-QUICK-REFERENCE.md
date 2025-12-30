# Input Sanitization Quick Reference

## 🎯 When to Use Each Sanitization Function

| Data Type | Function | Example | Allowed HTML |
|-----------|----------|---------|--------------|
| User name | `sanitizeStrict()` | `sanitizeStrict('<script>John</script>')` → `'John'` | ❌ None |
| Email | `sanitizeEmail()` | `sanitizeEmail('  USER@EXAMPLE.COM  ')` → `'user@example.com'` | ❌ None |
| Search query | `sanitizeStrict()` | `sanitizeStrict('query<script>')` → `'query'` | ❌ None |
| Phone number | `sanitizeStrict()` | `sanitizeStrict('+1<b>555</b>')` → `'+1555'` | ❌ None |
| Comment | `sanitizeBasic()` | `sanitizeBasic('<p>Hello</p><script>')` → `'<p>Hello</p>'` | ✅ Minimal |
| Blog post | `sanitizeRichText()` | `sanitizeRichText('<h1>Title</h1><script>')` → `'<h1>Title</h1>'` | ✅ Rich |
| URL/Link | `sanitizeUrl()` | `sanitizeUrl('javascript:alert()')` → `''` | ❌ None |
| Filename | `sanitizeFilename()` | `sanitizeFilename('../../passwd')` → `'passwd'` | ❌ None |
| Number | `sanitizeNumber()` | `sanitizeNumber('42.5px')` → `42.5` | ❌ None |
| Boolean | `sanitizeBoolean()` | `sanitizeBoolean('yes')` → `true` | ❌ None |

---

## 📋 Cheat Sheet for Common Scenarios

### Scenario 1: User Registration

```typescript
import { userRegistrationSchema } from '@/lib/validation';
import { sanitizeStrict, sanitizeEmail } from '@/lib/sanitize';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate with Zod (includes built-in sanitization)
  const result = userRegistrationSchema.safeParse(body);
  if (!result.success) {
    return sendError('Invalid input', ERROR_CODES.VALIDATION_ERROR, 400);
  }
  
  // Additional sanitization (defense in depth)
  const cleanData = {
    name: sanitizeStrict(result.data.name),
    email: sanitizeEmail(result.data.email),
    password: result.data.password, // Already validated by Zod
  };
  
  // Save to database
  const user = await prisma.user.create({ data: cleanData });
  return sendSuccess(user, 'User created');
}
```

### Scenario 2: Comment Submission

```typescript
import { commentSchema } from '@/lib/validation';
import { sanitizeBasic, logSanitization } from '@/lib/sanitize';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate
  const result = commentSchema.safeParse(body);
  if (!result.success) {
    return sendError('Invalid comment', ERROR_CODES.VALIDATION_ERROR, 400);
  }
  
  // Sanitize (allow safe HTML like <p>, <strong>)
  const sanitized = sanitizeBasic(result.data.content);
  
  // Log for audit trail
  logSanitization('comment.content', body.content, sanitized);
  
  // Save
  const comment = await prisma.comment.create({
    data: {
      content: sanitized,
      authorName: result.data.authorName,
    },
  });
  
  return sendSuccess(comment, 'Comment created');
}
```

### Scenario 3: Search Query

```typescript
import { searchSchema } from '@/lib/validation';
import { sanitizeStrict } from '@/lib/sanitize';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  // Validate
  const result = searchSchema.safeParse({ query });
  if (!result.success) {
    return sendError('Invalid search', ERROR_CODES.VALIDATION_ERROR, 400);
  }
  
  // Sanitize (remove all HTML)
  const cleanQuery = sanitizeStrict(result.data.query);
  
  // Search (Prisma automatically parameterizes)
  const results = await prisma.product.findMany({
    where: {
      name: { contains: cleanQuery, mode: 'insensitive' },
    },
  });
  
  return sendSuccess(results, 'Search results');
}
```

### Scenario 4: File Upload

```typescript
import { fileUploadSchema } from '@/lib/validation';
import { sanitizeFilename } from '@/lib/sanitize';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Validate
  const result = fileUploadSchema.safeParse({
    filename: file.name,
    size: file.size,
    type: file.type,
  });
  
  if (!result.success) {
    return sendError('Invalid file', ERROR_CODES.VALIDATION_ERROR, 400);
  }
  
  // Sanitize filename (prevent path traversal)
  const safeFilename = sanitizeFilename(file.name);
  
  // Save file
  const filepath = path.join(uploadDir, safeFilename);
  await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()));
  
  return sendSuccess({ filename: safeFilename }, 'File uploaded');
}
```

### Scenario 5: Displaying User Content

```typescript
'use client';

import { sanitizeHtmlClient } from '@/lib/sanitizeClient';

export default function CommentDisplay({ comment }: { comment: Comment }) {
  // Sanitize on client before rendering
  const safeContent = sanitizeHtmlClient(comment.content);
  
  return (
    <div>
      <h3>{comment.authorName}</h3>
      {/* Use dangerouslySetInnerHTML ONLY with sanitized content */}
      <div dangerouslySetInnerHTML={{ __html: safeContent }} />
    </div>
  );
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: No Sanitization

```typescript
// BAD: Directly using user input
const user = await prisma.user.create({
  data: { name: body.name } // What if body.name has <script> tags?
});
```

### ✅ Fix: Always Sanitize

```typescript
// GOOD: Sanitize before saving
const user = await prisma.user.create({
  data: { name: sanitizeStrict(body.name) }
});
```

---

### ❌ Mistake 2: String Concatenation in SQL

```typescript
// BAD: SQL injection vulnerability
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### ✅ Fix: Use Parameterized Queries

```typescript
// GOOD: Prisma automatically parameterizes
const user = await prisma.user.findUnique({
  where: { email } // Safe from SQL injection
});
```

---

### ❌ Mistake 3: Sanitizing Only on Client

```typescript
// BAD: Client can bypass this
// client.tsx
const safe = sanitizeHtmlClient(input);
await fetch('/api/comments', { body: { content: safe } });

// server.ts (no sanitization)
const comment = await prisma.comment.create({ data: body });
```

### ✅ Fix: Always Sanitize on Server

```typescript
// GOOD: Server-side sanitization (can't be bypassed)
// client.tsx
await fetch('/api/comments', { body: { content: input } });

// server.ts
const sanitized = sanitizeBasic(body.content); // Mandatory
const comment = await prisma.comment.create({ data: { content: sanitized } });
```

---

### ❌ Mistake 4: Using dangerouslySetInnerHTML Without Sanitization

```typescript
// BAD: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: comment.content }} />
```

### ✅ Fix: Sanitize Before Rendering

```typescript
// GOOD: Sanitize first
<div dangerouslySetInnerHTML={{ __html: sanitizeHtmlClient(comment.content) }} />
```

---

### ❌ Mistake 5: Blacklisting Instead of Allowlisting

```typescript
// BAD: Trying to block patterns (can be bypassed)
if (input.includes('<script>') || input.includes('onerror')) {
  return '';
}
```

### ✅ Fix: Use Allowlist-Based Sanitization

```typescript
// GOOD: Only allow safe tags
sanitizeBasic(input); // Allows <p>, <strong>, etc., blocks everything else
```

---

## 🔒 Security Checklist for Code Reviews

Use this checklist when reviewing code:

### Input Validation
- [ ] All user inputs are validated with Zod schemas
- [ ] Validation happens on server-side (can't be bypassed)
- [ ] Error messages don't leak sensitive information
- [ ] Default values are set for optional fields

### Input Sanitization
- [ ] Appropriate sanitization function used for data type
- [ ] Sanitization happens before database operations
- [ ] Filenames are sanitized to prevent path traversal
- [ ] URLs are validated for allowed protocols

### Output Encoding
- [ ] HTML is escaped before rendering (React JSX or sanitizeHtmlClient)
- [ ] dangerouslySetInnerHTML is only used with sanitized content
- [ ] JSON responses are properly encoded
- [ ] Error messages are sanitized before logging

### Database Queries
- [ ] Prisma ORM is used (automatic parameterization)
- [ ] No raw SQL with string concatenation
- [ ] User input is sanitized before queries
- [ ] Indexes exist for frequently queried fields

### Authentication & Authorization
- [ ] JWT tokens are verified on protected routes
- [ ] RBAC checks are performed server-side
- [ ] Permissions are checked before database operations
- [ ] Refresh tokens are stored securely

### Security Headers
- [ ] Content-Security-Policy is configured
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Security headers are applied to all responses

### Rate Limiting
- [ ] Rate limiting is enabled on authentication endpoints
- [ ] Rate limiting is enabled on search/query endpoints
- [ ] Limits are appropriate for expected traffic
- [ ] Rate limit violations are logged

### Audit Logging
- [ ] Sanitization events are logged
- [ ] RBAC decisions are logged
- [ ] Failed authentication attempts are logged
- [ ] Suspicious patterns are monitored

---

## 📊 Allowed HTML Tags by Sanitization Level

### sanitizeStrict() - No HTML
- **Allowed Tags**: None
- **Use Cases**: Names, emails, search queries, plain text

### sanitizeBasic() - Minimal HTML
- **Allowed Tags**: 
  - Text formatting: `<p>`, `<br>`, `<strong>`, `<em>`, `<code>`
  - Links: `<a>` (with href validation)
  - Lists: `<ul>`, `<ol>`, `<li>`
  - Quotes: `<blockquote>`
- **Use Cases**: Comments, descriptions, user-generated content

### sanitizeRichText() - Rich HTML
- **Allowed Tags**: 
  - All basic tags plus:
  - Headers: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`
  - Images: `<img>` (with src validation)
  - Tables: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
  - Layout: `<div>`, `<span>`, `<pre>`, `<hr>`
- **Use Cases**: Blog posts, articles, rich text editors

---

## 🎯 Testing Your Sanitization

### Quick Test Template

```typescript
import { sanitizeStrict, sanitizeBasic, sanitizeRichText } from '@/lib/sanitize';

// Test 1: XSS Script Tag
const xss1 = '<script>alert("XSS")</script>Hello';
console.assert(sanitizeStrict(xss1) === 'Hello', 'Script tag should be removed');

// Test 2: XSS Image Tag
const xss2 = '<img src=x onerror="alert(\'XSS\')">';
console.assert(sanitizeBasic(xss2) === '', 'Malicious img should be removed');

// Test 3: Safe HTML
const safe = '<p>Hello <strong>World</strong></p>';
console.assert(sanitizeBasic(safe) === safe, 'Safe HTML should be preserved');

// Test 4: SQL Injection (Prisma handles this)
const sql = "' OR '1'='1";
const user = await prisma.user.findUnique({ where: { email: sql } });
console.assert(user === null, 'SQL injection should not work');

console.log('✅ All sanitization tests passed!');
```

---

## 📞 Need Help?

- **Test Page**: [http://localhost:3000/test-sanitization](http://localhost:3000/test-sanitization)
- **Full Documentation**: See README.md "Input Sanitization & OWASP Compliance" section
- **Implementation Guide**: See INPUT-SANITIZATION-SUMMARY.md
- **OWASP Resources**: [https://owasp.org/Top10/](https://owasp.org/Top10/)

---

**Remember**: When in doubt, sanitize! It's better to be overly cautious than to leave a security vulnerability.
