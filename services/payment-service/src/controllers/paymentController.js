const pool = require('../config/db');

// 0. Lấy thông tin ngân hàng & link VietQR động (chưa tạo giao dịch trong DB)
const getBankInfoPreview = (req, res) => {
  const { booking_code = 'ECOBUS', amount = 0 } = req.query;
  const bankCode = process.env.BANK_CODE || 'MB';
  const bankName = process.env.BANK_NAME || 'Ngân hàng Quân Đội (MBBank)';
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER || '0988776655';
  const accountName = process.env.BANK_ACCOUNT_NAME || 'CONG TY CP XE KHACH ECOBUS';
  const transferContent = `VE XE ${booking_code}`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

  return res.status(200).json({
    success: true,
    data: {
      bank_code: bankCode,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      amount: Number(amount),
      transfer_content: transferContent,
      qr_code_image_url: vietQrUrl,
      supported_qr_apps: ['MBBank', 'VPBank', 'BIDV', 'Techcombank', 'VietinBank', 'MoMo']
    }
  });
};

// 1. Khởi tạo thanh toán & Tạo mã QR VietQR / Link cổng thanh toán
const initiatePayment = async (req, res) => {
  const { booking_id, booking_code, amount, payment_method } = req.body;

  if (!booking_id || !booking_code || !amount || !payment_method) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ: booking_id, booking_code, amount, payment_method!'
    });
  }

  const validMethods = ['VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH'];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: `Phương thức thanh toán không hợp lệ. Phải là một trong: [${validMethods.join(', ')}]`
    });
  }

  try {
    // Kiểm tra xem đã có giao dịch nào cho đơn vé này chưa
    const [existing] = await pool.execute(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1',
      [booking_id]
    );

    let paymentId;
    if (existing.length > 0) {
      if (existing[0].status === 'SUCCESS') {
        return res.status(409).json({
          success: false,
          message: 'Đơn đặt vé này đã được thanh toán thành công trước đó!',
          data: existing[0]
        });
      }
      // Nếu đã có nhưng đang PENDING, cập nhật phương thức & số tiền
      paymentId = existing[0].id;
      await pool.execute(
        'UPDATE payments SET payment_method = ?, amount = ? WHERE id = ?',
        [payment_method, amount, paymentId]
      );
    } else {
      // Tạo giao dịch thanh toán mới
      const [insertResult] = await pool.execute(
        `INSERT INTO payments (booking_id, booking_code, payment_method, amount, status)
         VALUES (?, ?, ?, ?, 'PENDING')`,
        [booking_id, booking_code, payment_method, amount]
      );
      paymentId = insertResult.insertId;
    }

    // Tạo chi tiết thanh toán kèm mã QR VietQR chuẩn ngân hàng (hỗ trợ MBBank, VPBank, BIDV, Techcombank, VietinBank, MoMo)
    const bankCode = process.env.BANK_CODE || 'MB';
    const bankName = process.env.BANK_NAME || 'Ngân hàng Quân Đội (MBBank)';
    const accountNumber = process.env.BANK_ACCOUNT_NUMBER || '0988776655';
    const accountName = process.env.BANK_ACCOUNT_NAME || 'CONG TY CP XE KHACH ECOBUS';
    const transferContent = `VE XE ${booking_code}`;
    const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    let paymentDetails = {
      payment_id: paymentId,
      booking_id,
      booking_code,
      amount,
      payment_method,
      status: 'PENDING',
      supported_qr_apps: ['MBBank', 'VPBank', 'BIDV', 'Techcombank', 'VietinBank', 'MoMo']
    };

    if (payment_method === 'BANK_TRANSFER' || payment_method === 'VNPAY' || payment_method === 'MOMO') {
      paymentDetails.bank_info = {
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        amount: Number(amount),
        transfer_content: transferContent,
        qr_code_image_url: vietQrUrl
      };
      if (payment_method === 'VNPAY' || payment_method === 'MOMO') {
        paymentDetails.gateway_url = `http://localhost:5004/api/payments/mock-gateway?payment_id=${paymentId}&booking_code=${booking_code}&amount=${amount}&method=${payment_method}`;
      }
    } else if (payment_method === 'CASH') {
      paymentDetails.note = 'Quý khách vui lòng thanh toán trực tiếp tại quầy vé bến xe hoặc khi lên xe cho phụ xe.';
    }

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo thanh toán thành công!',
      data: paymentDetails
    });
  } catch (error) {
    console.error('Lỗi khi khởi tạo thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi khởi tạo thanh toán: ' + error.message
    });
  }
};

