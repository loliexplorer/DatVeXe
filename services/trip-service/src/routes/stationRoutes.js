const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

/**
 * @swagger
 * tags:
 *   name: Stations & Routes
 *   description: Các API Bến xe và Tuyến đường vận chuyển
 */

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Lấy danh sách tất cả các bến xe / điểm đón trả
 *     tags: [Stations & Routes]
 *     responses:
 *       200:
 *         description: Danh sách bến xe
 */
router.get('/stations', stationController.getAllStations);

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Lấy danh sách tuyến đường liên tỉnh (khoảng cách, giá sàn, thời gian)
 *     tags: [Stations & Routes]
 *     responses:
 *       200:
 *         description: Danh sách tuyến đường
 */
router.get('/routes', stationController.getAllRoutes);

module.exports = router;
