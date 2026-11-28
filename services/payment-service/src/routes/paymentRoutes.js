const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { internalOrAdminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: "APIs khởi tạo thanh toán QR, xử lý Webhook và đối soát hoàn tiền"
 */

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: "Khởi tạo thanh toán & Tạo mã QR VietQR hoặc Link Cổng VNPAY / MoMo"
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiatePaymentRequest'
 *     responses:
 *       201:
 *         description: "Khởi tạo thanh toán thành công, trả về link ảnh VietQR hoặc link cổng"
 *       400:
 *         description: "Dữ liệu không hợp lệ"
 *       409:
 *         description: "Đơn đặt vé đã thanh toán trước đó"
 */
router.get('/bank-info', paymentController.getBankInfoPreview);
router.post('/initiate', paymentController.initiatePayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: "Webhook IPN nhận kết quả thanh toán từ Ngân hàng / Cổng VNPAY / MoMo"
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookRequest'
 *     responses:
 *       200:
 *         description: "Xác nhận và cập nhật trạng thái thanh toán thành công"
 *       404:
 *         description: "Không tìm thấy giao dịch"
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: "Xử lý hoàn tiền cho vé hủy"
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: "Hoàn tiền thành công"
 *       400:
 *         description: "Giao dịch chưa thanh toán hoặc dữ liệu sai"
 */
router.post('/refund', internalOrAdminMiddleware, paymentController.refundPayment);

/**
 * @swagger
 * /api/payments/{idOrBookingCode}:
 *   get:
 *     summary: "Tra cứu trạng thái giao dịch thanh toán theo ID hoặc Booking Code"
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: idOrBookingCode
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID thanh toán (1, 2) hoặc Mã vé (BK20261106-0001)"
 *     responses:
 *       200:
 *         description: "Chi tiết giao dịch thanh toán"
 *       404:
 *         description: "Không tìm thấy giao dịch"
 */
router.get('/:idOrBookingCode', paymentController.getPaymentDetail);

/**
 * @swagger
 * /api/payments/{id}/logs:
 *   get:
 *     summary: "Xem nhật ký đối soát cổng thanh toán (Payment Logs)"
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID giao dịch thanh toán"
 *     responses:
 *       200:
 *         description: "Danh sách log giao dịch"
 */
router.get('/:id/logs', paymentController.getPaymentLogs);

module.exports = router;
