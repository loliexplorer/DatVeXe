const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: "APIs gửi Email vé điện tử kèm QR, thông báo hoàn tiền, nhắc nhở và tra cứu lịch sử"
 */

/**
 * @swagger
 * /api/notifications/booking-confirmation:
 *   post:
 *     summary: "Gửi Email HTML xác nhận đặt vé thành công kèm ảnh mã QR cho từng ghế"
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingConfirmRequest'
 *     responses:
 *       201:
 *         description: "Gửi email thành công, trả về preview_url để xem trực tiếp email"
 *       400:
 *         description: "Thiếu dữ liệu đầu vào"
 */
router.post('/booking-confirmation', notificationController.sendBookingConfirmation);

/**
 * @swagger
 * /api/notifications/refund-notice:
 *   post:
 *     summary: "Gửi Email thông báo hủy vé và xác nhận số tiền hoàn trả"
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundNoticeRequest'
 *     responses:
 *       201:
 *         description: "Gửi thông báo hoàn tiền thành công"
 */
router.post('/refund-notice', notificationController.sendRefundNotice);

/**
 * @swagger
 * /api/notifications/trip-reminder:
 *   post:
 *     summary: "Gửi Email nhắc nhở hành khách trước giờ xe khởi hành"
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripReminderRequest'
 *     responses:
 *       201:
 *         description: "Gửi nhắc nhở thành công"
 */
router.post('/trip-reminder', notificationController.sendTripReminder);

/**
 * @swagger
 * /api/notifications/history:
 *   get:
 *     summary: "Tra cứu lịch sử thông báo đã gửi"
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: booking_code
 *         schema:
 *           type: string
 *         description: "Mã đơn vé (VD BK20261106-0001)"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: "Email người nhận"
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: "ID người dùng"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING_CONFIRM, REFUND_NOTICE, TRIP_REMINDER, DISPATCH_ALERT, SYSTEM]
 *         description: "Loại thông báo"
 *     responses:
 *       200:
 *         description: "Danh sách lịch sử thông báo"
 */
router.get('/history', notificationController.getNotificationHistory);

module.exports = router;
