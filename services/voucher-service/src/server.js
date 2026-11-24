const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const voucherRoutes = require('./routes/voucherRoutes');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'voucher-service',
    timestamp: new Date().toISOString()
  });
});

// Service API Routes
app.use('/api/vouchers', voucherRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API route được yêu cầu trên voucher-service.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in voucher-service:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ: ' + err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [voucher-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [voucher-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
});
