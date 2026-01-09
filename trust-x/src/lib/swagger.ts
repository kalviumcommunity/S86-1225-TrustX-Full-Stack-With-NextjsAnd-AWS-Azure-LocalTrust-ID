import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalTrust-ID API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for LocalTrust-ID - Decentralized Identity Verification and Trust Management System',
      contact: {
        name: 'LocalTrust-ID Team',
        email: 'support@localtrust-id.com',
        url: 'https://localtrust-id.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://staging.localtrust-id.com',
        description: 'Staging server'
      },
      {
        url: 'https://api.localtrust-id.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for third-party integrations'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: { 
              type: 'string', 
              format: 'email',
              description: 'User email address'
            },
            firstName: { 
              type: 'string',
              description: 'User first name'
            },
            lastName: { 
              type: 'string',
              description: 'User last name'
            },
            phoneNumber: { 
              type: 'string',
              description: 'User phone number'
            },
            verificationStatus: { 
              type: 'string', 
              enum: ['pending', 'verified', 'rejected'],
              description: 'Identity verification status'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['id', 'email', 'createdAt']
        },
        Project: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'Unique project identifier'
            },
            name: { 
              type: 'string',
              description: 'Project name'
            },
            description: { 
              type: 'string',
              description: 'Project description'
            },
            userId: { 
              type: 'string', 
              format: 'uuid',
              description: 'ID of the user who created the project'
            },
            status: { 
              type: 'string',
              enum: ['active', 'completed', 'archived'],
              description: 'Project status'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time'
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid'
            },
            content: { 
              type: 'string',
              description: 'Comment text content'
            },
            userId: { 
              type: 'string', 
              format: 'uuid'
            },
            projectId: { 
              type: 'string', 
              format: 'uuid'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid'
            },
            userId: { 
              type: 'string', 
              format: 'uuid'
            },
            productName: { 
              type: 'string'
            },
            quantity: { 
              type: 'integer',
              minimum: 1
            },
            totalAmount: { 
              type: 'number',
              format: 'float'
            },
            status: { 
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time'
            }
          }
        },
        FileUpload: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid'
            },
            fileName: { 
              type: 'string'
            },
            fileSize: { 
              type: 'integer'
            },
            mimeType: { 
              type: 'string'
            },
            url: { 
              type: 'string',
              format: 'uri'
            },
            uploadedBy: { 
              type: 'string', 
              format: 'uuid'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { 
              type: 'string',
              description: 'Error type or code'
            },
            message: { 
              type: 'string',
              description: 'Human-readable error message'
            },
            statusCode: { 
              type: 'integer',
              description: 'HTTP status code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          },
          required: ['error', 'message', 'statusCode']
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              example: true
            },
            message: { 
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: 'Service health status'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              description: 'Service uptime in seconds'
            },
            database: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                latency: { type: 'number' }
              }
            },
            cache: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                latency: { type: 'number' }
              }
            },
            storage: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                provider: { type: 'string', enum: ['aws-s3', 'azure-blob'] }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                message: 'Authentication required',
                statusCode: 401
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Forbidden',
                message: 'Insufficient permissions',
                statusCode: 403
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Not Found',
                message: 'Resource not found',
                statusCode: 404
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation Error',
                message: 'Invalid input data',
                statusCode: 400,
                details: {
                  fields: ['email', 'password']
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                statusCode: 500
              }
            }
          }
        }
      },
      parameters: {
        UserIdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User unique identifier',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        ProjectIdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Project unique identifier',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Projects',
        description: 'Project management operations'
      },
      {
        name: 'Comments',
        description: 'Comment and discussion operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Files',
        description: 'File upload and management operations'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (requires admin role)'
      },
      {
        name: 'Health',
        description: 'System health and status checks'
      },
      {
        name: 'Email',
        description: 'Email notification operations'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js'
  ]
};

export const swaggerSpec = swaggerJsDoc(swaggerOptions);
export default swaggerSpec;
