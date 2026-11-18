const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

// Mock Gateway UI page for demo testing
app.get('/api/payments/mock-gateway', (req, res) => {
  const { payment_id, booking_code, amount, method } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Cổng Thanh Toán Giả Lập - ${method || 'SANDBOX'}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 32px; width: 420px; text-align: center; }
        .badge { background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 9999px; font-weight: 600; display: inline-block; margin-bottom: 16px; font-size: 13px; }
        .amount { font-size: 28px; font-weight: 800; color: #0f172a; margin: 12px 0 20px 0; }
        .btn { display: block; width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; margin-top: 10px; }
        .btn-success { background: #16a34a; color: white; }
        .btn-fail { background: #ef4444; color: white; }
        .info-row { display: flex; justify-content: space-between; font-size: 14px; color: #64748b; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">CỔNG THANH TOÁN MÔ PHỎNG (${method})</span>
        <div class="info-row"><span>Mã thanh toán:</span><b>#${payment_id}</b></div>
        <div class="info-row"><span>Mã vé:</span><b>${booking_code}</b></div>
        <div class="amount">${Number(amount || 0).toLocaleString('vi-VN')} VNĐ</div>
        <button class="btn btn-success" onclick="pay('SUCCESS')">✅ Giả lập Thanh Toán Thành Công</button>
        <button class="btn btn-fail" onclick="pay('FAILED')">❌ Giả lập Thanh Toán Thất Bại</button>
      </div>
      <script>
        async function pay(status) {
          const res = await fetch('/api/payments/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_id: Number('${payment_id}'),
              transaction_id: '${method}-TRANS-' + Math.floor(10000000 + Math.random() * 90000000),
              gateway_status: status,
              bank_code: '${method}',
              amount_paid: Number('${amount}')
            })
          });
          const data = await res.json();
          alert(data.message);
          window.location.href = '/api-docs';
        }
      </script>
    </body>
    </html>
  `);
});

// Service API Routes
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API route được yêu cầu trên payment-service.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in payment-service:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ: ' + err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [payment-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [payment-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
});
