const pool = require('../config/db');
const { sendEmail } = require('../config/mailer');

/**
 * Helper lưu log vào notification_db và thực hiện gửi Email
 */
async function dispatchEmailNotification({
  userId = null,
  bookingCode = null,
  recipientEmail,
  recipientPhone = null,
  type,
  subject,
  summaryText,
  htmlBody
}) {
  // 1. Tạo bản ghi PENDING trước
  const [insertResult] = await pool.execute(
    `INSERT INTO notifications
     (user_id, booking_code, recipient_email, recipient_phone, type, channel, subject, content, status)
     VALUES (?, ?, ?, ?, ?, 'EMAIL', ?, ?, 'PENDING')`,
    [userId, bookingCode, recipientEmail, recipientPhone, type, subject, summaryText]
  );
  const notificationId = insertResult.insertId;

  // 2. Gửi Email qua Nodemailer
  const mailResult = await sendEmail({
    to: recipientEmail,
    subject,
    text: summaryText,
    html: htmlBody
  });

  // 3. Cập nhật trạng thái SENT và preview_url
  await pool.execute(
    `UPDATE notifications
     SET status = 'SENT', preview_url = ?, sent_at = NOW()
     WHERE id = ?`,
    [mailResult.previewUrl || null, notificationId]
  );

  return {
    notification_id: notificationId,
    status: 'SENT',
    mode: mailResult.mode,
    message_id: mailResult.messageId,
    preview_url: mailResult.previewUrl
  };
}

// 1. Gửi Email xác nhận đặt vé kèm mã QR cho từng ghế
const sendBookingConfirmation = async (req, res) => {
  const {
    user_id = null,
    booking_code,
    customer_name,
    customer_email,
    customer_phone = null,
    route_name = 'Tuyến xe EcoBus',
    departure_time = 'Theo lịch trình vé',
    bus_plate = 'Đang cập nhật',
    total_amount = 0,
    tickets
  } = req.body;

  if (!booking_code || !customer_name || !customer_email || !Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp booking_code, customer_name, customer_email và danh sách tickets!'
    });
  }

  const ticketRowsHtml = tickets.map(t => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(t.qr_code)}`;
    return `
      <div style="border:1px dashed #cbd5e1; border-radius:10px; padding:14px; margin-bottom:12px; background:#f8fafc; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <p style="margin:0 0 6px 0; font-size:15px;"><strong>Ghế:</strong> <span style="color:#2563eb; font-weight:700;">${t.seat_code}</span></p>
          <p style="margin:0 0 6px 0; font-size:14px;"><strong>Hành khách:</strong> ${t.passenger_name || customer_name}</p>
          <p style="margin:0; font-size:12px; color:#64748b;">Mã QR: <code>${t.qr_code}</code></p>
        </div>
        <div style="text-align:center; margin-left:16px;">
          <img src="${qrUrl}" alt="QR ${t.seat_code}" width="110" height="110" style="border-radius:8px; border:1px solid #e2e8f0;" />
        </div>
      </div>
    `;
  }).join('');

  const subject = `[EcoBus] Xác nhận vé điện tử #${booking_code} (${route_name})`;
  const summaryText = `Xin chào ${customer_name}, đơn đặt vé #${booking_code} (${route_name} - ${departure_time}) gồm ${tickets.length} ghế đã được xác nhận. Tổng tiền: ${Number(total_amount).toLocaleString('vi-VN')} VNĐ.`;

  const htmlBody = `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <div style="background:#1d4ed8; color:white; padding:20px 24px;">
        <h2 style="margin:0;">🚌 VÉ XE ĐIỆN TỬ ECOBUS</h2>
        <p style="margin:6px 0 0 0; opacity:0.9;">Mã đơn đặt vé: <strong>${booking_code}</strong></p>
      </div>
      <div style="padding:24px; color:#1e293b;">
        <p>Xin chào <strong>${customer_name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt vé tại EcoBus! Dưới đây là thông tin chuyến đi và mã QR dùng để lên xe:</p>
        <div style="background:#eff6ff; padding:14px; border-radius:8px; margin:16px 0;">
          <p style="margin:4px 0;"><strong>Tuyến đường:</strong> ${route_name}</p>
          <p style="margin:4px 0;"><strong>Giờ khởi hành:</strong> ${departure_time}</p>
          <p style="margin:4px 0;"><strong>Biển số xe:</strong> ${bus_plate}</p>
          <p style="margin:4px 0;"><strong>Tổng thanh toán:</strong> <span style="color:#16a34a; font-weight:bold;">${Number(total_amount).toLocaleString('vi-VN')} VNĐ</span></p>
        </div>
        <h3 style="margin:20px 0 12px 0;">🎫 Chi tiết vé & Mã QR Check-in</h3>
        ${ticketRowsHtml}
        <p style="font-size:13px; color:#64748b; margin-top:20px;">Vui lòng có mặt tại bến xe trước giờ khởi hành 30 phút và đưa mã QR này cho tài xế/phụ xe quét khi lên xe.</p>
      </div>
    </div>
  `;

  try {
    const result = await dispatchEmailNotification({
      userId: user_id,
      bookingCode: booking_code,
      recipientEmail: customer_email,
      recipientPhone: customer_phone,
      type: 'BOOKING_CONFIRM',
      subject,
      summaryText,
      htmlBody
    });

    return res.status(201).json({
      success: true,
      message: 'Đã gửi Email xác nhận vé điện tử kèm mã QR thành công!',
      data: result
    });
  } catch (error) {
    console.error('Lỗi gửi email xác nhận vé:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi thông báo xác nhận vé: ' + error.message
    });
  }
};

