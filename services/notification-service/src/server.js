const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Service API Routes
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API route được yêu cầu trên notification-service.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in notification-service:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ: ' + err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [notification-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [notification-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
});
