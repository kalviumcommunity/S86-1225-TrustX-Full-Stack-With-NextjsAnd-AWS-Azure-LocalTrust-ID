# API & System Documentation Index

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  
**Base URL:** `http://localhost:3000/api`

---

## 📖 Quick Links

### Interactive Documentation
- **🎨 [Swagger UI](http://localhost:3000/api-docs.html)** - Interactive API documentation and testing
- **📄 [OpenAPI Spec (JSON)](http://localhost:3000/api/docs)** - Machine-readable API specification
- **📮 [Postman Collection](./postman_collection.json)** - Import into Postman for API testing

### System Documentation
- **🏗️ [Architecture Guide](./ARCHITECTURE.md)** - System architecture and component overview
- **📋 [Changelog](./CHANGELOG.md)** - Version history and release notes
- **📚 [Main README](./README.md)** - Project overview and setup guide

---

## 🚀 Getting Started

### 1. Access API Documentation

**Development:**
```bash
npm run dev
# Visit: http://localhost:3000/api-docs.html
```

**View API Spec:**
```bash
npm run api:spec
```

### 2. Authentication

Most API endpoints require authentication. Include a JWT token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Get a token:**
```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Test an Endpoint

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health

# Get users (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users
```

---

## 📚 Available Documentation

### API Documentation

| Resource | Description | Link |
|----------|-------------|------|
| **Swagger UI** | Interactive API explorer with live testing | [View](http://localhost:3000/api-docs.html) |
| **OpenAPI Spec** | JSON specification for API integration | [Download](http://localhost:3000/api/docs) |
| **Postman Collection** | Import into Postman for quick testing | [File](./postman_collection.json) |
| **API Testing Script** | Shell script with example API calls | [File](./API-TESTING.sh) |

### System Documentation

| Document | Description | Link |
|----------|-------------|------|
| **Architecture Overview** | Complete system architecture and design | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Changelog** | Version history and release notes | [CHANGELOG.md](./CHANGELOG.md) |
| **Email Service** | SendGrid integration guide | [EMAIL-QUICKSTART.md](./EMAIL-QUICKSTART.md) |
| **Database Guide** | PostgreSQL and Prisma setup | [CLOUD-DATABASE-QUICKREF.md](./CLOUD-DATABASE-QUICKREF.md) |
| **Security Guide** | Input sanitization and security | [INPUT-SANITIZATION-SUMMARY.md](./INPUT-SANITIZATION-SUMMARY.md) |
| **Testing Guide** | Unit and integration testing | [INTEGRATION-TESTING-QUICKSTART.md](./INTEGRATION-TESTING-QUICKSTART.md) |
| **Deployment Guide** | Docker and cloud deployment | [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md) |
| **Monitoring Guide** | Logging and monitoring setup | [LOGGING-QUICKSTART.md](./LOGGING-QUICKSTART.md) |

---

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - List all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### File Upload
- `POST /api/upload` - Generate presigned URL for upload
- `POST /api/upload/complete` - Mark upload as complete
- `GET /api/files` - List all files
- `GET /api/upload/health` - Check storage health

### Health Checks
- `GET /api/health` - System health status
- `GET /api/health/db` - Database health
- `GET /api/health/secrets` - Secrets manager health

### Admin (Requires ADMIN role)
- `GET /api/admin` - Admin dashboard
- `GET /api/admin/users` - Get all users with full details

### Email
- `POST /api/email` - Send email via SendGrid

---

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "details": {
    // Additional error details (optional)
  },
  "timestamp": "2026-01-09T12:00:00.000Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 🔒 Authentication & Authorization

### JWT Authentication

**Get Token:**
1. Sign up: `POST /api/auth/signup`
2. Or login: `POST /api/auth/login`
3. Receive JWT token in response
4. Include token in subsequent requests

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access Control (RBAC)

| Role | Permissions | Description |
|------|-------------|-------------|
| **USER** | Read own data, create/update own resources | Standard user |
| **ADMIN** | Full system access | Administrator |
| **MODERATOR** | Read all, moderate content | Content moderator |

### Permission System

Resources are protected by permissions:
- **read** - View resource
- **create** - Create new resource
- **update** - Modify existing resource
- **delete** - Remove resource

---

## 🧪 Testing the API

### Using Swagger UI

1. Open [http://localhost:3000/api-docs.html](http://localhost:3000/api-docs.html)
2. Click "Authorize" button
3. Enter your JWT token: `Bearer YOUR_TOKEN`
4. Try any endpoint by clicking "Try it out"
5. View request/response examples

### Using Postman

1. Import `postman_collection.json` into Postman
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `jwt_token`: Your JWT token
3. Run individual requests or entire collection

### Using cURL

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Get Users (with auth):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/users?page=1&limit=10"
```

**Create Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Project",
    "description": "Project description"
  }'
```

---

## 🔄 API Versioning

**Current Version:** `v1.0.0`

### Version Header
```
X-API-Version: 1.0.0
```

### Breaking Changes Policy
- Major version bump (2.0.0) for breaking changes
- Minor version bump (1.1.0) for new features
- Patch version bump (1.0.1) for bug fixes

### Deprecation Notice
Deprecated endpoints will:
1. Continue to work for at least 6 months
2. Return `X-API-Deprecated: true` header
3. Include alternative endpoint in response

---

## 📈 Rate Limits

| User Type | Requests/Hour | Burst Limit |
|-----------|---------------|-------------|
| Anonymous | 100 | 10/min |
| Authenticated | 1,000 | 50/min |
| Admin | Unlimited | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000
```

---

## 🐛 Error Codes

Common error codes you may encounter:

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `USER_EXISTS` | 409 | User already exists |
| `SERVER_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database connection issue |
| `STORAGE_ERROR` | 500 | File storage issue |

---

## 📞 Support & Resources

### Documentation Help
- **Swagger UI Issues**: Check browser console for errors
- **API Questions**: Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Authentication Issues**: Review [API-TESTING.sh](./API-TESTING.sh)

### Additional Resources
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Postman Documentation](https://learning.postman.com/)

### Health Checks
Monitor system health:
```bash
npm run db:health          # Database health
npm run storage:health     # Storage health
npm run secrets:health     # Secrets manager health
```

---

## 🔄 Keeping Documentation Updated

### For Developers

When adding new endpoints:
1. Add JSDoc/Swagger comments to the route file
2. Update this index if adding new sections
3. Update [CHANGELOG.md](./CHANGELOG.md)
4. Regenerate API docs: `npm run build`
5. Test in Swagger UI

### Documentation Maintenance Schedule
- **Daily**: Auto-generated from code comments
- **Weekly**: Review API accuracy
- **Monthly**: Update architecture diagrams
- **Per Release**: Version number sync

---

## 📝 Documentation Reflection

### Why Good Documentation Matters

1. **Onboarding**: New developers can start contributing faster
2. **Integration**: External teams can integrate APIs confidently
3. **Maintenance**: Future maintainers understand system design
4. **Debugging**: Clear docs help identify issues quickly

### Our Documentation Strategy

- **Living Documentation**: Auto-generated from code where possible
- **Multiple Formats**: Swagger UI, Postman, Markdown for different use cases
- **Version Control**: All docs in Git with the code
- **Testing**: Documentation examples are tested as part of CI/CD
- **Accessibility**: Available locally and in production

### Continuous Improvement

We continuously improve our documentation by:
- Adding examples from real use cases
- Incorporating feedback from users
- Keeping examples up-to-date with code changes
- Monitoring which docs are accessed most
- Automating documentation generation

---

**Document Maintained By**: LocalTrust-ID Development Team  
**Questions?** Open an issue or check existing documentation files  
**Last Review**: January 9, 2026
