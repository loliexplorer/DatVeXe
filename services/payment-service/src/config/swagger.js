const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description: 'Microservice quản lý Khởi tạo thanh toán QR VietQR / VNPay / MoMo, xử lý Webhook IPN và Hoàn tiền vé xe.'
    },
    servers: [
      {
        url: 'http://localhost:5004',
        description: 'Payment Service Local Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token'
        }
      },
      schemas: {
        InitiatePaymentRequest: {
          type: 'object',
          required: ['booking_id', 'booking_code', 'amount', 'payment_method'],
          properties: {
            booking_id: { type: 'integer', example: 1 },
            booking_code: { type: 'string', example: 'BK20261106-0001' },
            amount: { type: 'number', example: 640000 },
            payment_method: {
              type: 'string',
              enum: ['VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH'],
              example: 'BANK_TRANSFER'
            }
          }
        },
        WebhookRequest: {
          type: 'object',
          required: ['payment_id', 'transaction_id'],
          properties: {
            payment_id: { type: 'integer', example: 2 },
            transaction_id: { type: 'string', example: 'TRANS-MBBANK-8829103' },
            gateway_status: { type: 'string', example: 'SUCCESS' },
            bank_code: { type: 'string', example: 'MBBANK' },
            amount_paid: { type: 'number', example: 320000 }
          }
        },
        RefundRequest: {
          type: 'object',
          required: ['payment_id', 'refund_amount', 'reason'],
          properties: {
            payment_id: { type: 'integer', example: 1 },
            refund_amount: { type: 'number', example: 640000 },
            reason: { type: 'string', example: 'Khách hàng hủy vé trước 24 giờ khởi hành' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
