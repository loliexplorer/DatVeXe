const { pool } = require('../config/db');

// 1. [GET] /api/trips - Tìm kiếm và lọc danh sách chuyến xe
async function searchTrips(req, res) {
  try {
    const { origin, destination, date, bus_type, time_filter, sort_by } = req.query;

    let query = `
      SELECT t.id, t.departure_time, t.arrival_time, t.price, t.status,
             r.distance_km, r.estimated_hours,
             s1.name as origin_station, s1.city as origin_city,
             s2.name as dest_station, s2.city as destination_city,
             b.plate_number, b.bus_type, b.floor_count, b.total_seats,
             COALESCE(AVG(rev.rating), 4.9) as rating,
             COUNT(rev.id) as reviews_count
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN stations s1 ON r.origin_station_id = s1.id
      JOIN stations s2 ON r.destination_station_id = s2.id
      JOIN buses b ON t.bus_id = b.id
      LEFT JOIN reviews rev ON t.id = rev.trip_id
      WHERE t.status != 'CANCELLED'
    `;
    const params = [];

    // Lọc theo Điểm đi (thành phố hoặc bến)
    if (origin) {
      query += ` AND (s1.city LIKE ? OR s1.name LIKE ?)`;
      params.push(`%${origin.trim()}%`, `%${origin.trim()}%`);
    }

    // Lọc theo Điểm đến
    if (destination) {
      query += ` AND (s2.city LIKE ? OR s2.name LIKE ?)`;
      params.push(`%${destination.trim()}%`, `%${destination.trim()}%`);
    }

    // Lọc theo Loại xe
    if (bus_type && bus_type !== 'ALL') {
      query += ` AND b.bus_type = ?`;
      params.push(bus_type.toUpperCase().trim());
    }

    // Lọc theo Khung giờ đi (Sáng: 00:00 - 12:00, Chiều/Tối: 12:00 - 24:00)
    if (time_filter === 'MORNING') {
      query += ` AND HOUR(t.departure_time) < 12`;
    } else if (time_filter === 'AFTERNOON') {
      query += ` AND HOUR(t.departure_time) >= 12`;
    }

    query += ` GROUP BY t.id, r.id, s1.id, s2.id, b.id`;

    // Sắp xếp
    if (sort_by === 'PRICE_ASC') {
      query += ` ORDER BY t.price ASC`;
    } else if (sort_by === 'PRICE_DESC') {
      query += ` ORDER BY t.price DESC`;
    } else if (sort_by === 'TIME_ASC') {
      query += ` ORDER BY t.departure_time ASC`;
    } else if (sort_by === 'RATING_DESC') {
      query += ` ORDER BY rating DESC`;
    } else {
      query += ` ORDER BY t.departure_time ASC`;
    }

    const [trips] = await pool.query(query, params);

    // Chuẩn hóa định dạng hiển thị cho Frontend
    const formattedTrips = trips.map(t => {
      const depDate = new Date(t.departure_time);
      const arrDate = new Date(t.arrival_time);

      const depHour = depDate.getHours().toString().padStart(2, '0');
      const depMin = depDate.getMinutes().toString().padStart(2, '0');
      const arrHour = arrDate.getHours().toString().padStart(2, '0');
      const arrMin = arrDate.getMinutes().toString().padStart(2, '0');

      let busTypeName = 'Xe Giường nằm 20 chỗ';
      if (t.bus_type === 'LIMOUSINE') {
        busTypeName = 'Limousine 12 chỗ cao cấp';
      } else if (t.bus_type === 'SEAT') {
        busTypeName = 'Xe Ghế ngồi tiêu chuẩn';
      }

      return {
        id: t.id,
        bus_name: t.bus_type === 'LIMOUSINE' ? 'Sa Pa Luxury Limousine' : 'EcoBus Express VIP',
        bus_type: t.bus_type,
        bus_type_name: busTypeName,
        plate_number: t.plate_number,
        origin_city: t.origin_city,
        origin_station: t.origin_station,
        destination_city: t.destination_city,
        dest_station: t.dest_station,
        departure_time: `${depHour}:${depMin}`,
        arrival_time: `${arrHour}:${arrMin}`,
        departure_full: t.departure_time,
        arrival_full: t.arrival_time,
        duration: `${Math.floor(t.estimated_hours)}h ${Math.round((t.estimated_hours % 1) * 60)}m`,
        distance_km: t.distance_km,
        price: parseFloat(t.price),
        total_seats: t.total_seats,
        floor_count: t.floor_count,
        available_seats: Math.max(0, t.total_seats - 4), // Mặc định trừ các ghế đã bán mẫu
        booked_seats: ['A01', 'A02', 'A05', 'B01'], // Danh sách ghế mẫu đã bán
        rating: parseFloat(parseFloat(t.rating).toFixed(1)),
        reviews_count: parseInt(t.reviews_count, 10) || 128,
        amenities: t.bus_type === 'LIMOUSINE' 
          ? ['Ghế massage', 'Màn hình riêng', 'Wifi tốc độ cao', 'Đón trả tận nơi']
          : ['Wifi miễn phí', 'Nước suối & Khăn lạnh', 'Cổng sạc USB', 'Chăn ấm'],
        status: t.status
      };
    });

    return res.status(200).json({
      success: true,
      total: formattedTrips.length,
      data: formattedTrips
    });
  } catch (error) {
    console.error('Lỗi searchTrips:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tìm kiếm chuyến xe.'
    });
  }
}

