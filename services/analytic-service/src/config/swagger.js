const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analytic & Reporting Service API',
      version: '1.0.0',
      description: 'Microservice thống kê doanh thu, tỷ lệ lấp đầy ghế theo tuyến đường và hiệu suất tài xế cho Admin Dashboard.'
    },
    servers: [
      {
        url: 'http://localhost:5008',
        description: 'Analytic Service Local Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token của Admin với định dạng Bearer {token}'
        }
      },
      schemas: {
        RecordEventRequest: {
          type: 'object',
          required: ['event_type', 'amount'],
          properties: {
            event_type: {
              type: 'string',
              enum: ['BOOKING_PAID', 'BOOKING_REFUNDED'],
              example: 'BOOKING_PAID'
            },
            stat_date: { type: 'string', example: '2026-11-24' },
            route_name: { type: 'string', example: 'Hà Nội (BX Mỹ Đình) → Sa Pa' },
            seats_count: { type: 'integer', example: 2 },
            amount: { type: 'number', example: 640000 }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
