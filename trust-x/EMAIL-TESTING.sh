#!/bin/bash

# ============================================================
# Email API Testing Guide
# ============================================================
#
# This file contains curl examples for testing the email API
# Run these commands to test different email types
#
# Start your dev server first:
#   npm run dev
#
# Then run these commands in your terminal (replace email addresses)
# ============================================================

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Email API Testing Guide${NC}\n"
echo "Make sure your dev server is running:"
echo -e "${YELLOW}npm run dev${NC}\n"

# ============================================================
# Test 1: Welcome Email
# ============================================================
echo -e "${GREEN}Test 1: Send Welcome Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "student@example.com",
    "userName": "John Doe"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example123",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "welcome"
}
EOF

# ============================================================
# Test 2: Password Reset Email
# ============================================================
echo -e "\n${GREEN}Test 2: Send Password Reset Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password-reset",
    "to": "student@example.com",
    "userName": "Jane Smith",
    "resetLink": "https://app.example.com/reset?token=abc123def456"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example124",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "password-reset"
}
EOF

# ============================================================
# Test 3: Order Confirmation Email
# ============================================================
echo -e "\n${GREEN}Test 3: Send Order Confirmation Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order-confirmation",
    "to": "student@example.com",
    "userName": "Mike Johnson",
    "orderId": "ORD-20251222-001",
    "amount": "$149.99"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example125",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "order-confirmation"
}
EOF

# ============================================================
# Test 4: Security Alert Email
# ============================================================
echo -e "\n${GREEN}Test 4: Send Security Alert Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "security-alert",
    "to": "student@example.com",
    "userName": "Sarah Williams",
    "alertType": "Unauthorized login attempt from IP 192.168.1.100"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example126",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "security-alert"
}
EOF

# ============================================================
# Test 5: Generic Notification Email
# ============================================================
echo -e "\n${GREEN}Test 5: Send Generic Notification Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notification",
    "to": "student@example.com",
    "userName": "Alex Brown",
    "title": "Account Activity Notification",
    "message": "Your account settings were updated. If this wasn'\''t you, please change your password immediately."
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example127",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "notification"
}
EOF

# ============================================================
# Test 6: Custom HTML Email
# ============================================================
echo -e "\n${GREEN}Test 6: Send Custom HTML Email${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "to": "student@example.com",
    "subject": "Welcome to TrustX Platform",
    "html": "<h2>Welcome to TrustX! 🚀</h2><p>We'\''re excited to have you here.</p><ul><li>Explore our features</li><li>Connect with others</li><li>Build amazing things</li></ul>"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example128",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "custom"
}
EOF

# ============================================================
# Test 7: Email with CC and BCC
# ============================================================
echo -e "\n${GREEN}Test 7: Send Email with CC and BCC${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "to": "student@example.com",
    "cc": "manager@example.com",
    "bcc": "archive@example.com",
    "subject": "Email with Recipients",
    "html": "<h2>This email has CC and BCC recipients</h2>"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example129",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "custom"
}
EOF

# ============================================================
# Test 8: Email to Multiple Recipients
# ============================================================
echo -e "\n${GREEN}Test 8: Send Email to Multiple Recipients${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "to": ["student1@example.com", "student2@example.com", "student3@example.com"],
    "subject": "Bulk Notification",
    "html": "<h2>This email was sent to multiple recipients</h2>"
  }'
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "success": true,
  "messageId": "01010189b2example130",
  "timestamp": "2025-12-22T10:30:00Z",
  "type": "custom"
}
EOF

# ============================================================
# Test 9: Error - Missing Required Field
# ============================================================
echo -e "\n${GREEN}Test 9: Error Handling - Missing Recipient${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "userName": "John Doe"
  }'
EOF

echo -e "\n${YELLOW}Expected Response (400 Error):${NC}"
cat << 'EOF'
{
  "success": false,
  "error": "Recipient email (to) is required",
  "timestamp": "2025-12-22T10:30:00Z"
}
EOF

# ============================================================
# Test 10: Error - Missing Template Fields
# ============================================================
echo -e "\n${GREEN}Test 10: Error Handling - Missing Template Fields${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X POST http://localhost:3000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password-reset",
    "to": "student@example.com",
    "userName": "John Doe"
  }'
EOF

echo -e "\n${YELLOW}Expected Response (400 Error):${NC}"
cat << 'EOF'
{
  "success": false,
  "error": "userName and resetLink are required for password reset emails",
  "timestamp": "2025-12-22T10:30:00Z"
}
EOF

# ============================================================
# Test 11: Health Check
# ============================================================
echo -e "\n${GREEN}Test 11: Health Check${NC}"
echo -e "${YELLOW}Command:${NC}"
cat << 'EOF'
curl -X GET http://localhost:3000/api/email
EOF

echo -e "\n${YELLOW}Expected Response:${NC}"
cat << 'EOF'
{
  "status": "ok",
  "service": "email",
  "timestamp": "2025-12-22T10:30:00Z"
}
EOF

# ============================================================
# Usage Instructions
# ============================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 How to Use This Guide${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

echo "1. Make sure your dev server is running:"
echo -e "   ${YELLOW}npm run dev${NC}\n"

echo "2. Copy any curl command above"
echo -e "   Example: ${YELLOW}curl -X POST http://localhost:3000/api/email ...${NC}\n"

echo "3. Open your terminal and paste the command"
echo -e "   (Replace 'student@example.com' with your actual email)\n"

echo "4. Check the response in the terminal"
echo "   If successful, you'll get a messageId\n"

echo "5. Check your email inbox"
echo "   The email should arrive within a few seconds\n"

echo "6. Monitor in SendGrid Dashboard"
echo -e "   ${YELLOW}https://app.sendgrid.com${NC}\n"

# ============================================================
# Postman Alternative
# ============================================================
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}📬 Using Postman Instead${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

echo "1. Open Postman"
echo "2. Create new POST request"
echo "3. URL: http://localhost:3000/api/email"
echo "4. Headers:"
echo -e "   ${YELLOW}Content-Type: application/json${NC}"
echo "5. Body (raw JSON):"
echo -e "   ${YELLOW}Paste any JSON body from examples above${NC}"
echo "6. Click 'Send'"
echo "7. View response in bottom panel\n"

# ============================================================
# Debugging
# ============================================================
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Debugging Tips${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

echo "✓ Check .env.local has SENDGRID_API_KEY"
echo "✓ Verify sender email in SendGrid dashboard"
echo "✓ Check application logs for error messages"
echo "✓ Verify recipient email is valid"
echo "✓ Check spam folder if email doesn't appear"
echo "✓ Run: npx tsx scripts/test-email.ts\n"

# ============================================================
# File ends
# ============================================================
echo -e "${GREEN}✅ Testing Guide Complete${NC}"
echo "For more info, see: EMAIL-SERVICE.md"
