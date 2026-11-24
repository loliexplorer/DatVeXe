const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'Microservice gửi Email vé điện tử kèm mã QR, thông báo hoàn tiền, nhắc nhở khởi hành và lưu lịch sử thông báo.'
    },
    servers: [
      {
        url: 'http://localhost:5005',
        description: 'Notification Service Local Server'
      }
    ],
    components: {
      schemas: {
        BookingConfirmRequest: {
          type: 'object',
          required: ['booking_code', 'customer_name', 'customer_email', 'tickets'],
          properties: {
            user_id: { type: 'integer', example: 4 },
            booking_code: { type: 'string', example: 'BK20261124-0009' },
            customer_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            customer_email: { type: 'string', example: 'khachhang@gmail.com' },
            customer_phone: { type: 'string', example: '0903000001' },
            route_name: { type: 'string', example: 'Hà Nội (BX Mỹ Đình) → Sa Pa' },
            departure_time: { type: 'string', example: '22:00 - 25/11/2026' },
            bus_plate: { type: 'string', example: '29B-999.88' },
            total_amount: { type: 'number', example: 640000 },
            tickets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  seat_code: { type: 'string', example: 'A01' },
                  passenger_name: { type: 'string', example: 'Hoàng Khách Hàng' },
                  qr_code: { type: 'string', example: 'QR-TRIP1-SEAT-A01-SEC99182' }
                }
              }
            }
          }
        },
        RefundNoticeRequest: {
          type: 'object',
          required: ['booking_code', 'customer_name', 'customer_email', 'refund_amount'],
          properties: {
            user_id: { type: 'integer', example: 4 },
            booking_code: { type: 'string', example: 'BK20261124-0009' },
            customer_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            customer_email: { type: 'string', example: 'khachhang@gmail.com' },
            refund_amount: { type: 'number', example: 640000 },
            reason: { type: 'string', example: 'Hủy vé trước giờ khởi hành trên 24 giờ (Hoàn 100%)' }
          }
        },
        TripReminderRequest: {
          type: 'object',
          required: ['booking_code', 'customer_name', 'customer_email', 'route_name', 'departure_time'],
          properties: {
            user_id: { type: 'integer', example: 4 },
            booking_code: { type: 'string', example: 'BK20261124-0009' },
            customer_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            customer_email: { type: 'string', example: 'khachhang@gmail.com' },
            customer_phone: { type: 'string', example: '0903000001' },
            route_name: { type: 'string', example: 'Hà Nội (BX Mỹ Đình) → Sa Pa' },
            departure_time: { type: 'string', example: '22:00 - 25/11/2026' },
            pickup_station: { type: 'string', example: 'Cổng số 2 - Bến xe Mỹ Đình, Hà Nội' },
            bus_plate: { type: 'string', example: '29B-999.88' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
