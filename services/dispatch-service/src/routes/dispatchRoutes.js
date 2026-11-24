const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Dispatch
 *   description: "APIs điều phối phân công ca chạy tài xế, cập nhật trạng thái và nhật ký sự cố"
 */

/**
 * @swagger
 * /api/dispatch/my-schedule:
 *   get:
 *     summary: "Tài xế xem lịch phân công ca chạy của mình"
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED]
 *         description: "Lọc theo trạng thái ca chạy"
 *     responses:
 *       200:
 *         description: "Danh sách ca chạy được phân công"
 */
router.get('/my-schedule', authMiddleware, roleMiddleware('DRIVER', 'ADMIN'), dispatchController.getMySchedule);

/**
 * @swagger
 * /api/dispatch/assignments:
 *   get:
 *     summary: "Admin xem danh sách toàn bộ bảng phân công điều phối"
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Lọc theo trạng thái"
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: integer
 *         description: "Lọc theo ID tài xế"
 *     responses:
 *       200:
 *         description: "Danh sách phân công điều phối"
 */
router.get('/assignments', authMiddleware, roleMiddleware('ADMIN'), dispatchController.getAllAssignments);

/**
 * @swagger
 * /api/dispatch/assignments:
 *   post:
 *     summary: "Admin phân công tài xế & xe cho chuyến đi"
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentRequest'
 *     responses:
 *       201:
 *         description: "Phân công thành công"
 */
router.post('/assignments', authMiddleware, roleMiddleware('ADMIN'), dispatchController.createAssignment);

/**
 * @swagger
 * /api/dispatch/assignments/{id}/status:
 *   patch:
 *     summary: "Cập nhật trạng thái ca chạy (Xuất bến, Hoàn thành, Trễ giờ)"
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID ca chạy"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: "Cập nhật trạng thái thành công"
 */
router.patch('/assignments/:id/status', authMiddleware, roleMiddleware('DRIVER', 'ADMIN'), dispatchController.updateAssignmentStatus);

/**
 * @swagger
 * /api/dispatch/assignments/{id}/logs:
 *   post:
 *     summary: "Tài xế ghi nhật ký trạm dừng chân hoặc báo cáo sự cố dọc đường"
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID ca chạy"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddJourneyLogRequest'
 *     responses:
 *       201:
 *         description: "Ghi nhận nhật ký thành công"
 */
router.post('/assignments/:id/logs', authMiddleware, roleMiddleware('DRIVER', 'ADMIN'), dispatchController.addJourneyLog);

/**
 * @swagger
 * /api/dispatch/trips/{tripId}/logs:
 *   get:
 *     summary: "Xem nhật ký hành trình & cảnh báo sự cố của chuyến xe"
 *     tags: [Dispatch]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID chuyến xe (VD 1)"
 *     responses:
 *       200:
 *         description: "Thông tin điều phối và danh sách mốc nhật ký"
 */
router.get('/trips/:tripId/logs', dispatchController.getTripJourneyLogs);

module.exports = router;
