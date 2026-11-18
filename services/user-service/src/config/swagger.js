const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User & Identity Service API',
      version: '1.0.0',
      description: 'Dịch vụ Quản lý Người dùng, Xác thực JWT & Phân quyền RBAC cho Hệ thống Đặt vé xe trực tuyến (Môn học SOSD - Service-Oriented Software Development).',
      contact: {
        name: 'Nhóm Phát triển EcoBus'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Máy chủ phát triển Local (Direct Port)'
      },
      {
        url: 'http://localhost:8000',
        description: 'Cổng API Gateway'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token theo định dạng: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 4 },
            role_id: { type: 'integer', example: 2 },
            role_name: { type: 'string', example: 'CUSTOMER' },
            full_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            email: { type: 'string', example: 'khachhang@gmail.com' },
            phone: { type: 'string', example: '0903000001' },
            avatar_url: { type: 'string', nullable: true, example: null },
            membership_tier: { type: 'string', enum: ['BRONZE', 'SILVER', 'GOLD'], example: 'SILVER' },
            loyalty_points: { type: 'integer', example: 850 },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'phone', 'password'],
          properties: {
            full_name: { type: 'string', example: 'Nguyễn Văn An' },
            email: { type: 'string', format: 'email', example: 'nguyenvanan@gmail.com' },
            phone: { type: 'string', example: '0912345678' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'Password123@' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'khachhang@gmail.com' },
            password: { type: 'string', format: 'password', example: 'Password123@' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Đăng nhập thành công' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Thông báo lỗi chi tiết' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
