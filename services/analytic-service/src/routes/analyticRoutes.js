const express = require('express');
const router = express.Router();
const analyticController = require('../controllers/analyticController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: "APIs thống kê doanh thu, hiệu suất tuyến đường & tài xế cho Admin Dashboard"
 */

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: "Lấy số liệu tổng quan Dashboard (Doanh thu, Tỷ lệ lấp đầy, Tài xế)"
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Dữ liệu tổng quan hệ thống"
 *       403:
 *         description: "Chỉ Admin mới có quyền xem báo cáo"
 */
router.get('/overview', authMiddleware, roleMiddleware('ADMIN'), analyticController.getOverview);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: "Lấy chuỗi số liệu biểu đồ doanh thu theo ngày"
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: "Số ngày gần nhất (VD 7 hoặc 30)"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: "Từ ngày (YYYY-MM-DD)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: "Đến ngày (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: "Danh sách doanh thu theo từng ngày"
 */
router.get('/revenue', authMiddleware, roleMiddleware('ADMIN'), analyticController.getRevenueChart);

/**
 * @swagger
 * /api/analytics/top-routes:
 *   get:
 *     summary: "Xếp hạng các tuyến đường đông khách nhất & tỷ lệ lấp đầy ghế"
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Bảng xếp hạng tuyến đường"
 */
router.get('/top-routes', authMiddleware, roleMiddleware('ADMIN'), analyticController.getTopRoutes);

/**
 * @swagger
 * /api/analytics/driver-performance:
 *   get:
 *     summary: "Báo cáo hiệu suất & điểm đánh giá đội ngũ tài xế"
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Danh sách hiệu suất tài xế"
 */
router.get('/driver-performance', authMiddleware, roleMiddleware('ADMIN'), analyticController.getDriverPerformance);

/**
 * @swagger
 * /api/analytics/record-event:
 *   post:
 *     summary: "Ghi nhận sự kiện đặt vé hoặc hoàn tiền để cập nhật số liệu thống kê"
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordEventRequest'
 *     responses:
 *       200:
 *         description: "Cập nhật số liệu thành công"
 */
router.post('/record-event', analyticController.recordEvent);

module.exports = router;
