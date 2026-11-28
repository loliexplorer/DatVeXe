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

// Tự động đồng bộ schema (idempotent) cho các máy đang dùng booking_db bản cũ
async function ensureBookingSchema() {
  const dbName = process.env.DB_NAME || 'booking_db';
  try {
    // 1. Đảm bảo bảng bookings có refundable_until và points_awarded
    const [bookingCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'
         AND COLUMN_NAME IN ('refundable_until', 'points_awarded')`,
      [dbName]
    );
    const existingBookingCols = new Set(bookingCols.map(r => r.COLUMN_NAME));

    if (!existingBookingCols.has('refundable_until')) {
      await pool.query('ALTER TABLE bookings ADD COLUMN refundable_until DATETIME NULL AFTER status');
      console.log('🛠️ [booking-service] Auto-migrated: added bookings.refundable_until');
    }
    if (!existingBookingCols.has('points_awarded')) {
      await pool.query('ALTER TABLE bookings ADD COLUMN points_awarded BOOLEAN NOT NULL DEFAULT FALSE AFTER refundable_until');
      console.log('🛠️ [booking-service] Auto-migrated: added bookings.points_awarded');
    }

    // 2. Đảm bảo bảng tickets có cột seat_active (1 = hiệu lực, NULL = đã hủy)
    const [ticketCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'seat_active'`,
      [dbName]
    );
    if (ticketCols.length === 0) {
      await pool.query('ALTER TABLE tickets ADD COLUMN seat_active TINYINT NULL DEFAULT 1 AFTER check_in_status');
      await pool.query(
        `UPDATE tickets t
         JOIN bookings b ON t.booking_id = b.id
         SET t.seat_active = NULL
         WHERE b.status = 'CANCELLED'`
      );
      console.log('🛠️ [booking-service] Auto-migrated: added tickets.seat_active and backfilled cancelled tickets');
    }

    // 3. Đảm bảo UNIQUE KEY uk_trip_seat gồm (trip_id, seat_code, seat_active)
    const [idxRows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tickets' AND INDEX_NAME = 'uk_trip_seat'`,
      [dbName]
    );
    const idxCols = idxRows.map(r => r.COLUMN_NAME);
    if (idxCols.length === 0) {
      await pool.query('ALTER TABLE tickets ADD UNIQUE KEY uk_trip_seat (trip_id, seat_code, seat_active)');
      console.log('🛠️ [booking-service] Auto-migrated: created uk_trip_seat(trip_id, seat_code, seat_active)');
    } else if (!idxCols.includes('seat_active')) {
      await pool.query('ALTER TABLE tickets DROP INDEX uk_trip_seat, ADD UNIQUE KEY uk_trip_seat (trip_id, seat_code, seat_active)');
      console.log('🛠️ [booking-service] Auto-migrated: updated uk_trip_seat to (trip_id, seat_code, seat_active)');
    }
  } catch (err) {
    console.error('⚠️ [booking-service] Auto-migrate warning:', err.message);
  }
}

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

app.listen(PORT, async () => {
  console.log(`🚀 [booking-service] is running on http://localhost:${PORT}`);
  console.log(`📑 [booking-service] Swagger UI documentation: http://localhost:${PORT}/api-docs`);
  await ensureBookingSchema();
  // Kiểm tra cộng điểm mỗi 15 giây
  setInterval(settleExpiredRefundPoints, 15000);
  settleExpiredRefundPoints();
});
