const pool = require('../config/db');

// 1. Tổng quan Dashboard Admin
const getOverview = async (req, res) => {
  try {
    const [revenueRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_bookings), 0) AS total_bookings,
        COALESCE(SUM(total_tickets), 0) AS total_tickets,
        COALESCE(SUM(gross_revenue), 0) AS gross_revenue,
        COALESCE(SUM(refund_amount), 0) AS total_refunds,
        COALESCE(SUM(net_revenue), 0) AS net_revenue
      FROM daily_revenue_stats
    `);

    const [routeRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_trips), 0) AS total_trips,
        COALESCE(ROUND(AVG(occupancy_rate), 2), 0) AS avg_occupancy_rate
      FROM route_performance_stats
    `);

    const [driverRows] = await pool.query(`
      SELECT 
        COUNT(*) AS active_drivers,
        COALESCE(SUM(completed_trips), 0) AS completed_trips,
        COALESCE(ROUND(AVG(avg_rating), 2), 5.00) AS avg_driver_rating
      FROM driver_performance_stats
    `);

    return res.status(200).json({
      success: true,
      data: {
        revenue_summary: revenueRows[0],
        operations_summary: routeRows[0],
        driver_summary: driverRows[0]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tổng quan thống kê: ' + error.message
    });
  }
};

// 2. Biểu đồ doanh thu theo ngày
const getRevenueChart = async (req, res) => {
  const { days = 7, from, to } = req.query;

  try {
    let query = 'SELECT * FROM daily_revenue_stats';
    const params = [];

    if (from && to) {
      query += ' WHERE stat_date BETWEEN ? AND ? ORDER BY stat_date ASC';
      params.push(from, to);
    } else {
      const limitDays = Math.min(Math.max(Number(days) || 7, 1), 90);
      query = `SELECT * FROM (SELECT * FROM daily_revenue_stats ORDER BY stat_date DESC LIMIT ?) sub ORDER BY stat_date ASC`;
      params.push(limitDays);
    }

    const [rows] = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      total_days: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu doanh thu: ' + error.message
    });
  }
};

// 3. Xếp hạng tuyến đường đông khách & tỷ lệ lấp đầy ghế
const getTopRoutes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM route_performance_stats ORDER BY total_revenue DESC, occupancy_rate DESC'
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tuyến đường: ' + error.message
    });
  }
};

// 4. Báo cáo hiệu suất tài xế
const getDriverPerformance = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM driver_performance_stats ORDER BY avg_rating DESC, completed_trips DESC'
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo hiệu suất tài xế: ' + error.message
    });
  }
};

// 5. Ghi nhận sự kiện thống kê mới (Đặt vé / Hoàn tiền)
const recordEvent = async (req, res) => {
  const { event_type, stat_date, route_name, seats_count = 1, amount } = req.body;

  if (!event_type || amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp event_type (BOOKING_PAID | BOOKING_REFUNDED) và amount!'
    });
  }

  const targetDate = stat_date || new Date().toISOString().slice(0, 10);
  const numAmount = Number(amount);
  const numSeats = Number(seats_count) || 1;
  const normalizedType = String(event_type).toUpperCase();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (normalizedType === 'BOOKING_PAID') {
      await connection.execute(
        `INSERT INTO daily_revenue_stats (stat_date, total_bookings, total_tickets, gross_revenue, refund_amount, net_revenue)
         VALUES (?, 1, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE
           total_bookings = total_bookings + 1,
           total_tickets = total_tickets + VALUES(total_tickets),
           gross_revenue = gross_revenue + VALUES(gross_revenue),
           net_revenue = net_revenue + VALUES(net_revenue)`,
        [targetDate, numSeats, numAmount, numAmount]
      );

      if (route_name) {
        await connection.execute(
          `UPDATE route_performance_stats
           SET seats_sold = seats_sold + ?,
               total_revenue = total_revenue + ?,
               occupancy_rate = LEAST(100.00, ROUND(((seats_sold + ?) / GREATEST(total_seats_capacity, 1)) * 100, 2))
           WHERE route_name = ?`,
          [numSeats, numAmount, numSeats, route_name]
        );
      }
    } else if (normalizedType === 'BOOKING_REFUNDED') {
      await connection.execute(
        `INSERT INTO daily_revenue_stats (stat_date, total_bookings, total_tickets, gross_revenue, refund_amount, net_revenue)
         VALUES (?, 0, 0, 0, ?, ?)
         ON DUPLICATE KEY UPDATE
           refund_amount = refund_amount + VALUES(refund_amount),
           net_revenue = GREATEST(0, net_revenue - VALUES(refund_amount))`,
        [targetDate, numAmount, 0]
      );
    } else {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'event_type phải là BOOKING_PAID hoặc BOOKING_REFUNDED!'
      });
    }

    await connection.commit();
    const [updatedDay] = await pool.execute('SELECT * FROM daily_revenue_stats WHERE stat_date = ?', [targetDate]);

    return res.status(200).json({
      success: true,
      message: `Đã ghi nhận sự kiện ${normalizedType} vào thống kê ngày ${targetDate}!`,
      data: updatedDay[0]
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi ghi nhận thống kê: ' + error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getOverview,
  getRevenueChart,
  getTopRoutes,
  getDriverPerformance,
  recordEvent
};
