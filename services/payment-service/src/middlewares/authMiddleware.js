const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập!'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn!'
    });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#');
      req.user = decoded;
    } catch (e) {
      // Ignored for optional
    }
  }
  next();
};

const internalOrAdminMiddleware = (req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_SERVICE_KEY || 'EcoBusInternalServiceSecret2026!@#';
  if (internalKey && internalKey === expectedKey) {
    req.isInternal = true;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập! Yêu cầu xác thực Admin hoặc Internal Service.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'EcoBusSuperSecretKey2026ServiceOrientedArch!@#');
    if (String(decoded.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ quản trị viên (ADMIN) mới có quyền thực hiện thao tác này!'
      });
    }
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn!'
    });
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware, internalOrAdminMiddleware };