// 2. [GET] /api/trips/:id - Lấy chi tiết 1 chuyến xe
async function getTripById(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);

    const [rows] = await pool.query(`
      SELECT t.id, t.departure_time, t.arrival_time, t.price, t.status,
             r.distance_km, r.estimated_hours,
             s1.name as origin_station, s1.city as origin_city,
             s2.name as dest_station, s2.city as destination_city,
             b.plate_number, b.bus_type, b.floor_count, b.total_seats
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN stations s1 ON r.origin_station_id = s1.id
      JOIN stations s2 ON r.destination_station_id = s2.id
      JOIN buses b ON t.bus_id = b.id
      WHERE t.id = ? LIMIT 1
    `, [tripId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyến xe!'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Lỗi getTripById:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết chuyến xe.'
    });
  }
}

// 3. [GET] /api/trips/:id/seats - Lấy sơ đồ ghế và trạng thái còn/hết của chuyến
async function getTripSeats(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);

    // Lấy bus_id của chuyến
    const [tripRows] = await pool.query('SELECT bus_id FROM trips WHERE id = ? LIMIT 1', [tripId]);
    if (tripRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chuyến xe không tồn tại!' });
    }

    const busId = tripRows[0].bus_id;

    // Lấy toàn bộ cấu hình ghế của xe
    const [seats] = await pool.query(
      'SELECT id, seat_code, floor_number, seat_type FROM seats WHERE bus_id = ? ORDER BY floor_number ASC, seat_code ASC',
      [busId]
    );

    // Danh sách ghế đã bán mẫu
    const bookedSeatsMock = ['A01', 'A02', 'A05', 'B01'];

    const formattedSeats = seats.map(s => ({
      id: s.id,
      seat_code: s.seat_code,
      floor_number: s.floor_number,
      seat_type: s.seat_type,
      is_booked: bookedSeatsMock.includes(s.seat_code)
    }));

    return res.status(200).json({
      success: true,
      data: {
        trip_id: tripId,
        total_seats: formattedSeats.length,
        booked_seats: bookedSeatsMock,
        seats: formattedSeats
      }
    });
  } catch (error) {
    console.error('Lỗi getTripSeats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy sơ đồ ghế.'
    });
  }
}

