# 📚 API Documentation - Quick Reference Card

**Version:** 1.0.0 | **Updated:** January 9, 2026

---

## 🚀 Quick Access

| Resource | URL | Description |
|----------|-----|-------------|
| **Swagger UI** | http://localhost:3000/api-docs.html | Interactive API docs |
| **OpenAPI Spec** | http://localhost:3000/api/docs | JSON specification |
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| **Changelog** | [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## 📋 Quick Commands

```bash
# Start server
npm run dev

# View API docs
npm run api:docs

# Get OpenAPI spec
npm run api:spec

# Verify documentation
.\verify-docs.ps1        # Windows
./verify-docs.sh         # Linux/Mac

# Health checks
npm run db:health
npm run storage:health
```

---

## 🔑 Authentication

```bash
# Get JWT token (signup)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass123!"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users
```

---

## 🔌 Core Endpoints

### Health
```bash
GET /api/health           # System health
GET /api/health/db        # Database health
GET /api/upload/health    # Storage health
```

### Users
```bash
GET    /api/users         # List users
GET    /api/users/:id     # Get user
POST   /api/users         # Create user
PUT    /api/users/:id     # Update user
DELETE /api/users/:id     # Delete user
```

### Projects
```bash
GET    /api/projects      # List projects
POST   /api/projects      # Create project
GET    /api/projects/:id  # Get project
PUT    /api/projects/:id  # Update project
DELETE /api/projects/:id  # Delete project
```

### File Upload
```bash
POST /api/upload          # Get presigned URL
POST /api/upload/complete # Complete upload
GET  /api/files           # List files
```

---

## 📝 Response Format

### Success
```json
{
  "success": true,
  "data": { /* ... */ },
  "pagination": { "page": 1, "total": 100 }
}
```

### Error
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error description",
  "statusCode": 400
}
```

---

## 🎨 Testing Methods

### 1. Swagger UI (Easiest)
1. Open http://localhost:3000/api-docs.html
2. Click "Authorize" → Add token
3. Try endpoints with "Try it out"

### 2. Postman
1. Import `postman_collection.json`
2. Set `jwt_token` variable
3. Run requests

### 3. cURL
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `search` | string | "" | Search term |
| `status` | string | - | Filter by status |

---

## ⚠️ Common Errors

| Code | Status | Fix |
|------|--------|-----|
| `UNAUTHORIZED` | 401 | Add valid JWT token |
| `FORBIDDEN` | 403 | Check user permissions |
| `VALIDATION_ERROR` | 400 | Check request body format |
| `NOT_FOUND` | 404 | Verify resource ID |

---

## 📦 Postman Collection

**Import:** `postman_collection.json`

**Variables:**
- `base_url`: http://localhost:3000
- `jwt_token`: Your JWT token
- `user_id`: User ID for testing
- `project_id`: Project ID for testing

---

## 🎯 Rate Limits

| User Type | Limit | Burst |
|-----------|-------|-------|
| Anonymous | 100/hour | 10/min |
| Authenticated | 1000/hour | 50/min |
| Admin | Unlimited | Unlimited |

---

## 📚 Documentation Files

- `ARCHITECTURE.md` - System architecture
- `CHANGELOG.md` - Version history
- `API-DOCUMENTATION-INDEX.md` - Complete API guide
- `API-DOCUMENTATION-IMPLEMENTATION-SUMMARY.md` - Implementation details
- `postman_collection.json` - Postman requests
- `verify-docs.ps1` / `verify-docs.sh` - Verification scripts

---

## 🔍 Troubleshooting

### Server not responding
```bash
npm run dev
# Wait 10 seconds, then try again
```

### Swagger UI not loading
```bash
# Check file exists
ls public/api-docs.html

# Check server logs for errors
```

### Authentication failing
```bash
# Verify token format
Authorization: Bearer <token>  # ✅ Correct
Bearer: <token>                # ❌ Wrong
```

### Database errors
```bash
npm run db:health
npm run db:migrate
```

---

## 💡 Tips

1. **Always start with `/api/health`** to verify server is running
2. **Use Swagger UI** for quick testing and exploration
3. **Check ARCHITECTURE.md** for system understanding
4. **Review CHANGELOG.md** for recent changes
5. **Run verify-docs** to diagnose issues

---

## 🆘 Need Help?

1. Run: `.\verify-docs.ps1`
2. Check: [API-DOCUMENTATION-INDEX.md](./API-DOCUMENTATION-INDEX.md)
3. Review: [ARCHITECTURE.md](./ARCHITECTURE.md)
4. Test: http://localhost:3000/api-docs.html

---

**Print this card** | **Bookmark** | **Share with team**

*LocalTrust-ID © 2026*
