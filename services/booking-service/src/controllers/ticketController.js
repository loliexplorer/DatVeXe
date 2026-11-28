const pool = require('../config/db');

// 1. Tài xế quét mã QR soát vé hành khách lên xe
const checkInTicket = async (req, res) => {
  const { qr_code } = req.body;
  const driverId = req.user ? req.user.id : null;

  if (!qr_code) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã qr_code của vé!'
    });
  }

  try {
    const [tickets] = await pool.execute(
      `SELECT t.*, b.booking_code, b.customer_phone, b.status as booking_status 
       FROM tickets t 
       JOIN bookings b ON t.booking_id = b.id 
       WHERE t.qr_code = ?`,
      [qr_code]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mã QR không tồn tại trên hệ thống hoặc vé không hợp lệ!'
      });
    }

    const ticket = tickets[0];

    if (ticket.booking_status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Vé này thuộc đơn đặt đã bị HỦY. Không được phép lên xe!'
      });
    }

    if (ticket.check_in_status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: `Cảnh báo: Vé ghế [${ticket.seat_code}] đã được check-in trước đó vào lúc ${ticket.checked_in_at}!`,
        data: {
          ticket_id: ticket.id,
          seat_code: ticket.seat_code,
          passenger_name: ticket.passenger_name,
          checked_in_at: ticket.checked_in_at,
          already_checked_in: true
        }
      });
    }

    // Cập nhật trạng thái check-in
    await pool.execute(
      `UPDATE tickets 
       SET check_in_status = 'CHECKED_IN', checked_in_at = NOW(), checked_in_by = ? 
       WHERE id = ?`,
      [driverId, ticket.id]
    );

    const [updated] = await pool.execute(
      'SELECT id, seat_code, passenger_name, check_in_status, checked_in_at FROM tickets WHERE id = ?',
      [ticket.id]
    );

    return res.status(200).json({
      success: true,
      message: `Soát vé thành công cho hành khách ${ticket.passenger_name} (Ghế ${ticket.seat_code})!`,
      data: updated[0]
    });
  } catch (error) {
    console.error('Lỗi khi soát vé:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi check-in vé: ' + error.message
    });
  }
};

// 2. Tra cứu thông tin vé qua mã QR
const getTicketByQr = async (req, res) => {
  const { qrCode } = req.params;

  try {
    const [tickets] = await pool.execute(
      `SELECT t.*, b.booking_code, b.customer_phone, b.customer_name as booker_name, b.status as booking_status 
       FROM tickets t 
       JOIN bookings b ON t.booking_id = b.id 
       WHERE t.qr_code = ?`,
      [qrCode]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vé tương ứng với mã QR này!'
      });
    }

    return res.status(200).json({
      success: true,
      data: tickets[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu mã QR: ' + error.message
    });
  }
};

// 3. Tài xế / Admin lấy danh sách hành khách & vé thực tế của 1 chuyến xe
const getTicketsByTrip = async (req, res) => {
  const { tripId } = req.params;

  try {
    const [tickets] = await pool.execute(
      `SELECT t.id, t.booking_id, t.trip_id, t.seat_code, t.passenger_name, t.ticket_price,
              t.qr_code, t.check_in_status, t.checked_in_at, t.checked_in_by,
              b.booking_code, b.customer_phone, b.customer_email, b.status AS booking_status
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       WHERE t.trip_id = ? AND b.status != 'CANCELLED'
       ORDER BY t.seat_code ASC`,
      [tripId]
    );

    return res.status(200).json({
      success: true,
      total: tickets.length,
      data: tickets
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hành khách của chuyến xe: ' + error.message
    });
  }
};

module.exports = {
  checkInTicket,
  getTicketByQr,
  getTicketsByTrip
};
