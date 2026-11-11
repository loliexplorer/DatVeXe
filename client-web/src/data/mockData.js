// Dữ liệu mẫu đồng bộ với Database MySQL (trip_db, user_db)
export const STATIONS = [
  { id: 1, name: "Bến xe Mỹ Đình", city: "Hà Nội", address: "Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội" },
  { id: 2, name: "Bến xe Sa Pa", city: "Lào Cai", address: "Thị xã Sa Pa, Lào Cai" },
  { id: 3, name: "Bến xe Miền Đông", city: "Hồ Chí Minh", address: "292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM" },
  { id: 4, name: "Bến xe Liên Tỉnh Đà Lạt", city: "Lâm Đồng", address: "Số 01 Tô Hiến Thành, TP Đà Lạt" },
  { id: 5, name: "Bến xe Cầu Rào", city: "Hải Phòng", address: "Số 1 Thiên Lôi, Ngô Quyền, Hải Phòng" },
  { id: 6, name: "Bến xe Trung Tâm Đà Nẵng", city: "Đà Nẵng", address: "Tôn Đức Thắng, Liên Chiểu, Đà Nẵng" }
];

export const POPULAR_ROUTES = [
  {
    id: 1,
    origin: "Hà Nội",
    destination: "Sa Pa",
    originStation: "Bến xe Mỹ Đình",
    destStation: "Bến xe Sa Pa",
    distance: "315 km",
    duration: "5.5 giờ",
    price: 320000,
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    tripsCount: 14
  },
  {
    id: 2,
    origin: "Hồ Chí Minh",
    destination: "Đà Lạt",
    originStation: "Bến xe Miền Đông",
    destStation: "Bến xe Liên Tỉnh Đà Lạt",
    distance: "305 km",
    duration: "6.0 giờ",
    price: 300000,
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80",
    tripsCount: 18
  },
  {
    id: 3,
    origin: "Hà Nội",
    destination: "Hải Phòng",
    originStation: "Bến xe Mỹ Đình",
    destStation: "Bến xe Cầu Rào",
    distance: "120 km",
    duration: "2.0 giờ",
    price: 150000,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
    tripsCount: 22
  }
];

export const MOCK_TRIPS = [
  {
    id: 1,
    busName: "EcoBus Express VIP",
    plateNumber: "29B-998.88",
    busType: "SLEEPER", // Giường nằm 2 tầng
    busTypeName: "Giường nằm 20 chỗ (VIP Cabin)",
    originCity: "Hà Nội",
    originStation: "Bến xe Mỹ Đình",
    destinationCity: "Sa Pa",
    destStation: "Bến xe Sa Pa",
    departureTime: "07:00",
    arrivalTime: "12:30",
    duration: "5h 30m",
    price: 320000,
    rating: 4.9,
    reviewsCount: 384,
    amenities: ["Wifi miễn phí", "Nước suối & Khăn lạnh", "Cổng sạc USB", "Chăn ấm"],
    // Sơ đồ ghế (1 = Tầng 1, 2 = Tầng 2). Booked: ghế đã bán
    bookedSeats: ["A01", "A02", "A05", "B01"],
    totalSeats: 20
  },
  {
    id: 2,
    busName: "Sa Pa Luxury Limousine",
    plateNumber: "29B-772.33",
    busType: "LIMOUSINE",
    busTypeName: "Limousine 12 chỗ cao cấp",
    originCity: "Hà Nội",
    originStation: "Bến xe Mỹ Đình",
    destinationCity: "Sa Pa",
    destStation: "Bến xe Sa Pa",
    departureTime: "09:30",
    arrivalTime: "14:45",
    duration: "5h 15m",
    price: 380000,
    rating: 4.8,
    reviewsCount: 212,
    amenities: ["Ghế massage", "Màn hình riêng", "Wifi tốc độ cao", "Đón trả tận nơi"],
    bookedSeats: ["A03", "A04"],
    totalSeats: 12
  },
  {
    id: 3,
    busName: "EcoBus Đêm Hoàng Hôn",
    plateNumber: "29B-551.99",
    busType: "SLEEPER",
    busTypeName: "Giường nằm 20 chỗ (VIP Cabin)",
    originCity: "Hà Nội",
    originStation: "Bến xe Mỹ Đình",
    destinationCity: "Sa Pa",
    destStation: "Bến xe Sa Pa",
    departureTime: "22:00",
    arrivalTime: "03:30 (Hôm sau)",
    duration: "5h 30m",
    price: 320000,
    rating: 4.9,
    reviewsCount: 519,
    amenities: ["Wifi miễn phí", "Nước suối & Khăn lạnh", "Cổng sạc USB", "Chăn ấm"],
    bookedSeats: ["A01", "A02", "A03", "A04", "B01", "B02", "B05"],
    totalSeats: 20
  }
];
