const pool = require('../config/db');

/**
 * Helper kiểm tra điều kiện áp dụng mã & tính số tiền giảm
 */
function evaluateVoucher(voucher, orderAmount, routeName = '') {
  const now = new Date();
  const amount = Number(orderAmount);

  if (!voucher.is_active) {
    return { valid: false, status: 400, message: 'Mã giảm giá này đã tạm ngưng hoạt động!' };
  }
  if (now < new Date(voucher.start_date)) {
    return { valid: false, status: 400, message: 'Mã giảm giá chưa đến thời gian áp dụng!' };
  }
  if (now > new Date(voucher.end_date)) {
    return { valid: false, status: 400, message: 'Mã giảm giá đã hết hạn sử dụng!' };
  }
  if (voucher.used_count >= voucher.usage_limit) {
    return { valid: false, status: 400, message: 'Mã giảm giá đã hết lượt sử dụng!' };
  }
  if (amount < Number(voucher.min_order_amount)) {
    return {
      valid: false,
      status: 400,
      message: `Đơn hàng tối thiểu ${Number(voucher.min_order_amount).toLocaleString('vi-VN')} VNĐ mới áp dụng được mã này!`
    };
  }
  if (voucher.route_filter && voucher.route_filter.trim() !== '') {
    const normalizedRoute = String(routeName || '').toLowerCase();
    const filter = voucher.route_filter.trim().toLowerCase();
    if (!normalizedRoute.includes(filter)) {
      return {
        valid: false,
        status: 400,
        message: `Mã này chỉ áp dụng cho tuyến đường có điểm "${voucher.route_filter}"!`
      };
    }
  }

  let discountAmount = 0;
  if (voucher.discount_type === 'PERCENT') {
    discountAmount = (amount * Number(voucher.discount_value)) / 100;
    if (voucher.max_discount_amount && discountAmount > Number(voucher.max_discount_amount)) {
      discountAmount = Number(voucher.max_discount_amount);
    }
  } else {
    discountAmount = Number(voucher.discount_value);
  }

  // Không giảm vượt quá giá trị đơn hàng
  discountAmount = Math.min(discountAmount, amount);
  const finalAmount = Math.max(0, amount - discountAmount);

  return {
    valid: true,
    discount_amount: Math.round(discountAmount),
    original_amount: amount,
    final_amount: Math.round(finalAmount)
  };
}

// 1. Lấy danh sách mã giảm giá đang khả dụng
const getAvailableVouchers = async (req, res) => {
  const { route } = req.query;

  try {
    let query = `
      SELECT id, code, title, description, discount_type, discount_value,
             max_discount_amount, min_order_amount, route_filter,
             usage_limit, used_count, start_date, end_date
      FROM vouchers
      WHERE is_active = TRUE
        AND start_date <= NOW()
        AND end_date >= NOW()
        AND used_count < usage_limit
    `;
    const params = [];

    if (route) {
      query += ` AND (route_filter IS NULL OR route_filter = '' OR LOWER(?) LIKE CONCAT('%', LOWER(route_filter), '%'))`;
      params.push(route);
    }

    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách voucher: ' + error.message
    });
  }
};

