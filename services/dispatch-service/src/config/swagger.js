const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dispatch & Driver Schedule Service API',
      version: '1.0.0',
      description: 'Microservice điều phối phân công ca chạy cho Tài xế, cập nhật trạng thái chuyến đi và ghi nhận nhật ký trạm dừng / sự cố.'
    },
    servers: [
      {
        url: 'http://localhost:5007',
        description: 'Dispatch Service Local Server'
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
        CreateAssignmentRequest: {
          type: 'object',
          required: ['trip_id', 'driver_id', 'driver_name', 'bus_plate', 'route_name', 'shift_date', 'departure_time'],
          properties: {
            trip_id: { type: 'integer', example: 3 },
            driver_id: { type: 'integer', example: 2 },
            driver_name: { type: 'string', example: 'Trần Văn Lái (Tài xế 1)' },
            bus_plate: { type: 'string', example: '29B-999.88' },
            route_name: { type: 'string', example: 'Hà Nội (BX Mỹ Đình) → Sa Pa' },
            shift_date: { type: 'string', example: '2026-11-28' },
            departure_time: { type: 'string', example: '22:00' },
            notes: { type: 'string', example: 'Xe tăng cường cuối tuần' }
          }
        },
        UpdateStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'],
              example: 'IN_PROGRESS'
            },
            notes: { type: 'string', example: 'Xe đã xuất bến đúng giờ' }
          }
        },
        AddJourneyLogRequest: {
          type: 'object',
          required: ['checkpoint_name', 'event_type'],
          properties: {
            checkpoint_name: { type: 'string', example: 'Km150 Cao tốc Nội Bài - Lào Cai' },
            event_type: {
              type: 'string',
              enum: ['DEPARTED', 'REST_STOP', 'INCIDENT', 'ARRIVED'],
              example: 'INCIDENT'
            },
            description: { type: 'string', example: 'Kẹt xe nhẹ do sửa đường, dự kiến chậm 15 phút.' },
            latitude: { type: 'number', example: 21.85421 },
            longitude: { type: 'number', example: 104.88213 }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions);
