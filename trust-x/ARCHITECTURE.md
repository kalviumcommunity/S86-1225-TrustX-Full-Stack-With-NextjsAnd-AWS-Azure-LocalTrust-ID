# LocalTrust-ID System Architecture

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  
**Status:** Production Ready

## Table of Contents
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Diagram](#architecture-diagram)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Deployment Architecture](#deployment-architecture)
- [Security Architecture](#security-architecture)
- [API Documentation](#api-documentation)
- [Development Setup](#development-setup)

---

## System Overview

LocalTrust-ID is a full-stack decentralized identity verification and trust management system built with Next.js, designed for high security, scalability, and reliability. The platform provides secure user authentication, role-based access control (RBAC), file management, and comprehensive monitoring capabilities.

### Key Features
- **Identity Verification**: Secure user registration and verification workflows
- **Role-Based Access Control (RBAC)**: Fine-grained permission management
- **File Storage**: AWS S3 and Azure Blob Storage integration
- **Caching**: Redis-based caching for improved performance
- **Email Services**: Automated email notifications via SendGrid
- **Monitoring & Logging**: Comprehensive logging and performance monitoring
- **Secret Management**: AWS Secrets Manager and Azure Key Vault integration
- **Input Sanitization**: XSS and injection attack prevention
- **API Documentation**: Interactive Swagger/OpenAPI documentation

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 (React 19.2.1)
- **Styling**: Tailwind CSS with PostCSS
- **Form Management**: React Hook Form with Zod validation
- **State Management**: SWR for data fetching
- **UI Components**: Custom component library with Storybook

### Backend
- **Runtime**: Node.js with TypeScript
- **API**: Next.js API Routes (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Authentication**: JWT with bcrypt password hashing

### Cloud Services
- **AWS**: S3 (file storage), ECS (container orchestration), Secrets Manager
- **Azure**: Blob Storage, Key Vault, App Service
- **Email**: SendGrid

### DevOps & Testing
- **Testing**: Jest, Testing Library, Supertest, MSW
- **CI/CD**: GitHub Actions
- **Containerization**: Docker with multi-stage builds
- **Code Quality**: ESLint, Prettier, Husky, Lint-staged

### Security
- **Input Validation**: Zod schemas
- **Sanitization**: DOMPurify, sanitize-html, XSS, validator
- **HTTPS**: SSL/TLS encryption
- **Headers**: Security headers middleware

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │    Mobile    │  │  Third-Party │         │
│  │     App      │  │     App      │  │     Apps     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────┬──────────────┬───────────────────┘
             │                │              │
             └────────────────┼──────────────┘
                              │
                      HTTPS / TLS
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    APPLICATION LAYER                            │
│                              │                                  │
│  ┌──────────────────────────▼────────────────────────────────┐ │
│  │              Next.js Application (App Router)             │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │ │
│  │  │  API       │  │  Server    │  │  Static    │          │ │
│  │  │  Routes    │  │  Components│  │  Assets    │          │ │
│  │  └────────────┘  └────────────┘  └────────────┘          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌──────────────────────────┼────────────────────────────────┐ │
│  │           MIDDLEWARE LAYER                                │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │ │
│  │  │ Auth │ │ RBAC │ │ CORS │ │ Rate │ │Logger│           │ │
│  │  │      │ │      │ │      │ │Limit │ │      │           │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌────────▼────────┐
│  DATA LAYER    │  │   CACHE LAYER    │  │  STORAGE LAYER  │
│                │  │                  │  │                 │
│ ┌────────────┐ │  │ ┌──────────────┐ │  │ ┌─────────────┐ │
│ │ PostgreSQL │ │  │ │    Redis     │ │  │ │   AWS S3    │ │
│ │  (Prisma)  │ │  │ │   (ioredis)  │ │  │ │   Azure     │ │
│ └────────────┘ │  │ └──────────────┘ │  │ │    Blob     │ │
│                │  │                  │  │ └─────────────┘ │
└────────────────┘  └──────────────────┘  └─────────────────┘
        │                     │                     │
┌───────▼─────────────────────▼─────────────────────▼──────────┐
│                    EXTERNAL SERVICES                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ SendGrid │  │   AWS    │  │  Azure   │  │  Logging │    │
│  │  Email   │  │ Secrets  │  │   Key    │  │ Services │    │
│  │          │  │ Manager  │  │  Vault   │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
trust-x/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   │   └── signup/
│   │   │   ├── users/              # User CRUD operations
│   │   │   ├── projects/           # Project management
│   │   │   ├── comments/           # Comments system
│   │   │   ├── orders/             # Order management
│   │   │   ├── upload/             # File upload endpoints
│   │   │   ├── email/              # Email service endpoints
│   │   │   ├── health/             # Health check endpoints
│   │   │   ├── admin/              # Admin-only endpoints
│   │   │   └── docs/               # API documentation
│   │   ├── (routes)/               # Page routes
│   │   └── layout.tsx              # Root layout
│   ├── components/                 # React components
│   │   ├── ui/                     # UI components
│   │   ├── forms/                  # Form components
│   │   └── layout/                 # Layout components
│   ├── lib/                        # Core utilities
│   │   ├── prisma.ts               # Database client
│   │   ├── cache.ts                # Redis cache service
│   │   ├── logger.ts               # Logging system
│   │   ├── rbac.ts                 # RBAC implementation
│   │   ├── sanitize.ts             # Input sanitization
│   │   ├── validation.ts           # Zod schemas
│   │   ├── emailService.ts         # Email integration
│   │   ├── responseHandler.ts      # API response utilities
│   │   ├── swagger.ts              # Swagger configuration
│   │   └── storage/                # Cloud storage clients
│   │       ├── s3.ts
│   │       └── azure.ts
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Helper functions
├── prisma/                         # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                         # Static assets
│   └── api-docs.html               # Swagger UI page
├── __tests__/                      # Unit tests
├── __smoke_tests__/                # Smoke tests
├── scripts/                        # Utility scripts
├── .github/                        # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml              # Local development setup
├── Dockerfile                      # Production container
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── jest.config.js                  # Jest test configuration
├── .env.example                    # Environment variables template
└── package.json                    # Dependencies & scripts
```

---

## Core Components

### 1. Authentication & Authorization

**Location**: `src/lib/auth.ts`, `src/lib/rbac.ts`

- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based resource access
- Secure password hashing with bcrypt

**Roles**:
- `USER`: Standard user with basic permissions
- `ADMIN`: Full system access
- `MODERATOR`: Content management permissions

### 2. Database Layer

**Location**: `src/lib/prisma.ts`, `prisma/schema.prisma`

- PostgreSQL database
- Prisma ORM for type-safe queries
- Connection pooling
- Automated migrations

**Main Models**:
- User
- Project
- Comment
- Order
- File

### 3. Caching System

**Location**: `src/lib/cache.ts`

- Redis-based caching
- Automatic cache invalidation
- Configurable TTL
- Cache warming strategies

### 4. File Storage

**Location**: `src/lib/storage/`

- AWS S3 integration
- Azure Blob Storage support
- Presigned URL generation
- File type validation
- Size limits enforcement

### 5. Email Service

**Location**: `src/lib/emailService.ts`

- SendGrid integration
- Template-based emails
- Transactional email support
- Email queuing

### 6. Logging & Monitoring

**Location**: `src/lib/logger.ts`

- Structured logging
- Performance monitoring
- Error tracking
- Request/response logging
- Cache hit/miss tracking

### 7. Input Sanitization

**Location**: `src/lib/sanitize.ts`, `src/lib/validation.ts`

- XSS prevention
- SQL injection protection
- Zod schema validation
- HTML sanitization
- Email validation

---

## Data Flow

### User Registration Flow
```
1. Client → POST /api/auth/signup
2. Validation (Zod schema)
3. Sanitization (XSS prevention)
4. Check existing user (Database)
5. Hash password (bcrypt)
6. Create user record (Prisma)
7. Send welcome email (SendGrid)
8. Return success response
```

### Authenticated Request Flow
```
1. Client → Request with JWT token
2. Middleware validates JWT
3. RBAC checks permissions
4. Cache lookup (Redis)
5. If cache miss → Database query
6. Update cache
7. Log request/response
8. Return response
```

### File Upload Flow
```
1. Client → POST /api/upload
2. Validate file type & size
3. Generate presigned URL (S3)
4. Return URL to client
5. Client uploads directly to S3
6. Client → POST /api/upload/complete
7. Save file metadata (Database)
```

---

## Deployment Architecture

### Docker Containerization
- **Multi-stage builds** for optimized image size
- **Health checks** for container orchestration
- **Environment-based configuration**

### Cloud Deployment Options

#### AWS Deployment
- **ECS (Elastic Container Service)**: Container orchestration
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis caching
- **S3**: File storage
- **Secrets Manager**: Secret management
- **CloudWatch**: Logging and monitoring

#### Azure Deployment
- **App Service**: Application hosting
- **Azure Database for PostgreSQL**: Database
- **Azure Cache for Redis**: Caching
- **Blob Storage**: File storage
- **Key Vault**: Secret management
- **Application Insights**: Monitoring

### CI/CD Pipeline
1. Code push to GitHub
2. GitHub Actions triggered
3. Run tests (unit, integration, smoke)
4. Build Docker image
5. Push to container registry
6. Deploy to staging
7. Run smoke tests
8. Deploy to production

---

## Security Architecture

### Layers of Security

1. **Transport Security**
   - HTTPS/TLS encryption
   - Security headers (HSTS, CSP, X-Frame-Options)

2. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing (bcrypt, 10 rounds)
   - Token refresh mechanism

3. **Authorization**
   - Role-based access control
   - Resource-level permissions
   - API key authentication for integrations

4. **Input Validation**
   - Zod schema validation
   - HTML sanitization
   - XSS prevention
   - SQL injection protection

5. **Secret Management**
   - AWS Secrets Manager
   - Azure Key Vault
   - Environment variable encryption
   - Automatic secret rotation

6. **Rate Limiting**
   - IP-based rate limiting
   - API endpoint throttling

---

## API Documentation

### Accessing Documentation

- **Swagger UI**: http://localhost:3000/api-docs.html
- **OpenAPI Spec**: http://localhost:3000/api/docs
- **Interactive Testing**: Available in Swagger UI

### API Versioning
- Current Version: **v1.0.0**
- Base URL: `/api/*`
- Version header: `X-API-Version: 1.0.0`

### Authentication
All protected endpoints require a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Rate Limits
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: Unlimited

---

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Redis 7+ (or use Docker)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd trust-x
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start dependencies with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run db:migrate
npm run db:generate
```

6. **Start development server**
```bash
npm run dev
```

7. **Access the application**
- Application: http://localhost:3000
- API Docs: http://localhost:3000/api-docs.html
- Prisma Studio: `npm run db:studio`

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Smoke tests
npm run test:smoke

# All tests with coverage
npm run test:all
npm run test:coverage
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start

# Or build Docker image
docker build -t localtrust-id .
docker run -p 3000:3000 localtrust-id
```

---

## Monitoring & Maintenance

### Health Checks
- **Basic Health**: `/api/health`
- **Database Health**: `/api/health/db`
- **Storage Health**: `/api/upload/health`
- **Secrets Health**: `/api/health/secrets`

### Logs
- Application logs in JSON format
- Request/response logging
- Performance metrics
- Error tracking with stack traces

### Metrics
- Response times
- Cache hit rates
- Database query performance
- Error rates
- API usage statistics

---

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Make changes with tests
3. Run linting and formatting
4. Commit with conventional commit messages
5. Push and create pull request
6. Wait for CI checks to pass
7. Get code review approval
8. Merge to main

### Code Quality Standards
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode
- **Testing**: Minimum 80% coverage
- **Documentation**: JSDoc comments for public APIs

---

## Support & Resources

### Documentation
- API Documentation: `/api-docs.html`
- README files in each major directory
- Inline code comments
- Storybook for components

### Troubleshooting
- Check logs in `logs/` directory
- Review health check endpoints
- Verify environment variables
- Check Docker container status

### Additional Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Azure SDK Documentation](https://docs.microsoft.com/en-us/javascript/api/)

---

**Document Maintained By**: LocalTrust-ID Development Team  
**Last Review Date**: January 9, 2026  
**Next Review Date**: April 9, 2026
