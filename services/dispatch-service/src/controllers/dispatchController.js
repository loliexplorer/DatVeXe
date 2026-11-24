const pool = require('../config/db');

// 1. Tài xế xem lịch phân công ca chạy của mình
const getMySchedule = async (req, res) => {
  const driverId = req.user.id;
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM driver_assignments WHERE driver_id = ?';
    const params = [driverId];

    if (status) {
      query += ' AND status = ?';
      params.push(String(status).toUpperCase());
    }

    query += ' ORDER BY shift_date ASC, departure_time ASC';
    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch phân công tài xế: ' + error.message
    });
  }
};

// 2. Admin xem toàn bộ bảng điều phối
const getAllAssignments = async (req, res) => {
  const { status, driver_id } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(String(status).toUpperCase());
    }
    if (driver_id) {
      conditions.push('driver_id = ?');
      params.push(Number(driver_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM driver_assignments ${whereClause} ORDER BY shift_date DESC, id DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách điều phối: ' + error.message
    });
  }
};

// 3. Admin phân công tài xế và xe cho chuyến đi
const createAssignment = async (req, res) => {
  const {
    trip_id,
    driver_id,
    driver_name,
    bus_plate,
    route_name,
    shift_date,
    departure_time,
    notes = ''
  } = req.body;

  if (!trip_id || !driver_id || !driver_name || !bus_plate || !route_name || !shift_date || !departure_time) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đủ trip_id, driver_id, driver_name, bus_plate, route_name, shift_date, departure_time!'
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO driver_assignments
       (trip_id, driver_id, driver_name, bus_plate, route_name, shift_date, departure_time, status, notes, assigned_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, ?)`,
      [trip_id, driver_id, driver_name, bus_plate, route_name, shift_date, departure_time, notes, req.user.id]
    );

    const [created] = await pool.execute('SELECT * FROM driver_assignments WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `Đã phân công tài xế ${driver_name} (${bus_plate}) thành công!`,
      data: created[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo phân công ca chạy: ' + error.message
    });
  }
};

// 4. Cập nhật trạng thái ca chạy (Tài xế hoặc Admin)
const updateAssignmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'];
  const normalizedStatus = String(status || '').toUpperCase();
  if (!validStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: `Trạng thái không hợp lệ. Phải thuộc: [${validStatuses.join(', ')}]`
    });
  }

  try {
    const [existing] = await pool.execute('SELECT * FROM driver_assignments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca chạy cần cập nhật!'
      });
    }

    const assignment = existing[0];
    if (req.user.role.toUpperCase() === 'DRIVER' && assignment.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thể cập nhật trạng thái ca chạy của tài xế khác!'
      });
    }

    await pool.execute(
      'UPDATE driver_assignments SET status = ?, notes = COALESCE(?, notes) WHERE id = ?',
      [normalizedStatus, notes !== undefined ? notes : null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM driver_assignments WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái ca chạy #${id} sang ${normalizedStatus}!`,
      data: updated[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái ca chạy: ' + error.message
    });
  }
};

// 5. Tài xế ghi nhật ký trạm dừng / báo cáo sự cố dọc đường
const addJourneyLog = async (req, res) => {
  const { id } = req.params;
  const { checkpoint_name, event_type, description = '', latitude = null, longitude = null } = req.body;

  const validEvents = ['DEPARTED', 'REST_STOP', 'INCIDENT', 'ARRIVED'];
  const normalizedEvent = String(event_type || '').toUpperCase();

  if (!checkpoint_name || !validEvents.includes(normalizedEvent)) {
    return res.status(400).json({
      success: false,
      message: `Vui lòng cung cấp checkpoint_name và event_type thuộc [${validEvents.join(', ')}]!`
    });
  }

  try {
    const [existing] = await pool.execute('SELECT * FROM driver_assignments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca chạy tương ứng!'
      });
    }

    if (req.user.role.toUpperCase() === 'DRIVER' && existing[0].driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thể ghi nhật ký cho ca chạy của tài xế khác!'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO journey_logs (assignment_id, checkpoint_name, event_type, description, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, checkpoint_name, normalizedEvent, description, latitude, longitude]
    );

    // Nếu báo cáo sự cố, tự động gắn ghi chú hoặc đánh dấu DELAYED nếu cần
    if (normalizedEvent === 'INCIDENT') {
      await pool.execute(
        'UPDATE driver_assignments SET status = "DELAYED", notes = ? WHERE id = ?',
        [`[Sự cố] ${checkpoint_name}: ${description}`, id]
      );
    }

    const [logRow] = await pool.execute('SELECT * FROM journey_logs WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      success: true,
      message: normalizedEvent === 'INCIDENT'
        ? 'Đã ghi nhận báo cáo sự cố dọc đường và cập nhật cảnh báo DELAYED!'
        : 'Đã ghi nhận nhật ký hành trình thành công!',
      data: logRow[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi ghi nhật ký hành trình: ' + error.message
    });
  }
};

// 6. Xem nhật ký hành trình & sự cố theo tripId (Public cho hành khách / Admin theo dõi)
const getTripJourneyLogs = async (req, res) => {
  const { tripId } = req.params;

  try {
    const [assignments] = await pool.execute(
      'SELECT * FROM driver_assignments WHERE trip_id = ? ORDER BY id DESC LIMIT 1',
      [tripId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có thông tin điều phối cho chuyến xe này!'
      });
    }

    const assignment = assignments[0];
    const [logs] = await pool.execute(
      'SELECT * FROM journey_logs WHERE assignment_id = ? ORDER BY logged_at ASC',
      [assignment.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        assignment,
        logs
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy nhật ký hành trình: ' + error.message
    });
  }
};

module.exports = {
  getMySchedule,
  getAllAssignments,
  createAssignment,
  updateAssignmentStatus,
  addJourneyLog,
  getTripJourneyLogs
};
