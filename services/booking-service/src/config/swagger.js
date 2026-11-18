const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking & Ticket Service API',
      version: '1.0.0',
      description: 'Microservice quản lý Đặt vé, Giữ chỗ tạm thời 10 phút, Quản lý vé hành khách và Quét mã QR check-in cho tài xế.'
    },
    servers: [
      {
        url: 'http://localhost:5003',
        description: 'Booking Service Local Server'
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
        SeatLockRequest: {
          type: 'object',
          required: ['trip_id', 'seat_codes', 'session_id'],
          properties: {
            trip_id: { type: 'integer', example: 1 },
            seat_codes: {
              type: 'array',
              items: { type: 'string' },
              example: ['A03', 'A04']
            },
            session_id: { type: 'string', example: 'sess_user_991823' }
          }
        },
        CreateBookingRequest: {
          type: 'object',
          required: ['trip_id', 'customer_name', 'customer_phone', 'customer_email', 'seats'],
          properties: {
            trip_id: { type: 'integer', example: 1 },
            customer_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            customer_phone: { type: 'string', example: '0903000001' },
            customer_email: { type: 'string', example: 'khachhang@gmail.com' },
            seats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  seat_code: { type: 'string', example: 'A03' },
                  passenger_name: { type: 'string', example: 'Hoàng Khách Hàng' },
                  ticket_price: { type: 'number', example: 320000 }
                }
              }
            },
            session_id: { type: 'string', example: 'sess_user_991823' }
          }
        },
        CheckInRequest: {
          type: 'object',
          required: ['qr_code'],
          properties: {
            qr_code: { type: 'string', example: 'QR-TRIP1-SEAT-A01-SEC99182' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
