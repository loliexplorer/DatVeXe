const jwt = require('jsonwebtoken');

// Middleware xác thực JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
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
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn!'
      });
    }

    req.user = user;
    next();
  });
}

// Middleware tùy chọn (nếu có token thì gắn thông tin user, không có thì bỏ qua)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#', (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth
};
