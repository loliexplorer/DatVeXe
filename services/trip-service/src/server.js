const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const { testConnection } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const stationRoutes = require('./routes/stationRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5002;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'trip-service',
    timestamp: new Date().toISOString()
  });
});

// 2. Swagger UI / OpenAPI 3.0 Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Trip & Route Service API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// 3. Mount Routes
app.use('/api', stationRoutes);
app.use('/api', tripRoutes);

// 4. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên trip-service!`
  });
});

// 5. Khởi động server
async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`🚀 [trip-service] đang chạy tại: http://localhost:${PORT}`);
    console.log(`📖 [Swagger UI] Xem tài liệu API tại: http://localhost:${PORT}/api-docs`);
  });
}

startServer();
