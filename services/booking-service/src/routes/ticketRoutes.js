const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: "APIs kiểm tra vé và soát vé QR dành cho Tài xế (Driver Check-in)"
 */

/**
 * @swagger
 * /api/tickets/check-in:
 *   patch:
 *     summary: "Tài xế quét mã QR soát vé hành khách lên xe"
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckInRequest'
 *     responses:
 *       200:
 *         description: "Soát vé thành công, cho phép lên xe"
 *       400:
 *         description: "Vé đã soát trước đó hoặc đơn bị hủy"
 *       403:
 *         description: "Chỉ có Driver hoặc Admin mới được soát vé"
 *       404:
 *         description: "Không tìm thấy mã vé"
 */
router.patch('/check-in', authMiddleware, roleMiddleware('Driver', 'Admin'), ticketController.checkInTicket);

/**
 * @swagger
 * /api/tickets/qr/{qrCode}:
 *   get:
 *     summary: "Tra cứu thông tin vé qua chuỗi mã QR"
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: "Chuỗi mã QR in trên vé"
 *     responses:
 *       200:
 *         description: "Thông tin chi tiết của vé"
 *       404:
 *         description: "Không tìm thấy vé"
 */
router.get('/trip/:tripId', authMiddleware, roleMiddleware('Driver', 'Admin'), ticketController.getTicketsByTrip);
router.get('/qr/:qrCode', ticketController.getTicketByQr);

module.exports = router;
