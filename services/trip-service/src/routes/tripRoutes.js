const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, optionalAuth } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Trips
 *     description: Các API Tìm kiếm chuyến xe, Sơ đồ ghế & Lộ trình GPS
 *   - name: Reviews
 *     description: Các API Đánh giá & Nhận xét chất lượng chuyến xe
 *   - name: Admin Trips
 *     description: Các API Quản trị viên & Tài xế điều hành chuyến xe
 */

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Tìm kiếm chuyến xe kèm bộ lọc & sắp xếp (Giá, Giờ, Khung giờ, Loại xe)
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: "Tên tỉnh/thành phố hoặc bến đi (Ví dụ: Hà Nội)"
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: "Tên tỉnh/thành phố hoặc bến đến (Ví dụ: Sa Pa)"
 *       - in: query
 *         name: bus_type
 *         schema:
 *           type: string
 *           enum: [ALL, SLEEPER, LIMOUSINE, SEAT]
 *         description: "Loại phương tiện"
 *       - in: query
 *         name: time_filter
 *         schema:
 *           type: string
 *           enum: [ALL, MORNING, AFTERNOON]
 *         description: "Khung giờ (Sáng: 00:00 - 12:00, Chiều/Tối: 12:00 - 24:00)"
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [DEFAULT, PRICE_ASC, PRICE_DESC, TIME_ASC, RATING_DESC]
 *         description: Tiêu chí sắp xếp
 *     responses:
 *       200:
 *         description: Danh sách chuyến xe phù hợp
 */
router.get('/trips', tripController.searchTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin một chuyến xe
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết chuyến xe
 *       404:
 *         description: Không tìm thấy chuyến xe
 */
router.get('/trips/:id', tripController.getTripById);

/**
 * @swagger
 * /api/trips/{id}/seats:
 *   get:
 *     summary: Lấy sơ đồ chọn ghế chi tiết của xe (Tầng 1, Tầng 2, ghế đã bán & ghế trống)
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sơ đồ ghế và danh sách ghế còn trống
 */
router.get('/trips/:id/seats', tripController.getTripSeats);

/**
 * @swagger
 * /api/trips/{id}/tracking:
 *   get:
 *     summary: Lấy tọa độ GPS & Tiến độ lộ trình xe chạy thời gian thực (Bản đồ Leaflet)
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dữ liệu đo đạc GPS và thông tin tài xế đang lái
 */
router.get('/trips/:id/tracking', tripController.getTripTracking);

/**
 * @swagger
 * /api/trips/{id}/reviews:
 *   get:
 *     summary: Xem danh sách đánh giá & điểm sao trung bình của chuyến xe
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đánh giá từ hành khách
 */
router.get('/trips/:id/reviews', reviewController.getTripReviews);

/**
 * @swagger
 * /api/trips/{id}/reviews:
 *   post:
 *     summary: Viết đánh giá nhận xét và chấm điểm sao cho chuyến xe
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Xe chạy rất êm, bác tài lái cẩn thận, phục vụ chu đáo!
 *               customer_name:
 *                 type: string
 *                 example: Hoàng Khách Hàng
 *     responses:
 *       201:
 *         description: Gửi đánh giá thành công
 */
router.post('/trips/:id/reviews', optionalAuth, reviewController.createTripReview);

/**
 * @swagger
 * /api/admin/trips:
 *   post:
 *     summary: (Admin) Thêm lịch trình chuyến xe mới
 *     tags: [Admin Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [route_id, bus_id, driver_id, departure_time, arrival_time, price]
 *             properties:
 *               route_id:
 *                 type: integer
 *                 example: 1
 *               bus_id:
 *                 type: integer
 *                 example: 1
 *               driver_id:
 *                 type: integer
 *                 example: 2
 *               departure_time:
 *                 type: string
 *                 example: "2026-11-20 07:00:00"
 *               arrival_time:
 *                 type: string
 *                 example: "2026-11-20 12:30:00"
 *               price:
 *                 type: number
 *                 example: 320000
 *     responses:
 *       201:
 *         description: Thêm chuyến xe thành công
 *       403:
 *         description: Yêu cầu quyền ADMIN
 */
router.post('/admin/trips', authenticateToken, authorizeRoles('ADMIN'), tripController.createTrip);

/**
 * @swagger
 * /api/admin/trips/{id}:
 *   put:
 *     summary: (Admin) Cập nhật thông tin chuyến xe
 *     tags: [Admin Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departure_time:
 *                 type: string
 *               arrival_time:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, DEPARTED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/admin/trips/:id', authenticateToken, authorizeRoles('ADMIN'), tripController.updateTrip);

/**
 * @swagger
 * /api/admin/trips/{id}:
 *   delete:
 *     summary: (Admin) Hủy bỏ một chuyến xe
 *     tags: [Admin Trips]
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
 *         description: Đã hủy chuyến xe thành công
 */
router.delete('/admin/trips/:id', authenticateToken, authorizeRoles('ADMIN'), tripController.deleteTrip);

/**
 * @swagger
 * /api/driver/trips/{id}/status:
 *   patch:
 *     summary: (Tài xế/Admin) Cập nhật trạng thái chuyến xe (Xuất bến, Hoàn thành)
 *     tags: [Admin Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, DEPARTED, COMPLETED, CANCELLED]
 *                 example: DEPARTED
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.patch('/driver/trips/:id/status', authenticateToken, authorizeRoles('DRIVER', 'ADMIN'), tripController.updateTripStatus);

module.exports = router;
