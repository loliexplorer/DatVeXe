const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: "APIs quản lý mã giảm giá, kiểm tra điều kiện, áp mã vào vé và đổi điểm thưởng"
 */

/**
 * @swagger
 * /api/vouchers:
 *   get:
 *     summary: "Lấy danh sách mã giảm giá đang hoạt động"
 *     tags: [Vouchers]
 *     parameters:
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *         description: "Lọc mã áp dụng theo tuyến đường (VD Sa Pa)"
 *     responses:
 *       200:
 *         description: "Danh sách voucher khả dụng"
 */
router.get('/', voucherController.getAvailableVouchers);

/**
 * @swagger
 * /api/vouchers/validate:
 *   post:
 *     summary: "Kiểm tra mã giảm giá và tính thử số tiền được giảm"
 *     tags: [Vouchers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateVoucherRequest'
 *     responses:
 *       200:
 *         description: "Mã hợp lệ, trả về số tiền giảm và giá cuối"
 *       400:
 *         description: "Mã không đủ điều kiện áp dụng hoặc hết hạn"
 */
router.post('/validate', voucherController.validateVoucher);

/**
 * @swagger
 * /api/vouchers/apply:
 *   post:
 *     summary: "Áp dụng mã giảm giá vào đơn đặt vé thực tế"
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyVoucherRequest'
 *     responses:
 *       200:
 *         description: "Áp dụng thành công và ghi nhận lượt sử dụng"
 *       409:
 *         description: "Đơn vé đã sử dụng mã này trước đó"
 */
router.post('/apply', optionalAuthMiddleware, voucherController.applyVoucher);

/**
 * @swagger
 * /api/vouchers/redeem-points:
 *   post:
 *     summary: "Khách hàng đổi điểm hội viên thành mã giảm giá cá nhân"
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RedeemPointsRequest'
 *     responses:
 *       201:
 *         description: "Quy đổi thành công mã giảm giá cá nhân"
 */
router.post('/redeem-points', authMiddleware, voucherController.redeemPointsToVoucher);

/**
 * @swagger
 * /api/vouchers:
 *   post:
 *     summary: "Admin tạo mã khuyến mãi mới"
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVoucherRequest'
 *     responses:
 *       201:
 *         description: "Tạo mã khuyến mãi thành công"
 *       403:
 *         description: "Chỉ Admin mới có quyền tạo"
 */
router.post('/', authMiddleware, roleMiddleware('ADMIN'), voucherController.createVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   delete:
 *     summary: "Admin vô hiệu hóa mã khuyến mãi"
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID mã khuyến mãi"
 *     responses:
 *       200:
 *         description: "Vô hiệu hóa thành công"
 */
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), voucherController.deactivateVoucher);

module.exports = router;
