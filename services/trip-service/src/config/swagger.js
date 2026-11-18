const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trip, Route & Catalog Service API',
      version: '1.0.0',
      description: 'Dịch vụ Quản lý Chuyến xe, Tuyến đường, Sơ đồ ghế, Tọa độ GPS Tracking & Đánh giá chuyến đi cho Hệ thống Đặt vé xe trực tuyến (Môn học SOSD).',
      contact: {
        name: 'Nhóm Phát triển EcoBus'
      }
    },
    servers: [
      {
        url: 'http://localhost:5002',
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
        Station: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Bến xe Mỹ Đình' },
            city: { type: 'string', example: 'Hà Nội' },
            address: { type: 'string', example: 'Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội' }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            bus_name: { type: 'string', example: 'EcoBus Express VIP' },
            bus_type: { type: 'string', enum: ['SLEEPER', 'LIMOUSINE', 'SEAT'], example: 'SLEEPER' },
            plate_number: { type: 'string', example: '29B-998.88' },
            origin_city: { type: 'string', example: 'Hà Nội' },
            origin_station: { type: 'string', example: 'Bến xe Mỹ Đình' },
            destination_city: { type: 'string', example: 'Sa Pa' },
            dest_station: { type: 'string', example: 'Bến xe Sa Pa' },
            departure_time: { type: 'string', example: '07:00' },
            arrival_time: { type: 'string', example: '12:30' },
            duration: { type: 'string', example: '5h 30m' },
            price: { type: 'number', example: 320000 },
            available_seats: { type: 'integer', example: 16 },
            total_seats: { type: 'integer', example: 20 },
            rating: { type: 'number', example: 4.9 },
            reviews_count: { type: 'integer', example: 384 },
            status: { type: 'string', example: 'SCHEDULED' }
          }
        },
        Seat: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            seat_code: { type: 'string', example: 'A01' },
            floor_number: { type: 'integer', example: 1 },
            seat_type: { type: 'string', example: 'VIP' },
            is_booked: { type: 'boolean', example: false }
          }
        },
        TripTracking: {
          type: 'object',
          properties: {
            trip_id: { type: 'integer', example: 1 },
            status: { type: 'string', example: 'EN_ROUTE' },
            speed_kmh: { type: 'number', example: 65 },
            progress_percent: { type: 'number', example: 54 },
            current_coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 21.7167 },
                lng: { type: 'number', example: 104.9 }
              }
            },
            origin: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Bến xe Mỹ Đình (Hà Nội)' },
                lat: { type: 'number', example: 21.0285 },
                lng: { type: 'number', example: 105.778 }
              }
            },
            destination: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Bến xe Sa Pa (Lào Cai)' },
                lat: { type: 'number', example: 22.3364 },
                lng: { type: 'number', example: 103.8438 }
              }
            },
            driver: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Trần Văn Lái' },
                phone: { type: 'string', example: '0902000001' },
                experience: { type: 'string', example: '5 năm lái xe đường dài' }
              }
            }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            trip_id: { type: 'integer', example: 1 },
            user_name: { type: 'string', example: 'Hoàng Khách Hàng' },
            rating: { type: 'integer', example: 5 },
            comment: { type: 'string', example: 'Xe chạy rất êm, bác tài lái cẩn thận!' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