// 4. [GET] /api/trips/:id/tracking - Tọa độ GPS & Lộ trình xe theo thời gian thực (Leaflet Map)
async function getTripTracking(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);

    // Giả lập tọa độ GPS dọc theo cao tốc Nội Bài - Lào Cai (Hà Nội -> Sa Pa)
    // Tọa độ Hà Nội: 21.0285, 105.7780
    // Tọa độ Sa Pa: 22.3364, 103.8438
    const trackingData = {
      trip_id: tripId,
      status: 'EN_ROUTE',
      status_text: 'Đang di chuyển trên cao tốc',
      speed_kmh: 65,
      progress_percent: 58,
      current_location: {
        name: 'Gần Nút giao IC12 - TP. Yên Bái',
        lat: 21.7167,
        lng: 104.9000
      },
      route: {
        origin: {
          name: 'Bến xe Mỹ Đình (Hà Nội)',
          lat: 21.0285,
          lng: 105.7780
        },
        destination: {
          name: 'Bến xe Sa Pa (Lào Cai)',
          lat: 22.3364,
          lng: 103.8438
        },
        remaining_km: 132,
        estimated_arrival: '12:30'
      },
      driver: {
        name: 'Trần Văn Lái',
        phone: '0902000001',
        license: 'GPLX-HN-99881',
        experience: '5 năm kinh nghiệm lái xe Tây Bắc'
      },
      telemetry: {
        temperature_cabin: '24°C',
        door_status: 'CLOSED',
        next_rest_stop: 'Trạm dừng chân Km117 (Dự kiến đến sau 15 phút)'
      }
    };

    return res.status(200).json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error('Lỗi getTripTracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy tọa độ hành trình xe.'
    });
  }
}

// 5. [POST] /api/admin/trips - (Admin) Thêm lịch trình chuyến xe mới
async function createTrip(req, res) {
  try {
    const { route_id, bus_id, driver_id, departure_time, arrival_time, price } = req.body;

    if (!route_id || !bus_id || !driver_id || !departure_time || !arrival_time || !price) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: Tuyến đường, Xe, Tài xế, Giờ khởi hành, Giờ đến và Giá vé!'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time, price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED')`,
      [route_id, bus_id, driver_id, departure_time, arrival_time, price]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm chuyến xe mới thành công!',
      data: {
        id: result.insertId,
        route_id,
        bus_id,
        driver_id,
        departure_time,
        arrival_time,
        price
      }
    });
  } catch (error) {
    console.error('Lỗi createTrip:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thêm chuyến xe.'
    });
  }
}

// 6. [PUT] /api/admin/trips/:id - (Admin) Cập nhật chuyến xe
async function updateTrip(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { departure_time, arrival_time, price, status } = req.body;

    await pool.query(
      `UPDATE trips
       SET departure_time = COALESCE(?, departure_time),
           arrival_time = COALESCE(?, arrival_time),
           price = COALESCE(?, price),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [departure_time || null, arrival_time || null, price || null, status || null, tripId]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật chuyến xe thành công!'
    });
  } catch (error) {
    console.error('Lỗi updateTrip:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật chuyến xe.'
    });
  }
}

// 7. [DELETE] /api/admin/trips/:id - (Admin) Hủy chuyến xe
async function deleteTrip(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);

    // Chuyển trạng thái sang CANCELLED thay vì xóa cứng để bảo lưu lịch sử
    await pool.query("UPDATE trips SET status = 'CANCELLED' WHERE id = ?", [tripId]);

    return res.status(200).json({
      success: true,
      message: 'Đã hủy chuyến xe thành công!'
    });
  } catch (error) {
    console.error('Lỗi deleteTrip:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hủy chuyến xe.'
    });
  }
}

// 8. [PATCH] /api/driver/trips/:id/status - (Tài xế/Admin) Cập nhật trạng thái chuyến xe
async function updateTripStatus(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ['SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ! Cho phép: [${validStatuses.join(', ')}]`
      });
    }

    await pool.query('UPDATE trips SET status = ? WHERE id = ?', [status.toUpperCase(), tripId]);

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái chuyến xe sang ${status.toUpperCase()} thành công!`
    });
  } catch (error) {
    console.error('Lỗi updateTripStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái chuyến.'
    });
  }
}

module.exports = {
  searchTrips,
  getTripById,
  getTripSeats,
  getTripTracking,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStatus
};
