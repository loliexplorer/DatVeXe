const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Voucher & Promotion Service API',
      version: '1.0.0',
      description: 'Microservice quản lý Mã giảm giá, Kiểm tra điều kiện áp mã, Áp dụng voucher vào đơn vé và Đổi điểm thưởng hội viên.'
    },
    servers: [
      {
        url: 'http://localhost:5006',
        description: 'Voucher Service Local Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token với định dạng Bearer {token}'
        }
      },
      schemas: {
        ValidateVoucherRequest: {
          type: 'object',
          required: ['code', 'order_amount'],
          properties: {
            code: { type: 'string', example: 'CHAOBANMOI' },
            order_amount: { type: 'number', example: 640000 },
            route_name: { type: 'string', example: 'Hà Nội - Sa Pa' }
          }
        },
        ApplyVoucherRequest: {
          type: 'object',
          required: ['code', 'booking_code', 'order_amount'],
          properties: {
            code: { type: 'string', example: 'CHAOBANMOI' },
            booking_code: { type: 'string', example: 'BK20261124-0009' },
            order_amount: { type: 'number', example: 640000 },
            route_name: { type: 'string', example: 'Hà Nội - Sa Pa' }
          }
        },
        RedeemPointsRequest: {
          type: 'object',
          required: ['points_to_redeem'],
          properties: {
            points_to_redeem: { type: 'integer', example: 1000 }
          }
        },
        CreateVoucherRequest: {
          type: 'object',
          required: ['code', 'title', 'discount_type', 'discount_value', 'start_date', 'end_date'],
          properties: {
            code: { type: 'string', example: 'CUOITUAN30' },
            title: { type: 'string', example: 'Ưu đãi cuối tuần giảm 30K' },
            description: { type: 'string', example: 'Giảm 30.000đ cho đơn từ 200.000đ vào cuối tuần' },
            discount_type: { type: 'string', enum: ['PERCENT', 'FIXED'], example: 'FIXED' },
            discount_value: { type: 'number', example: 30000 },
            max_discount_amount: { type: 'number', example: 100000 },
            min_order_amount: { type: 'number', example: 200000 },
            route_filter: { type: 'string', example: '' },
            usage_limit: { type: 'integer', example: 100 },
            start_date: { type: 'string', example: '2026-01-01 00:00:00' },
            end_date: { type: 'string', example: '2027-12-31 23:59:59' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
