export const MOCK = {
  stats: {
    revenue: { value: '487.5 tr đ', delta: '+12.5%', up: true },
    trips:   { value: '28 chuyến',  delta: '+3',     up: true },
    tickets: { value: '1.247 vé',   delta: '+8.2%',  up: true },
    users:   { value: '8.432',      delta: '+156',   up: true },
  },

  chart: [
    { day: 'T2', count: 45 }, { day: 'T3', count: 62 }, { day: 'T4', count: 55 },
    { day: 'T5', count: 78 }, { day: 'T6', count: 91 }, { day: 'T7', count: 120 },
    { day: 'CN', count: 105 },
  ],

  bookings: [
    { id: 1, code: 'BK-1024', passengerName: 'Hoàng Khách Hàng', phone: '0903000001', route: 'Hà Nội → Sa Pa',    departureTime: '07:00', seats: ['A01','A02'], total: 700000, status: 'PAID'      },
    { id: 2, code: 'BK-1025', passengerName: 'Nguyễn Thị Lan',    phone: '0912345678', route: 'Hà Nội → Sa Pa',    departureTime: '07:00', seats: ['A03'],         total: 350000, status: 'PENDING'   },
    { id: 3, code: 'BK-1026', passengerName: 'Trần Minh Tuấn',    phone: '0987654321', route: 'Hà Nội → Hạ Long', departureTime: '08:30', seats: ['B01','B02'], total: 440000, status: 'PAID'      },
    { id: 4, code: 'BK-1027', passengerName: 'Lê Thu Hà',         phone: '0905111222', route: 'Hà Nội → Hạ Long', departureTime: '08:30', seats: ['B05'],         total: 220000, status: 'CANCELLED' },
    { id: 5, code: 'BK-1028', passengerName: 'Phạm Văn Đức',      phone: '0933444555', route: 'TP.HCM → Đà Lạt',  departureTime: '10:00', seats: ['L03','L04'], total: 640000, status: 'ON_BOARD'  },
    { id: 6, code: 'BK-1029', passengerName: 'Vũ Hoài Anh',       phone: '0966777888', route: 'TP.HCM → Đà Lạt',  departureTime: '10:00', seats: ['L05'],         total: 320000, status: 'PAID'      },
  ],

  trips: [
    { id: 1, busName: 'EcoBus Limousine', route: 'Hà Nội → Sa Pa',    departureTime: '07:00', driver: 'Trần Văn Lái',   seatsLeft: 6,  totalSeats: 12, status: 'RUNNING' },
    { id: 2, busName: 'GreenLine Express', route: 'Hà Nội → Hạ Long', departureTime: '08:30', driver: 'Nguyễn Văn Hùng', seatsLeft: 12, totalSeats: 20, status: 'PAID'    },
    { id: 3, busName: 'Sapa Express VIP', route: 'Hà Nội → Sa Pa',    departureTime: '22:00', driver: 'Lê Quốc Bảo',     seatsLeft: 3,  totalSeats: 20, status: 'DONE'    },
    { id: 4, busName: 'Đà Lạt Dream',     route: 'TP.HCM → Đà Lạt',   departureTime: '10:00', driver: 'Phạm Thanh Tùng', seatsLeft: 8,  totalSeats: 12, status: 'RUNNING' },
  ],

  activity: [
    { id: 1, type: 'BOOKING',   text: 'Hoàng Khách Hàng vừa đặt 2 vé Hà Nội → Sa Pa', time: '2 phút trước' },
    { id: 2, type: 'CHECKIN',   text: 'Tài xế Trần Văn Lái đã soát vé ghế A01',       time: '8 phút trước' },
    { id: 3, type: 'DEPARTURE', text: 'Chuyến HN → Hạ Long (08:30) đã xuất bến',      time: '25 phút trước' },
    { id: 4, type: 'CANCEL',    text: 'Đơn BK-1027 đã bị hủy & hoàn tiền',            time: '1 giờ trước' },
    { id: 5, type: 'USER',      text: 'Nguyễn Thị Lan vừa đăng ký tài khoản mới',     time: '2 giờ trước' },
  ],

  users: [
    { id: 4, fullName: 'Hoàng Khách Hàng', email: 'khachhang@gmail.com',  phone: '0903000001', joinedAt: '12/03/2024', totalBookings: 12, totalSpent: 4200000, status: 'ACTIVE'  },
    { id: 5, fullName: 'Nguyễn Thị Lan',   email: 'lan.nguyen@email.com', phone: '0912345678', joinedAt: '20/05/2024', totalBookings: 8,  totalSpent: 2800000, status: 'ACTIVE'  },
    { id: 6, fullName: 'Trần Minh Tuấn',   email: 'tuan.tran@email.com',  phone: '0987654321', joinedAt: '03/07/2024', totalBookings: 3,  totalSpent: 950000,  status: 'ACTIVE'  },
    { id: 7, fullName: 'Lê Thu Hà',        email: 'ha.le@email.com',      phone: '0905111222', joinedAt: '15/08/2024', totalBookings: 1,  totalSpent: 350000,  status: 'ACTIVE'  },
    { id: 8, fullName: 'Phạm Văn Đức',     email: 'duc.pham@email.com',   phone: '0933444555', joinedAt: '01/09/2024', totalBookings: 0,  totalSpent: 0,       status: 'BLOCKED' },
    { id: 9, fullName: 'Vũ Hoài Anh',      email: 'anh.vu@email.com',     phone: '0966777888', joinedAt: '18/09/2024', totalBookings: 5,  totalSpent: 1750000, status: 'ACTIVE'  },
  ],

  drivers: [
    { id: 1, fullName: 'Nguyễn Văn Hùng', phone: '0902000001', licenseNo: 'B2-123456', assignedBus: '29B-123.45', rating: 4.9, tripsCompleted: 342, status: 'ACTIVE',   joinedAt: '10/03/2022' },
    { id: 2, fullName: 'Trần Văn Lái',    phone: '0902000002', licenseNo: 'B2-234567', assignedBus: '29B-998.88', rating: 4.8, tripsCompleted: 287, status: 'ACTIVE',   joinedAt: '15/06/2022' },
    { id: 3, fullName: 'Lê Quốc Bảo',     phone: '0902000003', licenseNo: 'B2-345678', assignedBus: '51C-111.22', rating: 4.7, tripsCompleted: 198, status: 'ACTIVE',   joinedAt: '20/01/2023' },
    { id: 4, fullName: 'Phạm Thanh Tùng', phone: '0902000004', licenseNo: 'B2-456789', assignedBus: '—',           rating: 4.5, tripsCompleted: 156, status: 'ON_LEAVE', joinedAt: '05/04/2023' },
    { id: 5, fullName: 'Hoàng Minh Khôi', phone: '0902000005', licenseNo: 'B2-567890', assignedBus: '43B-555.66', rating: 4.9, tripsCompleted: 410, status: 'ACTIVE',   joinedAt: '12/08/2021' },
  ],

  routes: [
    { id: 1, code: 'HN-SP-01',  origin: 'Hà Nội',           destination: 'Sa Pa',     distance: 320, duration: '5h 30m', basePrice: 350000, tripsToday: 4,  status: 'ACTIVE'   },
    { id: 2, code: 'HN-HL-02',  origin: 'Hà Nội',           destination: 'Hạ Long',   distance: 165, duration: '2h 45m', basePrice: 220000, tripsToday: 6,  status: 'ACTIVE'   },
    { id: 3, code: 'HCM-DL-03', origin: 'TP. Hồ Chí Minh',  destination: 'Đà Lạt',    distance: 310, duration: '6h 15m', basePrice: 320000, tripsToday: 5,  status: 'ACTIVE'   },
    { id: 4, code: 'DN-HA-04',  origin: 'Đà Nẵng',          destination: 'Hội An',    distance: 30,  duration: '45m',   basePrice: 90000,  tripsToday: 12, status: 'ACTIVE'   },
    { id: 5, code: 'HN-NB-05',  origin: 'Hà Nội',           destination: 'Ninh Bình', distance: 95,  duration: '1h 50m', basePrice: 150000, tripsToday: 0,  status: 'INACTIVE' },
    { id: 6, code: 'HCM-VT-06', origin: 'TP. Hồ Chí Minh',  destination: 'Vũng Tàu',  distance: 125, duration: '2h 30m', basePrice: 180000, tripsToday: 8,  status: 'ACTIVE'   },
  ],

  revenue: {
    totals: { month: 487500000, prevMonth: 433200000, ytd: 4820000000 },
    monthly: [
      { month: 'T1', amount: 342000000 }, { month: 'T2', amount: 298000000 },
      { month: 'T3', amount: 412000000 }, { month: 'T4', amount: 387000000 },
      { month: 'T5', amount: 445000000 }, { month: 'T6', amount: 521000000 },
      { month: 'T7', amount: 578000000 }, { month: 'T8', amount: 612000000 },
      { month: 'T9', amount: 498000000 }, { month: 'T10', amount: 456000000 },
      { month: 'T11', amount: 433200000 }, { month: 'T12', amount: 487500000 },
    ],
    byRoute: [
      { route: 'Hà Nội → Sa Pa',    amount: 145000000, tickets: 414, pct: 30 },
      { route: 'TP.HCM → Đà Lạt',   amount: 112000000, tickets: 350, pct: 23 },
      { route: 'Hà Nội → Hạ Long',  amount: 88000000,  tickets: 400, pct: 18 },
      { route: 'TP.HCM → Vũng Tàu', amount: 72000000,  tickets: 400, pct: 15 },
      { route: 'Đà Nẵng → Hội An',  amount: 70500000,  tickets: 783, pct: 14 },
    ],
    byMethod: [
      { method: 'VNPay QR',        amount: 245000000, pct: 50, color: '#10b981' },
      { method: 'Thẻ ATM/Banking', amount: 156000000, pct: 32, color: '#3b82f6' },
      { method: 'Ví MoMo',         amount: 58800000,  pct: 12, color: '#ec4899' },
      { method: 'Tiền mặt',        amount: 27700000,  pct: 6,  color: '#f59e0b' },
    ],
  },

  notifications: [
    { id: 1, title: 'Khuyến mãi Tết Nguyên Đán 2025', message: 'Giảm 20% tất cả tuyến xe dịp Tết.',      audience: 'ALL',      channel: 'PUSH',  sentAt: '15/01/2025 09:00', sentCount: 8432, openRate: 0.62, status: 'SENT' },
    { id: 2, title: 'Khôi phục tuyến Hà Nội – Sa Pa', message: 'Tuyến đã hoạt động với 4 chuyến/ngày.', audience: 'CUSTOMER', channel: 'EMAIL', sentAt: '10/01/2025 14:30', sentCount: 1245, openRate: 0.48, status: 'SENT' },
    { id: 3, title: 'Bảo trì hệ thống định kỳ',       message: 'Bảo trì từ 02:00 – 04:00 ngày 20/01.',  audience: 'ALL',      channel: 'PUSH',  sentAt: '18/01/2025 16:00', sentCount: 8432, openRate: 0.71, status: 'SENT' },
  ],

  settings: {
    site:          { name: 'EcoBus', hotline: '1900 1234', email: 'support@ecobus.vn', address: '123 Nguyễn Huệ, Q.1, TP.HCM' },
    booking:       { holdMinutes: 10, cancellationHours: 24, refundPercent: 100, maxSeatsPerBooking: 5 },
    payment:       { vnpayEnabled: true, momoEnabled: true, codEnabled: false, bankTransferEnabled: true },
    notifications: { emailEnabled: true, smsEnabled: false, pushEnabled: true },
  },
};