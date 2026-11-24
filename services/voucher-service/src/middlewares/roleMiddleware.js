const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này!'
      });
    }

    const userRole = String(req.user.role).toUpperCase();
    const upperAllowed = allowedRoles.map(r => String(r).toUpperCase());

    if (!upperAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Chức năng yêu cầu quyền: [${allowedRoles.join(', ')}]. Bạn đang là ${req.user.role}.`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
