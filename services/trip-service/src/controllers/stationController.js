const { pool } = require('../config/db');

// 1. [GET] /api/stations - Lấy danh sách tất cả bến xe / điểm đón trả
async function getAllStations(req, res) {
  try {
    const [stations] = await pool.query('SELECT id, name, city, address FROM stations ORDER BY city ASC, name ASC');
    return res.status(200).json({
      success: true,
      data: stations
    });
  } catch (error) {
    console.error('Lỗi getAllStations:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách bến xe.'
    });
  }
}

// 2. [GET] /api/routes - Lấy danh sách tuyến đường
async function getAllRoutes(req, res) {
  try {
    const [routes] = await pool.query(`
      SELECT r.id, r.distance_km, r.estimated_hours, r.base_price,
             s1.id as origin_id, s1.name as origin_station, s1.city as origin_city,
             s2.id as dest_id, s2.name as dest_station, s2.city as dest_city
      FROM routes r
      JOIN stations s1 ON r.origin_station_id = s1.id
      JOIN stations s2 ON r.destination_station_id = s2.id
      ORDER BY r.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Lỗi getAllRoutes:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách tuyến đường.'
    });
  }
}

module.exports = {
  getAllStations,
  getAllRoutes
};
