const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const { testConnection } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Endpoint Kiểm tra sức khỏe dịch vụ (Health Check)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// 2. Tài liệu Swagger UI / OpenAPI 3.0
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'User & Auth Service API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// 3. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 4. Xử lý đường dẫn không tồn tại (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên user-service!`
  });
});

// 5. Khởi động máy chủ & Kiểm tra kết nối CSDL
async function startServer() {
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 [user-service] đang chạy tại: http://localhost:${PORT}`);
    console.log(`📖 [Swagger UI] Xem tài liệu API tại: http://localhost:${PORT}/api-docs`);
  });
}

startServer();
