// Dữ liệu mẫu cho Cổng tài xế (driver.html).
// Khi dispatch-service được nối API, thay các hàm dưới đây bằng lời gọi
// GET /api/dispatch/my-schedule và các endpoint liên quan.

/** Mã tài xế hiển thị, VD: DRV-002 */
export function getDriverCode(user) {
  if (!user?.id) return 'DRV-000';
  return `DRV-${String(user.id).padStart(3, '0')}`;
}

/** Cuốc xe được điều hành giao cho tài xế đang đăng nhập */
export function buildAssignedRides(user) {
  return [
    {
      id: 'TRIP-2081',
      code: 'TRIP-2081',
      source: 'ASSIGNED',
      driverName: user?.fullName || 'Tài xế',
      driverCode: getDriverCode(user),
      plateNumber: '29B-998.88',
      busTypeName: 'Xe giường nằm 20 chỗ',
      routeLabel: 'Hà Nội → Sa Pa',
      pickup: 'Bến xe Mỹ Đình, Hà Nội',
      dropoff: 'Bến xe Sa Pa, Lào Cai',
      departTime: '07:00',
      etaTime: '11:35',
      currentStop: 'Trạm dừng nghỉ Yên Bái',
      progress: 68,
      notifiedAt: Date.now() - 2 * 60 * 1000,
      isRead: false,
      status: 'ACCEPTED', // ACCEPTED | COMPLETED
      passengers: [
        {
          id: 1,
          seat: 'A01',
          name: 'Hoàng Khách Hàng',
          phone: '0903000001',
          pickupPoint: 'Bến xe Mỹ Đình',
          qrCode: 'QR-TRIP2081-SEAT-A01-SEC99182',
          isCheckedIn: false
        },
        {
          id: 2,
          seat: 'A05',
          name: 'Lê Văn Khách',
          phone: '0905999888',
          pickupPoint: 'Đón tại Sân bay Nội Bài',
          qrCode: 'QR-TRIP2081-SEAT-A05-SEC99184',
          isCheckedIn: false
        }
      ]
    }
  ];
}

/** Khách gọi xe gần vị trí tài xế (khoảng cách mô phỏng, chưa dùng GPS thực tế) */
export const NEARBY_REQUESTS = [
  {
    id: 'REQ-501',
    place: 'Phố cổ Hà Nội',
    destination: 'Sân bay Nội Bài',
    distanceKm: 2.4,
    passengerCount: 2,
    price: 320000,
    requestedAt: Date.now() - 1 * 60 * 1000
  },
  {
    id: 'REQ-502',
    place: 'Cầu Rồng, Đà Nẵng',
    destination: 'Phố cổ Hội An',
    distanceKm: 3.1,
    passengerCount: 1,
    price: 280000,
    requestedAt: Date.now() - 8 * 60 * 1000
  },
  {
    id: 'REQ-503',
    place: 'Hồ Tây, Hà Nội',
    destination: 'Bến xe Mỹ Đình',
    distanceKm: 7.8,
    passengerCount: 3,
    price: 180000,
    requestedAt: Date.now() - 12 * 60 * 1000
  },
  {
    id: 'REQ-504',
    place: 'Times City, Hà Nội',
    destination: 'Bến xe Giáp Bát',
    distanceKm: 12.5,
    passengerCount: 1,
    price: 150000,
    requestedAt: Date.now() - 20 * 60 * 1000
  }
];

export const RADIUS_OPTIONS = [
  { value: 5, label: 'Trong vòng 5 km' },
  { value: 10, label: 'Trong vòng 10 km' },
  { value: 20, label: 'Trong vòng 20 km' }
];

/** Chuyển 1 yêu cầu gọi xe gần đây thành cuốc xe đang theo dõi */
export function requestToRide(request, user) {
  return {
    id: request.id,
    code: request.id,
    source: 'NEARBY',
    driverName: user?.fullName || 'Tài xế',
    driverCode: getDriverCode(user),
    plateNumber: '29B-998.88',
    busTypeName: 'Xe giường nằm 20 chỗ',
    routeLabel: `${request.place} → ${request.destination}`,
    pickup: request.place,
    dropoff: request.destination,
    departTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    etaTime: new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    currentStop: 'Đang di chuyển tới điểm đón',
    progress: 0,
    notifiedAt: Date.now(),
    isRead: true,
    status: 'ACCEPTED',
    passengers: Array.from({ length: request.passengerCount }, (_, i) => ({
      id: i + 1,
      seat: `K0${i + 1}`,
      name: `Khách ${i + 1}`,
      phone: '—',
      pickupPoint: request.place,
      qrCode: `QR-${request.id}-K0${i + 1}`,
      isCheckedIn: false
    }))
  };
}

export function timeAgo(timestamp) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  return `${Math.round(minutes / 60)} giờ trước`;
}

export function formatVnd(value) {
  return `${value.toLocaleString('vi-VN')} đ`;
}
