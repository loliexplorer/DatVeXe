const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const analyticRoutes = require('./routes/analyticRoutes');

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'analytic-service',
    timestamp: new Date().toISOString()
  });
});

// Service API Routes
app.use('/api/analytics', analyticRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API route được yêu cầu trên analytic-service.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in analytic-service:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ: ' + err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [analytic-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [analytic-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
});
