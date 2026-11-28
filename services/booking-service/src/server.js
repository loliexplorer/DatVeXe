const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const pool = require('./config/db');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'booking-service',
    timestamp: new Date().toISOString()
  });
});

// Service API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API route được yêu cầu trên booking-service.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in booking-service:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ: ' + err.message
  });
});

// Worker tự động cộng điểm hội viên sang user-service ngay sau khi đơn vé hết hạn hoàn vé
async function settleExpiredRefundPoints() {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5001';
  try {
    const [eligibleBookings] = await pool.query(
      `SELECT id, booking_code, user_id, total_amount
       FROM bookings
       WHERE status = 'CONFIRMED'
         AND points_awarded = FALSE
         AND user_id IS NOT NULL
         AND refundable_until IS NOT NULL
         AND refundable_until <= NOW()
       LIMIT 20`
    );

    for (const b of eligibleBookings) {
      // Quy đổi: 3% giá trị đơn (100đ = 1 điểm), tối thiểu 10 điểm
      const earnedPoints = Math.max(10, Math.round((Number(b.total_amount) * 0.03) / 100));
      try {
        const resp = await fetch(`${userServiceUrl}/api/users/loyalty-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_SERVICE_KEY || 'EcoBusInternalServiceSecret2026!@#'
          },
          body: JSON.stringify({
            user_id: b.user_id,
            points_change: earnedPoints,
            action_type: 'TRIP_REWARD',
            description: `Tích lũy điểm hội viên sau khi hết hạn hoàn vé đơn #${b.booking_code}`
          })
        });

        if (resp.ok) {
          await pool.execute('UPDATE bookings SET points_awarded = TRUE WHERE id = ?', [b.id]);
          console.log(`⭐ [booking-service] Auto-awarded +${earnedPoints} pts to user #${b.user_id} for booking ${b.booking_code}`);
        }
      } catch (err) {
        console.warn(`⚠️ [booking-service] Failed to award points for ${b.booking_code}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ [booking-service] settleExpiredRefundPoints error:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [booking-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [booking-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
  // Kiểm tra cộng điểm mỗi 15 giây
  setInterval(settleExpiredRefundPoints, 15000);
  settleExpiredRefundPoints();
});
