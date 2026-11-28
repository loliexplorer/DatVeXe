const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware, optionalAuthMiddleware, internalOrAdminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: "APIs quản lý đặt vé xe, giữ chỗ 10 phút và hủy vé"
 */

/**
 * @swagger
 * /api/bookings/hold-seats:
 *   post:
 *     summary: "Giữ chỗ ghế tạm thời trong 10 phút (Seat Lock)"
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeatLockRequest'
 *     responses:
 *       200:
 *         description: "Giữ chỗ ghế thành công"
 *       409:
 *         description: "Ghế đã có người đặt hoặc đang bị khóa"
 */
router.post('/hold-seats', bookingController.holdSeats);

/**
 * @swagger
 * /api/bookings/release-seats:
 *   post:
 *     summary: "Hủy giữ chỗ ghế"
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeatLockRequest'
 *     responses:
 *       200:
 *         description: "Hủy giữ chỗ thành công"
 */
router.post('/release-seats', bookingController.releaseSeats);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: "Tạo đơn đặt vé và xuất vé có mã QR (Hỗ trợ cả khách đăng nhập và vãng lai)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: "Tạo đơn vé thành công, trả về danh sách vé và mã QR"
 *       400:
 *         description: "Thiếu thông tin đặt vé"
 *       409:
 *         description: "Ghế đã bị đặt trước"
 */
router.post('/', optionalAuthMiddleware, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: "Tra cứu danh sách vé đã đặt (Dành cho khách hàng)"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: booking_code
 *         schema:
 *           type: string
 *         description: "Mã đơn đặt vé (nếu không đăng nhập)"
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: "Số điện thoại đặt vé (nếu không đăng nhập)"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: "Email đặt vé (nếu không đăng nhập)"
 *     responses:
 *       200:
 *         description: "Danh sách đơn đặt vé kèm chi tiết từng vé"
 */
router.get('/my-bookings', optionalAuthMiddleware, bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/trips/{tripId}/occupied-seats:
 *   get:
 *     summary: "Lấy danh sách ghế đã bán và đang giữ chỗ của chuyến xe (Đồng bộ sang trip-service)"
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Danh sách ghế đã bán và đang khóa"
 */
router.get('/trips/:tripId/occupied-seats', bookingController.getOccupiedSeatsByTrip);

/**
 * @swagger
 * /api/bookings/{idOrCode}:
 *   get:
 *     summary: "Xem chi tiết một đơn đặt vé theo ID hoặc Mã đơn"
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID (số) hoặc Mã đơn (BK20261106-0001)"
 *     responses:
 *       200:
 *         description: "Chi tiết đơn đặt vé"
 *       404:
 *         description: "Không tìm thấy đơn vé"
 */
router.get('/:idOrCode', bookingController.getBookingDetail);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: "Hủy đơn đặt vé theo chính sách hoàn tiền"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID đơn đặt vé"
 *     responses:
 *       200:
 *         description: "Hủy vé thành công và thông tin hoàn tiền"
 *       400:
 *         description: "Vé đã bị hủy trước đó"
 *       403:
 *         description: "Không có quyền hủy vé của người khác"
 */
router.patch('/:id/cancel', optionalAuthMiddleware, bookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   patch:
 *     summary: "(Nội bộ / Admin) Xác nhận đơn đặt vé từ PENDING sang CONFIRMED sau khi thanh toán thành công"
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Xác nhận đơn vé thành công"
 */
router.patch('/:id/confirm', internalOrAdminMiddleware, bookingController.confirmBooking);

module.exports = router;
