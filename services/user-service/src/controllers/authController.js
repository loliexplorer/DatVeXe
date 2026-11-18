const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Hàm sinh JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role_name || user.role,
      membershipTier: user.membership_tier
    },
    process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// 1. [POST] /api/auth/register - Đăng ký tài khoản khách hàng mới
async function register(req, res) {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: Họ tên, Email, Số điện thoại và Mật khẩu!'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự!'
      });
    }

    // Kiểm tra xem email hoặc sđt đã tồn tại trong CSDL chưa
    const [existingUsers] = await pool.query(
      'SELECT id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1',
      [email.toLowerCase().trim(), phone.trim()]
    );

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      const conflictField = existing.email === email.toLowerCase().trim() ? 'Địa chỉ email' : 'Số điện thoại';
      return res.status(409).json({
        success: false,
        message: `${conflictField} này đã được đăng ký trên hệ thống!`
      });
    }

    // Băm mật khẩu bằng Bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Mặc định đăng ký mới là CUSTOMER (role_id = 2), Hạng BRONZE, tặng 500 điểm chào mừng
    const defaultRoleId = 2; // 2 = CUSTOMER
    const defaultTier = 'BRONZE';
    const welcomePoints = 500;

    const [insertResult] = await pool.query(
      `INSERT INTO users (role_id, full_name, email, phone, password_hash, membership_tier, loyalty_points, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [defaultRoleId, full_name.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash, defaultTier, welcomePoints]
    );

    const newUserId = insertResult.insertId;

    // Ghi nhận lịch sử tặng điểm chào mừng vào loyalty_history
    await pool.query(
      `INSERT INTO loyalty_history (user_id, points_change, action_type, description)
       VALUES (?, ?, 'WELCOME_BONUS', 'Thưởng 500 điểm chào mừng thành viên mới kích hoạt tài khoản')`,
      [newUserId, welcomePoints]
    );

    const newUserObj = {
      id: newUserId,
      role_id: defaultRoleId,
      role_name: 'CUSTOMER',
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      membership_tier: defaultTier,
      loyalty_points: welcomePoints,
      is_active: true
    };

    const token = generateToken(newUserObj);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bạn nhận được 500 điểm thưởng hội viên.',
      token,
      user: newUserObj
    });
  } catch (error) {
    console.error('Lỗi register:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký tài khoản. Vui lòng thử lại!'
    });
  }
}

// 2. [POST] /api/auth/login - Đăng nhập hệ thống (Áp dụng cho cả Khách hàng, Tài xế, Admin)
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả Email và Mật khẩu!'
      });
    }

    // Truy vấn thông tin người dùng kèm tên vai trò (Role Name)
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, r.name as role_name, u.full_name, u.email, u.phone, 
              u.password_hash, u.avatar_url, u.membership_tier, u.loyalty_points, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản Email không tồn tại trên hệ thống!'
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Quản trị viên.'
      });
    }

    // So khớp mật khẩu đã băm (Bcrypt compare)
    // Lưu ý: Nếu là tài khoản seed test mẫu có mock hash thì kiểm tra mật khẩu mặc định "Password123@"
    let isMatch = false;
    if (user.password_hash.startsWith('$2b$10$eE..mocked')) {
      isMatch = password === 'Password123@';
    } else {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.'
      });
    }

    // Nếu là tài xế, lấy thêm thông tin bằng lái xe
    let driverProfile = null;
    if (user.role_name === 'DRIVER') {
      const [driverRows] = await pool.query(
        'SELECT license_number, experience_years, status FROM driver_profiles WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      if (driverRows.length > 0) {
        driverProfile = driverRows[0];
      }
    }

    // Sinh mã JWT Token
    const token = generateToken(user);

    // Không trả về password_hash ra ngoài
    delete user.password_hash;

    return res.status(200).json({
      success: true,
      message: `Đăng nhập thành công! Xin chào ${user.full_name}`,
      token,
      user: {
        ...user,
        driver_profile: driverProfile
      }
    });
  } catch (error) {
    console.error('Lỗi login:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập. Vui lòng thử lại!'
    });
  }
}

// 3. [POST] /api/auth/forgot-password - Yêu cầu khôi phục mật khẩu
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ Email cần khôi phục!'
      });
    }

    const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với địa chỉ Email này!'
      });
    }

    // Mô phỏng tạo mã OTP / liên kết đặt lại mật khẩu gửi qua email
    return res.status(200).json({
      success: true,
      message: `Hệ thống đã gửi mã xác thực khôi phục mật khẩu đến email ${email}. Vui lòng kiểm tra hòm thư đến!`
    });
  } catch (error) {
    console.error('Lỗi forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xử lý quên mật khẩu.'
    });
  }
}

module.exports = {
  register,
  login,
  forgotPassword
};
