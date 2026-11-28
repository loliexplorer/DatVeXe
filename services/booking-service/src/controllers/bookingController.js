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

// 3. Tạo đơn đặt vé mới (Booking ở trạng thái PENDING & Server tự tính giá thật từ trip-service + voucher-service)
const createBooking = async (req, res) => {
  const {
    trip_id,
    customer_name,
    customer_phone,
    customer_email,
    seats,
    session_id,
    voucher_code
  } = req.body;

  if (!trip_id || !customer_name || !customer_phone || !customer_email || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ thông tin khách hàng, chuyến xe và danh sách ghế!'
    });
  }

  const userId = req.user ? req.user.id : null;
  const seatCodes = seats.map(s => s.seat_code);

  // 3.1. Lấy giá vé gốc thực tế từ trip-service (KHÔNG tin ticket_price gửi từ client)
  const tripServiceUrl = process.env.TRIP_SERVICE_URL || 'http://localhost:5002';
  let realUnitPrice = 0;
  let routeLabel = '';
  try {
    const tripResp = await fetch(`${tripServiceUrl}/api/trips/${trip_id}`);
    if (!tripResp.ok) {
      return res.status(tripResp.status === 404 ? 404 : 502).json({
        success: false,
        message: tripResp.status === 404 ? 'Chuyến xe không tồn tại trên hệ thống!' : 'Không thể xác thực giá vé từ trip-service!'
      });
    }
    const tripJson = await tripResp.json();
    const tripData = tripJson?.data;
    realUnitPrice = Number(tripData?.price || 0);
    routeLabel = `${tripData?.origin_city || ''} - ${tripData?.destination_city || ''} ${tripData?.dest_station || ''}`.trim();
    if (!realUnitPrice || realUnitPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá vé chuyến xe không hợp lệ!'
      });
    }
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: 'Không thể kết nối trip-service để xác thực giá vé: ' + err.message
    });
  }

  const rawTotalAmount = realUnitPrice * seats.length;
  let totalAmount = rawTotalAmount;
  let discountAmount = 0;

  // 3.2. Nếu có mã giảm giá -> xác thực mức giảm thật qua voucher-service
  if (voucher_code && String(voucher_code).trim() !== '') {
    const voucherServiceUrl = process.env.VOUCHER_SERVICE_URL || 'http://localhost:5006';
    try {
      const vResp = await fetch(`${voucherServiceUrl}/api/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: String(voucher_code).trim().toUpperCase(),
          order_amount: rawTotalAmount,
          route_name: routeLabel
        })
      });
      const vJson = await vResp.json().catch(() => ({}));
      if (!vResp.ok || !vJson.success) {
        return res.status(vResp.status || 400).json({
          success: false,
          message: vJson.message || 'Mã giảm giá không hợp lệ!'
        });
      }
      discountAmount = Number(vJson.data?.discount_amount || 0);
      totalAmount = Number(vJson.data?.final_amount ?? Math.max(0, rawTotalAmount - discountAmount));
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Không thể kết nối voucher-service để xác thực mã giảm giá!'
      });
    }
  }

  const verifiedSeatPrice = Math.round(totalAmount / seats.length);

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

    // Kiểm tra ghế đang bị phiên khác giữ chỗ (chỉ phiên đã hold-seats mới được đặt)
    const [lockedByOthers] = await connection.query(
      `SELECT seat_code
       FROM seat_locks
       WHERE trip_id = ? AND seat_code IN (${placeholders}) AND expires_at > NOW()
         AND (? IS NULL OR session_id != ?)`,
      [trip_id, ...seatCodes, session_id || null, session_id || null]
    );

    if (lockedByOthers.length > 0) {
      await connection.rollback();
      const lockedNames = lockedByOthers.map(s => s.seat_code).join(', ');
      return res.status(409).json({
        success: false,
        message: `Ghế [${lockedNames}] đang được người khác giữ chỗ. Vui lòng chọn ghế khác!`
      });
    }

    // Tạo mã đơn ngẫu nhiên: BK + YYYYMMDD + 4 số ngẫu nhiên
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `BK${dateStr}-${randomSuffix}`;

    // Lưu đơn đặt vé ở trạng thái PENDING (chờ payment-service webhook xác nhận sang CONFIRMED)
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings 
       (booking_code, user_id, customer_name, customer_phone, customer_email, trip_id, total_seats, total_amount, status, refundable_until, points_awarded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, FALSE)`,
      [bookingCode, userId, customer_name, customer_phone, customer_email, trip_id, seats.length, totalAmount]
    );

    const bookingId = bookingResult.insertId;
    const generatedTickets = [];

    // Tạo vé và QR code cho từng ghế với đơn giá đã xác thực trên Server
    for (const seat of seats) {
      const qrCode = `QR-TRIP${trip_id}-${seat.seat_code}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const passengerName = seat.passenger_name || customer_name;

      const [ticketResult] = await connection.execute(
        `INSERT INTO tickets 
         (booking_id, trip_id, seat_code, passenger_name, ticket_price, qr_code, check_in_status, seat_active)
         VALUES (?, ?, ?, ?, ?, ?, 'UNCHECKED', 1)`,
        [bookingId, trip_id, seat.seat_code, passengerName, verifiedSeatPrice, qrCode]
      );

      generatedTickets.push({
        id: ticketResult.insertId,
        booking_id: bookingId,
        seat_code: seat.seat_code,
        passenger_name: passengerName,
        ticket_price: verifiedSeatPrice,
        qr_code: qrCode,
        check_in_status: 'UNCHECKED'
      });
    }

    // Xóa khóa ghế sau khi tạo đơn
    if (session_id) {
      await connection.query(
        `DELETE FROM seat_locks WHERE trip_id = ? AND session_id = ? AND seat_code IN (${placeholders})`,
        [trip_id, session_id, ...seatCodes]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn đặt vé thành công (Chờ thanh toán)! Mã đơn: ' + bookingCode,
      data: {
        id: bookingId,
        booking_code: bookingCode,
        user_id: userId,
        customer_name,
        customer_phone,
        customer_email,
        trip_id,
        total_seats: seats.length,
        original_amount: rawTotalAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'PENDING',
        refundable_until: null,
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [bookings] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [id]);
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé cần hủy!'
      });
    }

    const booking = bookings[0];
    if (booking.status === 'CANCELLED') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt vé này đã được hủy trước đó!'
      });
    }

    // Kiểm tra thời hạn được phép hủy/hoàn vé
    if (booking.refundable_until && new Date() > new Date(booking.refundable_until)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đã hết thời hạn hoàn/hủy vé! Đơn vé này đã được chốt và tự động cộng điểm hội viên.'
      });
    }

    // Kiểm tra quyền hủy: Đơn của thành viên chỉ được hủy bởi chính chủ hoặc Admin (không phân biệt hoa/thường)
    if (booking.user_id !== null && booking.user_id !== undefined) {
      if (!req.user) {
        await connection.rollback();
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để hủy đơn đặt vé của thành viên!'
        });
      }
      const isAdmin = String(req.user.role || '').toUpperCase() === 'ADMIN';
      if (!isAdmin && Number(booking.user_id) !== Number(req.user.id)) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền hủy đơn đặt vé của người khác!'
        });
      }
    }

    // Chính sách hoàn tiền mẫu:
    // Hoàn 100% nếu hủy trong thời hạn cho phép
    const refundRate = 1.0; // 100%
    const refundAmount = Number(booking.total_amount) * refundRate;

    await connection.execute(
      'UPDATE bookings SET status = "CANCELLED", updated_at = NOW() WHERE id = ?',
      [id]
    );
    // Giải phóng ghế để khách khác có thể đặt lại trong cùng transaction (vẫn giữ lịch sử vé)
    await connection.execute(
      'UPDATE tickets SET seat_active = NULL WHERE booking_id = ?',
      [id]
    );

    await connection.commit();

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
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn đặt vé: ' + error.message
    });
  } finally {
    connection.release();
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

// 8. (Nội bộ từ payment-service) Xác nhận đơn vé từ PENDING -> CONFIRMED và kích hoạt thời hạn hoàn vé
const confirmBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé cần xác nhận!'
      });
    }

    const booking = bookings[0];
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xác nhận đơn vé đã bị hủy!'
      });
    }

    const refundWindowMinutes = Number(process.env.REFUND_WINDOW_MINUTES) || 15;
    const refundableUntil = booking.refundable_until
      ? new Date(booking.refundable_until)
      : new Date(Date.now() + refundWindowMinutes * 60 * 1000);

    await pool.execute(
      'UPDATE bookings SET status = "CONFIRMED", refundable_until = ?, updated_at = NOW() WHERE id = ?',
      [refundableUntil, id]
    );

    return res.status(200).json({
      success: true,
      message: `Đã xác nhận thanh toán cho đơn vé ${booking.booking_code} (CONFIRMED)!`,
      data: {
        id: booking.id,
        booking_code: booking.booking_code,
        status: 'CONFIRMED',
        refundable_until: refundableUntil
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác nhận đơn vé: ' + error.message
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
  getOccupiedSeatsByTrip,
  confirmBooking
};
