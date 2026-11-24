const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// 1. Bảo mật & Middleware cơ bản (Không gắn express.json() toàn cục để tránh nuốt body stream khi proxy)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(morgan('dev'));

// 2. Rate Limiter chống spam request
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // tối đa 200 requests / phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 1 phút!'
  }
});
app.use('/api', limiter);

// 3. Bảng cấu hình định tuyến 8 Microservices
const SERVICE_ROUTES = [
  {
    name: 'user-service',
    target: process.env.USER_SERVICE_URL || 'http://localhost:5001',
    paths: ['/api/auth', '/api/users'],
    description: 'Xác thực JWT, Profile, Điểm hội viên & Quản lý tài xế'
  },
  {
    name: 'trip-service',
    target: process.env.TRIP_SERVICE_URL || 'http://localhost:5002',
    paths: ['/api/stations', '/api/trips'],
    description: 'Bến xe, Tìm chuyến, Sơ đồ ghế 2 tầng, GPS Realtime & Đánh giá'
  },
  {
    name: 'booking-service',
    target: process.env.BOOKING_SERVICE_URL || 'http://localhost:5003',
    paths: ['/api/bookings', '/api/tickets'],
    description: 'Giữ chỗ 10 phút, Đặt vé QR, Tài xế Check-in & Hủy vé'
  },
  {
    name: 'payment-service',
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
    paths: ['/api/payments'],
    description: 'VietQR Napas247, Cổng VNPay/MoMo, Webhook IPN & Hoàn tiền'
  },
  {
    name: 'notification-service',
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005',
    paths: ['/api/notifications'],
    description: 'Gửi Email HTML vé điện tử kèm QR, hoàn tiền & nhắc lịch'
  },
  {
    name: 'voucher-service',
    target: process.env.VOUCHER_SERVICE_URL || 'http://localhost:5006',
    paths: ['/api/vouchers'],
    description: 'Mã giảm giá, Kiểm tra điều kiện áp mã & Đổi điểm hội viên'
  },
  {
    name: 'dispatch-service',
    target: process.env.DISPATCH_SERVICE_URL || 'http://localhost:5007',
    paths: ['/api/dispatch'],
    description: 'Phân công ca chạy tài xế, Nhật ký hành trình & Báo cáo sự cố'
  },
  {
    name: 'analytic-service',
    target: process.env.ANALYTIC_SERVICE_URL || 'http://localhost:5008',
    paths: ['/api/analytics'],
    description: 'Thống kê doanh thu, Tỷ lệ lấp đầy ghế & Hiệu suất tài xế'
  }
];

// 4. Đăng ký Reverse Proxy cho từng service (dùng pathFilter để giữ nguyên prefix /api/...)
for (const service of SERVICE_ROUTES) {
  app.use(
    createProxyMiddleware({
      target: service.target,
      changeOrigin: true,
      pathFilter: service.paths,
      on: {
        error: (err, req, res) => {
          console.error(`❌ [api-gateway] Proxy error -> ${service.name} (${service.target}):`, err.message);
          if (!res.headersSent) {
            res.status(502).json({
              success: false,
              service: service.name,
              message: `Dịch vụ ${service.name} hiện không phản hồi. Vui lòng kiểm tra lại!`
            });
          }
        }
      }
    })
  );
}

// 5. Trang chủ & Swagger Hub điều hướng tập trung
app.get('/', (req, res) => {
  res.json({
    success: true,
    gateway: 'EcoBus API Gateway',
    port: PORT,
    health_check_all: `http://localhost:${PORT}/health/all`,
    services: SERVICE_ROUTES.map(s => ({
      name: s.name,
      routes: s.paths,
      target: s.target,
      swagger_docs: `${s.target}/api-docs`,
      description: s.description
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// 6. Health Check tổng hợp cả 8 Microservices cùng lúc
app.get('/health/all', async (req, res) => {
  const results = await Promise.all(
    SERVICE_ROUTES.map(async (service) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      try {
        const resp = await fetch(`${service.target}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          return { name: service.name, url: service.target, status: 'UP', details: data };
        }
        return { name: service.name, url: service.target, status: 'DOWN', http_status: resp.status };
      } catch (err) {
        clearTimeout(timeout);
        return { name: service.name, url: service.target, status: 'DOWN', error: err.message };
      }
    })
  );

  const upCount = results.filter(r => r.status === 'UP').length;
  res.status(upCount === results.length ? 200 : 207).json({
    gateway: 'UP',
    summary: `${upCount}/${results.length} services UP`,
    timestamp: new Date().toISOString(),
    services: results
  });
});

// 404 handler cho các route không khớp
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Gateway không tìm thấy đường dẫn định tuyến cho: ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🚪 [api-gateway] is running on http://localhost:${PORT}`);
  console.log(`🩺 [api-gateway] Health Check All 8 Services: http://localhost:${PORT}/health/all`);
});