// 2. Kiểm tra & tính thử số tiền giảm của mã
const validateVoucher = async (req, res) => {
  const { code, order_amount, route_name } = req.body;

  if (!code || order_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã code và order_amount!'
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vouchers WHERE code = ?',
      [String(code).trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại trên hệ thống!'
      });
    }

    const voucher = rows[0];
    const check = evaluateVoucher(voucher, order_amount, route_name);

    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        message: check.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Áp dụng thử mã ${voucher.code} hợp lệ! Giảm ${check.discount_amount.toLocaleString('vi-VN')} VNĐ.`,
      data: {
        voucher_id: voucher.id,
        code: voucher.code,
        title: voucher.title,
        original_amount: check.original_amount,
        discount_amount: check.discount_amount,
        final_amount: check.final_amount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra voucher: ' + error.message
    });
  }
};

// 3. Áp dụng mã giảm giá vào đơn đặt vé (Ghi nhận lượt dùng bằng Transaction)
const applyVoucher = async (req, res) => {
  const { code, booking_code, order_amount, route_name } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!code || !booking_code || order_amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp code, booking_code và order_amount!'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalizedCode = String(code).trim().toUpperCase();
    const [rows] = await connection.execute(
      'SELECT * FROM vouchers WHERE code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại!'
      });
    }

    const voucher = rows[0];
    const check = evaluateVoucher(voucher, order_amount, route_name);

    if (!check.valid) {
      await connection.rollback();
      return res.status(check.status).json({
        success: false,
        message: check.message
      });
    }

    // Kiểm tra đơn này đã dùng mã này chưa
    const [existingUsage] = await connection.execute(
      'SELECT id FROM voucher_usages WHERE voucher_id = ? AND booking_code = ?',
      [voucher.id, booking_code]
    );

    if (existingUsage.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Đơn vé ${booking_code} đã áp dụng mã ${voucher.code} trước đó rồi!`
      });
    }

    // Ghi lịch sử sử dụng & tăng used_count
    await connection.execute(
      `INSERT INTO voucher_usages (voucher_id, user_id, booking_code, discount_amount)
       VALUES (?, ?, ?, ?)`,
      [voucher.id, userId, booking_code, check.discount_amount]
    );

    await connection.execute(
      'UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?',
      [voucher.id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Đã áp dụng mã ${voucher.code} cho đơn ${booking_code}!`,
      data: {
        voucher_id: voucher.id,
        code: voucher.code,
        booking_code,
        original_amount: check.original_amount,
        discount_amount: check.discount_amount,
        final_amount: check.final_amount
      }
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi áp dụng voucher: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// 4. Đổi điểm thưởng hội viên thành Voucher cá nhân (1.000 điểm = 50.000đ)
const redeemPointsToVoucher = async (req, res) => {
  const { points_to_redeem } = req.body;
  const userId = req.user.id;

  const points = Number(points_to_redeem);
  if (!points || points < 500) {
    return res.status(400).json({
      success: false,
      message: 'Số điểm quy đổi tối thiểu là 500 điểm (tương đương 25.000 VNĐ)!'
    });
  }

  // Tỷ lệ quy đổi: 1 điểm = 50 VNĐ
  const discountValue = points * 50;
  const generatedCode = `VIP${userId}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Hạn 30 ngày

  try {
    const [result] = await pool.execute(
      `INSERT INTO vouchers
       (code, title, description, discount_type, discount_value, min_order_amount, usage_limit, start_date, end_date, is_active)
       VALUES (?, ?, ?, 'FIXED', ?, 0, 1, ?, ?, TRUE)`,
      [
        generatedCode,
        `Voucher đổi điểm hội viên (${discountValue.toLocaleString('vi-VN')}đ)`,
        `Mã giảm giá cá nhân được quy đổi từ ${points} điểm thưởng (User #${userId})`,
        discountValue,
        startDate,
        endDate
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Quy đổi thành công ${points} điểm thành mã giảm giá ${generatedCode} trị giá ${discountValue.toLocaleString('vi-VN')} VNĐ!`,
      data: {
        voucher_id: result.insertId,
        code: generatedCode,
        discount_value: discountValue,
        points_used: points,
        expires_at: endDate
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi điểm lấy voucher: ' + error.message
    });
  }
};

// 5. Admin tạo mã khuyến mãi mới
const createVoucher = async (req, res) => {
  const {
    code,
    title,
    description = '',
    discount_type,
    discount_value,
    max_discount_amount = null,
    min_order_amount = 0,
    route_filter = null,
    usage_limit = 100,
    start_date,
    end_date
  } = req.body;

  if (!code || !title || !discount_type || !discount_value || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đủ: code, title, discount_type, discount_value, start_date, end_date!'
    });
  }

  try {
    const normalizedCode = String(code).trim().toUpperCase();
    const [result] = await pool.execute(
      `INSERT INTO vouchers
       (code, title, description, discount_type, discount_value, max_discount_amount, min_order_amount, route_filter, usage_limit, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        normalizedCode,
        title,
        description,
        discount_type,
        discount_value,
        max_discount_amount || null,
        min_order_amount || 0,
        route_filter || null,
        usage_limit || 100,
        start_date,
        end_date
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Đã tạo mã khuyến mãi ${normalizedCode} thành công!`,
      data: { id: result.insertId, code: normalizedCode, title }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Mã voucher này đã tồn tại trên hệ thống!'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo voucher: ' + error.message
    });
  }
};

// 6. Admin vô hiệu hóa mã khuyến mãi
const deactivateVoucher = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'UPDATE vouchers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã khuyến mãi cần vô hiệu hóa!'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã vô hiệu hóa mã khuyến mãi #${id} thành công!`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi vô hiệu hóa voucher: ' + error.message
    });
  }
};

module.exports = {
  getAvailableVouchers,
  validateVoucher,
  applyVoucher,
  redeemPointsToVoucher,
  createVoucher,
  deactivateVoucher
};