// 2. Gửi Email thông báo hủy vé & hoàn tiền
const sendRefundNotice = async (req, res) => {
  const {
    user_id = null,
    booking_code,
    customer_name,
    customer_email,
    refund_amount,
    reason = 'Theo yêu cầu hủy vé từ khách hàng'
  } = req.body;

  if (!booking_code || !customer_name || !customer_email || refund_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp booking_code, customer_name, customer_email và refund_amount!'
    });
  }

  const formattedAmount = Number(refund_amount).toLocaleString('vi-VN');
  const subject = `[EcoBus] Xác nhận hủy vé & hoàn tiền đơn #${booking_code}`;
  const summaryText = `Đơn vé #${booking_code} đã được hủy thành công. Số tiền hoàn lại: ${formattedAmount} VNĐ. Lý do: ${reason}.`;

  const htmlBody = `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <div style="background:#dc2626; color:white; padding:20px 24px;">
        <h2 style="margin:0;">💳 THÔNG BÁO HỦY VÉ & HOÀN TIỀN</h2>
        <p style="margin:6px 0 0 0; opacity:0.9;">Mã đơn vé: <strong>${booking_code}</strong></p>
      </div>
      <div style="padding:24px; color:#1e293b;">
        <p>Xin chào <strong>${customer_name}</strong>,</p>
        <p>Hệ thống xác nhận đã hủy đơn đặt vé <strong>#${booking_code}</strong> của bạn.</p>
        <div style="background:#fef2f2; border:1px solid #fecaca; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:4px 0;"><strong>Số tiền hoàn lại:</strong> <span style="color:#dc2626; font-size:18px; font-weight:bold;">${formattedAmount} VNĐ</span></p>
          <p style="margin:4px 0;"><strong>Lý do:</strong> ${reason}</p>
          <p style="margin:4px 0;"><strong>Thời gian dự kiến nhận tiền:</strong> 1 - 3 ngày làm việc qua phương thức thanh toán ban đầu.</p>
        </div>
        <p style="font-size:13px; color:#64748b;">Nếu có thắc mắc, vui lòng liên hệ tổng đài hỗ trợ EcoBus.</p>
      </div>
    </div>
  `;

  try {
    const result = await dispatchEmailNotification({
      userId: user_id,
      bookingCode: booking_code,
      recipientEmail: customer_email,
      type: 'REFUND_NOTICE',
      subject,
      summaryText,
      htmlBody
    });

    return res.status(201).json({
      success: true,
      message: 'Đã gửi Email thông báo hủy vé và hoàn tiền thành công!',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi thông báo hoàn tiền: ' + error.message
    });
  }
};

// 3. Gửi thông báo nhắc nhở trước giờ xe khởi hành
const sendTripReminder = async (req, res) => {
  const {
    user_id = null,
    booking_code,
    customer_name,
    customer_email,
    customer_phone = null,
    route_name,
    departure_time,
    pickup_station = 'Bến xe theo lịch trình',
    bus_plate = 'Đang cập nhật'
  } = req.body;

  if (!booking_code || !customer_name || !customer_email || !route_name || !departure_time) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp booking_code, customer_name, customer_email, route_name và departure_time!'
    });
  }

  const subject = `[EcoBus] Nhắc lịch khởi hành chuyến ${route_name} (#${booking_code})`;
  const summaryText = `Nhắc nhở: Chuyến ${route_name} (${departure_time}) sắp khởi hành tại ${pickup_station}. Biển số xe: ${bus_plate}.`;

  const htmlBody = `
    <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
      <div style="background:#d97706; color:white; padding:20px 24px;">
        <h2 style="margin:0;">⏰ NHẮC LỊCH XE SẮP KHỞI HÀNH</h2>
        <p style="margin:6px 0 0 0; opacity:0.9;">Mã đơn vé: <strong>${booking_code}</strong></p>
      </div>
      <div style="padding:24px; color:#1e293b;">
        <p>Xin chào <strong>${customer_name}</strong>,</p>
        <p>Chuyến xe của bạn sắp khởi hành! Vui lòng chuẩn bị hành lý và có mặt tại điểm đón trước 30 phút:</p>
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:4px 0;"><strong>Tuyến đường:</strong> ${route_name}</p>
          <p style="margin:4px 0;"><strong>Giờ xuất bến:</strong> ${departure_time}</p>
          <p style="margin:4px 0;"><strong>Điểm đón:</strong> ${pickup_station}</p>
          <p style="margin:4px 0;"><strong>Biển số xe:</strong> ${bus_plate}</p>
        </div>
        <p style="font-size:13px; color:#64748b;">Chúc bạn có một chuyến đi an toàn và thoải mái cùng EcoBus!</p>
      </div>
    </div>
  `;

  try {
    const result = await dispatchEmailNotification({
      userId: user_id,
      bookingCode: booking_code,
      recipientEmail: customer_email,
      recipientPhone: customer_phone,
      type: 'TRIP_REMINDER',
      subject,
      summaryText,
      htmlBody
    });

    return res.status(201).json({
      success: true,
      message: 'Đã gửi Email nhắc nhở khởi hành thành công!',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi nhắc nhở chuyến đi: ' + error.message
    });
  }
};

// 4. Tra cứu lịch sử thông báo đã gửi
const getNotificationHistory = async (req, res) => {
  const { booking_code, email, user_id, type } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (booking_code) {
      conditions.push('booking_code = ?');
      params.push(booking_code);
    }
    if (email) {
      conditions.push('recipient_email = ?');
      params.push(email);
    }
    if (user_id) {
      conditions.push('user_id = ?');
      params.push(Number(user_id));
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT 50`,
      params
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu lịch sử thông báo: ' + error.message
    });
  }
};

module.exports = {
  sendBookingConfirmation,
  sendRefundNotice,
  sendTripReminder,
  getNotificationHistory
};