// 2. Webhook / Callback nhận kết quả thanh toán từ Ngân hàng / Cổng VNPAY / MoMo
const handleWebhook = async (req, res) => {
  const { payment_id, transaction_id, gateway_status, bank_code, amount_paid } = req.body;

  if (!payment_id || !transaction_id) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp payment_id và transaction_id!'
    });
  }

  const normalizedStatus = String(gateway_status || '').toUpperCase();
  if (!['SUCCESS', 'FAILED'].includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái gateway_status không hợp lệ! Phải là SUCCESS hoặc FAILED.'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [payments] = await connection.execute('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (payments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch thanh toán này!'
      });
    }

    const currentPayment = payments[0];
    if (currentPayment.status === 'SUCCESS') {
      await connection.rollback();
      return res.status(200).json({
        success: true,
        message: 'Giao dịch này đã được xác nhận thanh toán thành công trước đó.',
        data: currentPayment
      });
    }

    const newStatus = normalizedStatus;

    // Cập nhật trạng thái thanh toán
    await connection.execute(
      `UPDATE payments 
       SET status = ?, transaction_id = ?, paid_at = NOW() 
       WHERE id = ?`,
      [newStatus, transaction_id, payment_id]
    );

    // Ghi log đối soát vào payment_logs
    const logPayload = JSON.stringify({
      received_at: new Date().toISOString(),
      bank_code: bank_code || 'MBBANK',
      amount_paid: amount_paid || currentPayment.amount,
      raw_body: req.body
    });

    await connection.execute(
      'INSERT INTO payment_logs (payment_id, gateway_response) VALUES (?, ?)',
      [payment_id, logPayload]
    );

    await connection.commit();

    // Nếu thanh toán thành công -> tự động gọi nội bộ sang booking-service chuyển đơn PENDING -> CONFIRMED
    let bookingConfirmed = false;
    if (newStatus === 'SUCCESS' && currentPayment.booking_id) {
      const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:5003';
      try {
        const confirmResp = await fetch(`${bookingServiceUrl}/api/bookings/${currentPayment.booking_id}/confirm`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_SERVICE_KEY || 'EcoBusInternalServiceSecret2026!@#'
          }
        });
        bookingConfirmed = confirmResp.ok;
      } catch (err) {
        console.warn(`⚠️ [payment-service] Could not auto-confirm booking #${currentPayment.booking_id}:`, err.message);
      }
    }

    const [updated] = await pool.execute('SELECT * FROM payments WHERE id = ?', [payment_id]);
    return res.status(200).json({
      success: true,
      message: 'Xử lý Webhook thanh toán thành công! Trạng thái: ' + newStatus,
      booking_confirmed: bookingConfirmed,
      data: updated[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi xử lý webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý webhook: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 3. Tra cứu chi tiết giao dịch thanh toán
const getPaymentDetail = async (req, res) => {
  const { idOrBookingCode } = req.params;

  try {
    const isNumeric = /^\d+$/.test(idOrBookingCode);
    const query = isNumeric
      ? 'SELECT * FROM payments WHERE id = ?'
      : 'SELECT * FROM payments WHERE booking_code = ?';

    const [payments] = await pool.execute(query, [idOrBookingCode]);
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch thanh toán tương ứng!'
      });
    }

    return res.status(200).json({
      success: true,
      data: payments[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tra cứu giao dịch: ' + error.message
    });
  }
};

// 4. Hoàn tiền giao dịch
const refundPayment = async (req, res) => {
  const { payment_id, refund_amount, reason } = req.body;

  if (!payment_id || !refund_amount) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp payment_id và refund_amount!'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [payments] = await connection.execute('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (payments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin giao dịch cần hoàn tiền!'
      });
    }

    const payment = payments[0];
    if (payment.status !== 'SUCCESS') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Chỉ hoàn tiền được cho giao dịch có trạng thái SUCCESS (Hiện tại: ${payment.status})`
      });
    }

    await connection.execute(
      'UPDATE payments SET status = "REFUNDED" WHERE id = ?',
      [payment_id]
    );

    const logPayload = JSON.stringify({
      action: 'REFUND',
      refund_amount: Number(refund_amount),
      reason: reason || 'Hoàn tiền theo yêu cầu hủy vé của khách hàng',
      refunded_at: new Date().toISOString()
    });

    await connection.execute(
      'INSERT INTO payment_logs (payment_id, gateway_response) VALUES (?, ?)',
      [payment_id, logPayload]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Đã hoàn tiền ${Number(refund_amount).toLocaleString('vi-VN')} VNĐ thành công!`,
      data: {
        payment_id,
        booking_code: payment.booking_code,
        status: 'REFUNDED',
        refund_amount: Number(refund_amount),
        reason
      }
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi hoàn tiền: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 5. Xem lịch sử log phản hồi của cổng thanh toán
const getPaymentLogs = async (req, res) => {
  const { id } = req.params;

  try {
    const [logs] = await pool.execute(
      'SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY id DESC',
      [id]
    );

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy log thanh toán: ' + error.message
    });
  }
};

module.exports = {
  getBankInfoPreview,
  initiatePayment,
  handleWebhook,
  getPaymentDetail,
  refundPayment,
  getPaymentLogs
};
