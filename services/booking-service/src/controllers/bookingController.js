const pool = require('../config/db');

// 1. Giữ chỗ tạm thời trong 10 phút (Seat Lock)
const holdSeats = async (req, res) => {
  const { trip_id, seat_codes, session_id } = req.body;

  if (!trip_id || !Array.isArray(seat_codes) || seat_codes.length === 0 || !session_id) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp trip_id, danh sách seat_codes và session_id!'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Dọn dẹp các ghế đã hết hạn khóa
    await connection.execute('DELETE FROM seat_locks WHERE expires_at < NOW()');

    // 2. Kiểm tra xem các ghế này đã được xuất vé và thanh toán chưa
    const placeholders = seat_codes.map(() => '?').join(',');
    const [bookedSeats] = await connection.query(
      `SELECT t.seat_code 
       FROM tickets t 
       JOIN bookings b ON t.booking_id = b.id 
       WHERE t.trip_id = ? AND t.seat_code IN (${placeholders}) AND b.status != 'CANCELLED'`,
      [trip_id, ...seat_codes]
    );

    if (bookedSeats.length > 0) {
      await connection.rollback();
      const bookedList = bookedSeats.map(s => s.seat_code).join(', ');
      return res.status(409).json({
        success: false,
        message: `Ghế [${bookedList}] đã được khách hàng khác đặt mua thành công. Vui lòng chọn ghế khác!`
      });
    }

    // 3. Kiểm tra xem có ai khác đang khóa ghế này không
    const [lockedSeats] = await connection.query(
      `SELECT seat_code, session_id 
       FROM seat_locks 
       WHERE trip_id = ? AND seat_code IN (${placeholders}) AND session_id != ? AND expires_at > NOW()`,
      [trip_id, ...seat_codes, session_id]
    );

    if (lockedSeats.length > 0) {
      await connection.rollback();
      const lockedList = lockedSeats.map(s => s.seat_code).join(', ');
      return res.status(409).json({
        success: false,
        message: `Ghế [${lockedList}] đang được người khác giữ chỗ trong 10 phút. Vui lòng chọn ghế khác!`
      });
    }

    // 4. Tạo hoặc gia hạn khóa ghế (10 phút)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    for (const seat of seat_codes) {
      await connection.query(
        `INSERT INTO seat_locks (trip_id, seat_code, session_id, expires_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), expires_at = VALUES(expires_at)`,
        [trip_id, seat, session_id, expiresAt]
      );
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Đã giữ chỗ ${seat_codes.length} ghế thành công trong 10 phút!`,
      data: {
        trip_id,
        locked_seats: seat_codes,
        session_id,
        expires_at: expiresAt
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi giữ chỗ ghế:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi giữ chỗ: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 2. Hủy giữ chỗ ghế
const releaseSeats = async (req, res) => {
  const { trip_id, seat_codes, session_id } = req.body;

  if (!trip_id || !Array.isArray(seat_codes) || seat_codes.length === 0 || !session_id) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp trip_id, danh sách seat_codes và session_id!'
    });
  }

  try {
    const placeholders = seat_codes.map(() => '?').join(',');
    await pool.query(
      `DELETE FROM seat_locks 
       WHERE trip_id = ? AND session_id = ? AND seat_code IN (${placeholders})`,
      [trip_id, session_id, ...seat_codes]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã giải phóng ghế giữ chỗ thành công!'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy giữ chỗ: ' + error.message
    });
  }
};

// 3. Tạo đơn đặt vé mới (Booking & Xuất vé QR)
const createBooking = async (req, res) => {
  const {
    trip_id,
    customer_name,
    customer_phone,
    customer_email,
    seats,
    session_id
  } = req.body;

  if (!trip_id || !customer_name || !customer_phone || !customer_email || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ thông tin khách hàng, chuyến xe và danh sách ghế!'
    });
  }

  const userId = req.user ? req.user.id : null;
  const seatCodes = seats.map(s => s.seat_code);
  const totalAmount = seats.reduce((sum, s) => sum + Number(s.ticket_price || 0), 0);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Dọn dẹp seat locks hết hạn
    await connection.execute('DELETE FROM seat_locks WHERE expires_at < NOW()');

    // Kiểm tra trùng vé
    const placeholders = seatCodes.map(() => '?').join(',');
    const [alreadyBooked] = await connection.query(
      `SELECT t.seat_code 
       FROM tickets t 
       JOIN bookings b ON t.booking_id = b.id 
       WHERE t.trip_id = ? AND t.seat_code IN (${placeholders}) AND b.status != 'CANCELLED'`,
      [trip_id, ...seatCodes]
    );

    if (alreadyBooked.length > 0) {
      await connection.rollback();
      const bookedNames = alreadyBooked.map(s => s.seat_code).join(', ');
      return res.status(409).json({
        success: false,
        message: `Ghế [${bookedNames}] vừa có người khác đặt xong. Vui lòng chọn ghế khác!`
      });
    }

    // Tạo mã đơn ngẫu nhiên: BK + YYYYMMDD + 4 số ngẫu nhiên
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `BK${dateStr}-${randomSuffix}`;

    // Thời hạn cho phép hủy/hoàn vé sau thanh toán (mặc định 15 phút, có thể cấu hình qua REFUND_WINDOW_MINUTES)
    const refundWindowMinutes = Number(process.env.REFUND_WINDOW_MINUTES) || 15;
    const refundableUntil = new Date(Date.now() + refundWindowMinutes * 60 * 1000);

    // Lưu đơn đặt vé
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings 
       (booking_code, user_id, customer_name, customer_phone, customer_email, trip_id, total_seats, total_amount, status, refundable_until, points_awarded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, FALSE)`,
      [bookingCode, userId, customer_name, customer_phone, customer_email, trip_id, seats.length, totalAmount, refundableUntil]
    );

    const bookingId = bookingResult.insertId;
    const generatedTickets = [];

    // Tạo vé và QR code cho từng ghế
    for (const seat of seats) {
      const qrCode = `QR-TRIP${trip_id}-${seat.seat_code}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const passengerName = seat.passenger_name || customer_name;
      const ticketPrice = Number(seat.ticket_price || 0);

      const [ticketResult] = await connection.execute(
        `INSERT INTO tickets 
         (booking_id, trip_id, seat_code, passenger_name, ticket_price, qr_code, check_in_status)
         VALUES (?, ?, ?, ?, ?, ?, 'UNCHECKED')`,
        [bookingId, trip_id, seat.seat_code, passengerName, ticketPrice, qrCode]
      );

      generatedTickets.push({
        id: ticketResult.insertId,
        booking_id: bookingId,
        seat_code: seat.seat_code,
        passenger_name: passengerName,
        ticket_price: ticketPrice,
        qr_code: qrCode,
        check_in_status: 'UNCHECKED'
      });
    }

    // Xóa khóa ghế sau khi đặt thành công
    if (session_id) {
      await connection.query(
        `DELETE FROM seat_locks WHERE trip_id = ? AND session_id = ? AND seat_code IN (${placeholders})`,
        [trip_id, session_id, ...seatCodes]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công! Mã đơn hàng: ' + bookingCode,
      data: {
        id: bookingId,
        booking_code: bookingCode,
        user_id: userId,
        customer_name,
        customer_phone,
        customer_email,
        trip_id,
        total_seats: seats.length,
        total_amount: totalAmount,
        status: 'CONFIRMED',
        refundable_until: refundableUntil,
        points_awarded: false,
        tickets: generatedTickets
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi tạo đơn đặt vé:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt vé: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 4. Lấy danh sách vé của tôi (Khách hàng đã đăng nhập hoặc tìm theo mã/SĐT)
const getMyBookings = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { phone, email, booking_code } = req.query;

  try {
    let whereClause = '';
    const params = [];

    if (userId) {
      whereClause = 'WHERE b.user_id = ?';
      params.push(userId);
    } else if (booking_code) {
      whereClause = 'WHERE b.booking_code = ?';
      params.push(booking_code);
    } else if (phone) {
      whereClause = 'WHERE b.customer_phone = ?';
      params.push(phone);
    } else if (email) {
      whereClause = 'WHERE b.customer_email = ?';
      params.push(email);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng đăng nhập hoặc cung cấp booking_code, phone hoặc email để tra cứu vé!'
      });
    }

    const [bookings] = await pool.query(
      `SELECT b.* 
       FROM bookings b 
       ${whereClause} 
       ORDER BY b.created_at DESC`,
      params
    );

    if (bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không tìm thấy đơn đặt vé nào.',
        data: []
      });
    }

    // Lấy chi tiết vé cho từng đơn
    const bookingIds = bookings.map(b => b.id);
    const placeholders = bookingIds.map(() => '?').join(',');
    const [tickets] = await pool.query(
      `SELECT t.* 
       FROM tickets t 
       WHERE t.booking_id IN (${placeholders})`,
      bookingIds
    );

    // Ghép vé vào từng đơn đặt
    const results = bookings.map(b => ({
      ...b,
      tickets: tickets.filter(t => t.booking_id === b.id)
    }));

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu danh sách vé: ' + error.message
    });
  }
};

// 5. Chi tiết 1 đơn đặt vé theo mã code hoặc id
const getBookingDetail = async (req, res) => {
  const { idOrCode } = req.params;

  try {
    const isNumeric = /^\d+$/.test(idOrCode);
    const query = isNumeric
      ? 'SELECT * FROM bookings WHERE id = ?'
      : 'SELECT * FROM bookings WHERE booking_code = ?';

    const [bookings] = await pool.execute(query, [idOrCode]);
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn đặt vé!'
      });
    }

    const booking = bookings[0];
    const [tickets] = await pool.execute(
      'SELECT * FROM tickets WHERE booking_id = ?',
      [booking.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...booking,
        tickets
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết đơn vé: ' + error.message
    });
  }
};

// 6. Hủy vé & Chính sách hoàn tiền
const cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé cần hủy!'
      });
    }

    const booking = bookings[0];
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt vé này đã được hủy trước đó!'
      });
    }

    // Kiểm tra thời hạn được phép hủy/hoàn vé
    if (booking.refundable_until && new Date() > new Date(booking.refundable_until)) {
      return res.status(400).json({
        success: false,
        message: 'Đã hết thời hạn hoàn/hủy vé! Đơn vé này đã được chốt và tự động cộng điểm hội viên.'
      });
    }

    // Kiểm tra quyền hủy: Phải là chủ đơn vé hoặc Admin
    if (req.user && req.user.role !== 'Admin' && booking.user_id && booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn đặt vé của người khác!'
      });
    }

    // Chính sách hoàn tiền mẫu:
    // Hoàn 100% nếu hủy trước, tính toán giá trị hoàn
    const refundRate = 1.0; // 100%
    const refundAmount = Number(booking.total_amount) * refundRate;

    await pool.execute(
      'UPDATE bookings SET status = "CANCELLED", updated_at = NOW() WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Hủy vé thành công theo chính sách hoàn tiền 100%!',
      data: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        status: 'CANCELLED',
        original_amount: booking.total_amount,
        refund_rate: '100%',
        refund_amount: refundAmount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn đặt vé: ' + error.message
    });
  }
};

// 7. Lấy danh sách ghế đã bán hoặc đang được giữ chỗ theo trip_id (Dùng cho trip-service đồng bộ sơ đồ ghế)
const getOccupiedSeatsByTrip = async (req, res) => {
  const { tripId } = req.params;

  try {
    await pool.execute('DELETE FROM seat_locks WHERE expires_at < NOW()');

    const [bookedRows] = await pool.query(
      `SELECT DISTINCT t.seat_code
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       WHERE t.trip_id = ? AND b.status != 'CANCELLED'`,
      [tripId]
    );

    const [lockedRows] = await pool.query(
      `SELECT DISTINCT seat_code
       FROM seat_locks
       WHERE trip_id = ? AND expires_at > NOW()`,
      [tripId]
    );

    const bookedSeats = bookedRows.map(r => r.seat_code);
    const lockedSeats = lockedRows.map(r => r.seat_code);
    const occupiedSeats = Array.from(new Set([...bookedSeats, ...lockedSeats]));

    return res.status(200).json({
      success: true,
      data: {
        trip_id: Number(tripId),
        booked_seats: bookedSeats,
        locked_seats: lockedSeats,
        occupied_seats: occupiedSeats
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ghế đã chiếm: ' + error.message
    });
  }
};

module.exports = {
  holdSeats,
  releaseSeats,
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  getOccupiedSeatsByTrip
};
