const jwt = require('jsonwebtoken');

// Middleware xác thực mã JWT Token từ Authorization Header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Định dạng: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập!'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!'
      });
    }

    // Gán dữ liệu người dùng giải mã được vào request (id, email, role, membershipTier)
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};
