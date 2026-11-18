const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Các API Quản lý Hồ sơ, Điểm hội viên & Quản trị tài khoản
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Xem thông tin hồ sơ của tài khoản đang đăng nhập
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin chi tiết hồ sơ tài khoản
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.get('/profile', authenticateToken, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Hoàng Khách Hàng VIP
 *               phone:
 *                 type: string
 *                 example: 0903000001
 *               avatar_url:
 *                 type: string
 *                 example: https://api.dicebear.com/7.x/bottts/svg?seed=Hoang
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu dữ liệu cập nhật
 *       409:
 *         description: Số điện thoại bị trùng
 */
router.put('/profile', authenticateToken, userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Đổi mật khẩu tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: Password123@
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 example: NewSecretPass2026@
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ sai hoặc mật khẩu mới quá ngắn
 */
router.put('/change-password', authenticateToken, userController.changePassword);

/**
 * @swagger
 * /api/users/loyalty-history:
 *   get:
 *     summary: Lấy lịch sử tích điểm và thăng hạng hội viên của khách hàng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách biến động điểm thưởng
 */
router.get('/loyalty-history', authenticateToken, userController.getLoyaltyHistory);

/**
 * @swagger
 * /api/users/loyalty-points:
 *   post:
 *     summary: (Nội bộ/Admin) Cộng/Trừ điểm và tự động nâng hạng hội viên
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, points_change, action_type]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 4
 *               points_change:
 *                 type: integer
 *                 example: 350
 *               action_type:
 *                 type: string
 *                 enum: [WELCOME_BONUS, TRIP_REWARD, REDEEM_DISCOUNT, TIER_UPGRADE]
 *                 example: TRIP_REWARD
 *               description:
 *                 type: string
 *                 example: Tích 3% điểm sau chuyến đi Hà Nội - Sa Pa
 *     responses:
 *       200:
 *         description: Cập nhật điểm và thăng hạng thành công
 */
router.post('/loyalty-points', userController.updateLoyaltyPoints);

/**
 * @swagger
 * /api/users/admin/drivers:
 *   get:
 *     summary: (Admin) Lấy danh sách tất cả tài xế kèm số GPLX
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài xế
 *       403:
 *         description: Không có quyền ADMIN
 */
router.get('/admin/drivers', authenticateToken, authorizeRoles('ADMIN'), userController.getAllDrivers);

/**
 * @swagger
 * /api/users/admin/drivers:
 *   post:
 *     summary: (Admin) Cấp tài khoản nhân viên / tài xế mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone, password, license_number]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn Lái Xe
 *               email:
 *                 type: string
 *                 example: driver3@vexere.com
 *               phone:
 *                 type: string
 *                 example: 0902000003
 *               password:
 *                 type: string
 *                 example: DriverPass123@
 *               license_number:
 *                 type: string
 *                 example: GPLX-HN-33445
 *               experience_years:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Cấp tài khoản tài xế thành công
 *       403:
 *         description: Chỉ ADMIN mới được cấp tài khoản tài xế
 *       409:
 *         description: Email, SĐT hoặc GPLX bị trùng
 */
router.post('/admin/drivers', authenticateToken, authorizeRoles('ADMIN'), userController.createDriverAccount);

module.exports = router;
