// Middleware phân quyền dựa trên vai trò (Role-Based Access Control - RBAC)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này!'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const hasRole = allowedRoles.map(r => r.toUpperCase()).includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Quyền truy cập bị từ chối! Tính năng này yêu cầu vai trò: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
