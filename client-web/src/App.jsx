import React, { useState } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import TripCard from './components/TripCard';
import CheckoutModal from './components/CheckoutModal';
import TicketSuccess from './components/TicketSuccess';
import AuthModal from './components/AuthModal';
import MyTicketsModal from './components/MyTicketsModal';
import DriverCheckInModal from './components/DriverCheckInModal';
import TripTrackingModal from './components/TripTrackingModal';
import UserProfileModal from './components/UserProfileModal';
import { MOCK_TRIPS, POPULAR_ROUTES, STATIONS } from './data/mockData';
import { Sparkles, Bus, CheckCircle2, ArrowRight, Filter, ShieldCheck } from 'lucide-react';

export default function App() {
  // Trạng thái tài khoản người dùng đăng nhập (Mặc định null = chưa đăng nhập)
  const [currentUser, setCurrentUser] = useState({
    id: 4,
    fullName: "Hoàng Khách Hàng",
    email: "khachhang@gmail.com",
    phone: "0903000001",
    role: "CUSTOMER",
    membershipTier: "SILVER",
    loyaltyPoints: 850
  });

  // Trạng thái các Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [trackingTicket, setTrackingTicket] = useState(null);

  // Trạng thái tìm kiếm
  const [searchParams, setSearchParams] = useState({
    origin: "Hà Nội",
    destination: "Sa Pa",
    departDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  const [hasSearched, setHasSearched] = useState(false);
  const [filterBusType, setFilterBusType] = useState("ALL");

  // Trạng thái chuyến đang mở sơ đồ ghế & ghế đã chọn
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Danh sách chuyến xe (state để cập nhật ghế đã bán khi đặt vé mới)
  const [trips, setTrips] = useState(MOCK_TRIPS);

  // Danh sách tất cả vé của người dùng
  const [userTickets, setUserTickets] = useState([
    {
      id: 1,
      bookingCode: "BK20261106-0001",
      tripId: 1,
      tripName: "EcoBus Express VIP (Giường nằm 20 chỗ)",
      plateNumber: "29B-998.88",
      origin: "Hà Nội (Bến xe Mỹ Đình)",
      destination: "Sa Pa (Bến xe Sa Pa)",
      departureTime: "07:00",
      departureDate: "10/11/2026",
      seats: ["A01", "A02"],
      totalPrice: 640000,
      status: "CONFIRMED",
      statusText: "Đã thanh toán",
      pickupPoint: "Bến xe Mỹ Đình",
      qrCodeData: "QR-TRIP1-SEAT-A01-A02-SEC9918"
    }
  ]);

  // Trạng thái thanh toán & vé đã đặt
  const [activeCheckoutTrip, setActiveCheckoutTrip] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isNewBooking, setIsNewBooking] = useState(false);

  // Xử lý tìm kiếm
  const handleSearch = (params) => {
    setSearchParams(params);
    setHasSearched(true);
    setExpandedTripId(null);
    setSelectedSeats([]);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectPopularRoute = (route) => {
    handleSearch({
      origin: route.origin,
      destination: route.destination,
      departDate: searchParams.departDate
    });
  };

  const handleToggleExpand = (tripId) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      setSelectedSeats([]);
    } else {
      setExpandedTripId(tripId);
      setSelectedSeats([]);
    }
  };

  const handleToggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatCode));
    } else {
      if (selectedSeats.length >= 6) {
        alert("Bạn chỉ có thể chọn tối đa 6 ghế trong 1 đơn đặt vé!");
        return;
      }
      setSelectedSeats(prev => [...prev, seatCode]);
    }
  };

  // QUY TẮC: Bắt buộc đăng nhập tài khoản mới được tiếp tục đặt vé
  const handleProceedToCheckout = () => {
    const currentTrip = trips.find(t => t.id === expandedTripId);
    if (!currentTrip || selectedSeats.length === 0) return;

    if (!currentUser) {
      alert("Hệ thống yêu cầu bạn phải ĐĂNG KÝ hoặc ĐĂNG NHẬP tài khoản trước khi đặt vé!");
      setIsAuthModalOpen(true);
      return;
    }

    setActiveCheckoutTrip(currentTrip);
  };

  const handlePaymentSuccess = (orderData) => {
    // 1. Tạo bản ghi vé mới đưa vào danh sách "Vé của tôi"
    const newTicket = {
      id: Date.now(),
      bookingCode: orderData.bookingCode,
      tripId: orderData.trip.id,
      tripName: `${orderData.trip.busName} (${orderData.trip.busTypeName})`,
      plateNumber: orderData.trip.plateNumber,
      origin: `${orderData.trip.originCity} (${orderData.trip.originStation})`,
      destination: `${orderData.trip.destinationCity} (${orderData.trip.destStation})`,
      departureTime: orderData.trip.departureTime,
      departureDate: searchParams.departDate,
      seats: orderData.selectedSeats,
      totalPrice: orderData.totalPrice,
      status: "CONFIRMED",
      statusText: "Đã thanh toán",
      pickupPoint: orderData.customer.pickupPoint,
      qrCodeData: `QR-${orderData.bookingCode}`
    };

    setUserTickets(prev => [newTicket, ...prev]);

    // 2. Cập nhật các ghế vừa mua thành "Đã bán" trên chuyến xe
    setTrips(prev => prev.map(t => {
      if (t.id === orderData.trip.id) {
        return {
          ...t,
          bookedSeats: [...(t.bookedSeats || []), ...orderData.selectedSeats]
        };
      }
      return t;
    }));

    // 3. Chuyển sang màn hình hiển thị vé điện tử vừa đặt
    setActiveCheckoutTrip(null);
    setIsNewBooking(true);
    setCompletedOrder(orderData);
    setSelectedSeats([]);
  };

  const handleReset = () => {
    setHasSearched(false);
    setExpandedTripId(null);
    setSelectedSeats([]);
    setActiveCheckoutTrip(null);
    setCompletedOrder(null);
    setIsNewBooking(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lọc chuyến xe
  const filteredTrips = trips.filter(trip => {
    if (filterBusType !== "ALL" && trip.busType !== filterBusType) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      
      {/* 1. Navbar có Menu "Vé của tôi" và Nút Tài khoản */}
      <Navbar 
        currentUser={currentUser}
        onReset={handleReset} 
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          alert("Đã đăng xuất tài khoản!");
        }}
        onOpenMyTickets={() => {
          if (!currentUser) {
            alert("Vui lòng đăng nhập để xem danh sách vé của bạn!");
            setIsAuthModalOpen(true);
          } else {
            setIsMyTicketsOpen(true);
          }
        }}
        onOpenDriverMode={() => setIsDriverModalOpen(true)}
      />

      {/* 2. Màn hình hoàn tất đặt vé (E-Ticket) */}
      {completedOrder ? (
        <main className="flex-1">
          <TicketSuccess 
            orderData={completedOrder} 
            onReset={handleReset} 
            onOpenTracking={(order) => setTrackingTicket(order)}
            isNewBooking={isNewBooking}
          />
        </main>
      ) : (
        <main className="flex-1">
          
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-emerald-950 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-700/60 text-brand-300 font-semibold text-xs mb-4 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Hệ thống đặt vé xe công nghệ thông minh
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-4">
                Đặt vé xe tiện lợi cùng <br />
                <span className="bg-gradient-to-r from-brand-300 via-emerald-400 to-mint-300 bg-clip-text text-transparent">
                  Hệ thống EcoBus
                </span>
              </h1>
              <p className="text-sm sm:text-base text-brand-100/90 max-w-2xl mx-auto font-normal">
                Đăng nhập để đặt chỗ trực quan, tích điểm hội viên và quản lý vé điện tử QR code thông minh.
              </p>
            </div>
          </section>

          {/* Search Bar Widget */}
          <SearchBar 
            onSearch={handleSearch}
            initialOrigin={searchParams.origin}
            initialDest={searchParams.destination}
          />

          {/* Danh sách chuyến hoặc Tuyến phổ biến */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {hasSearched ? (
              <div id="search-results" className="scroll-mt-20 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>{searchParams.origin}</span>
                      <span className="text-brand-600">➔</span>
                      <span>{searchParams.destination}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Ngày khởi hành: <span className="font-bold text-slate-700">{searchParams.departDate}</span> • Tìm thấy <span className="font-bold text-brand-600">{filteredTrips.length} chuyến</span>
                    </p>
                  </div>

                  {/* Bộ lọc loại xe */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Loại xe:
                    </span>
                    <button
                      onClick={() => setFilterBusType("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterBusType === "ALL" ? "bg-brand-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterBusType("SLEEPER")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterBusType === "SLEEPER" ? "bg-brand-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Giường nằm (20 chỗ)
                    </button>
                    <button
                      onClick={() => setFilterBusType("LIMOUSINE")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterBusType === "LIMOUSINE" ? "bg-brand-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Limousine VIP (12 chỗ)
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTrips.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      isExpanded={expandedTripId === trip.id}
                      onToggleExpand={() => handleToggleExpand(trip.id)}
                      selectedSeats={selectedSeats}
                      onToggleSeat={handleToggleSeat}
                      onProceed={handleProceedToCheckout}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div id="popular-routes" className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Bus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Tài Khoản Hội Viên</h4>
                      <p className="text-xs text-slate-500 mt-1">Đăng ký tài khoản dễ dàng, lưu lịch sử đặt vé và nhận vé điện tử tức thì.</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Menu "Vé Của Tôi"</h4>
                      <p className="text-xs text-slate-500 mt-1">Quản lý toàn bộ vé đã mua, xem lại lịch trình và mã QR soát vé mọi lúc mọi nơi.</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Chế Độ Tài Xế Tiện Lợi</h4>
                      <p className="text-xs text-slate-500 mt-1">Tài xế đăng nhập trực tiếp trên cùng giao diện để soát vé QR của hành khách.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tuyến Đường Phổ Biến</h3>
                      <p className="text-xs text-slate-500">Bấm vào bất kỳ tuyến nào để xem chuyến và chọn chỗ ngay</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {POPULAR_ROUTES.map(route => (
                      <div 
                        key={route.id}
                        onClick={() => handleSelectPopularRoute(route)}
                        className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                      >
                        <div className="relative h-44 overflow-hidden">
                          <img 
                            src={route.image} 
                            alt={`${route.origin} - ${route.destination}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                              {route.tripsCount} chuyến/ngày • {route.duration}
                            </span>
                            <h4 className="text-lg font-black">{route.origin} ➔ {route.destination}</h4>
                          </div>
                        </div>

                        <div className="p-4 flex items-center justify-between bg-white">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Giá vé từ</span>
                            <span className="text-base font-extrabold text-brand-700">
                              {route.price.toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Thanh toán & Điền thông tin */}
          {activeCheckoutTrip && (
            <CheckoutModal
              trip={activeCheckoutTrip}
              selectedSeats={selectedSeats}
              onClose={() => setActiveCheckoutTrip(null)}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

        </main>
      )}

      {/* 3. Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          alert(`Đăng nhập thành công! Xin chào ${user.fullName}`);
        }}
      />

      {/* 4. Modal "Vé của tôi" */}
      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
        user={currentUser}
        ticketsList={userTickets}
        onOpenTracking={(ticket) => {
          setIsMyTicketsOpen(false);
          setTrackingTicket(ticket);
        }}
        onShowQrTicket={(ticket) => {
          setIsMyTicketsOpen(false);
          setIsNewBooking(false); // Không bắn pháo hoa khi chỉ xem lại vé cũ
          setCompletedOrder({
            bookingCode: ticket.bookingCode,
            customer: { fullName: currentUser?.fullName || "Khách", phone: currentUser?.phone || "0903000001", email: currentUser?.email || "" },
            trip: {
              busName: ticket.tripName,
              busTypeName: "Vé đã đặt",
              plateNumber: ticket.plateNumber,
              departureTime: ticket.departureTime,
              arrivalTime: "Dự kiến",
              originStation: ticket.origin,
              originCity: "",
              destStation: ticket.destination,
              destinationCity: ""
            },
            selectedSeats: ticket.seats,
            totalPrice: ticket.totalPrice,
            paymentMethod: "QR_VNPAY"
          });
        }}
      />

      {/* 5. Modal Chế độ Tài xế Soát vé QR */}
      <DriverCheckInModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
      />

      {/* 6. Modal Theo dõi Bản đồ hành trình xe thời gian thực */}
      <TripTrackingModal
        isOpen={Boolean(trackingTicket)}
        ticket={trackingTicket}
        onClose={() => setTrackingTicket(null)}
      />

      {/* 7. Modal Hồ sơ Người dùng & Cài đặt */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onOpenMyTickets={() => setIsMyTicketsOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setIsProfileOpen(false);
          alert("Đã đăng xuất tài khoản!");
        }}
      />

      {/* Footer */}
      <footer className="bg-brand-950 text-slate-400 py-10 border-t border-brand-900 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-brand-950 font-bold">
              <Bus className="w-4 h-4" />
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">EcoBus System</span>
            <span className="text-slate-500">| Đồ án Kiến trúc hướng dịch vụ (SOSD)</span>
          </div>
          <p>© 2026 EcoBus. Nhóm phát triển Microservices & React.</p>
        </div>
      </footer>

    </div>
  );
}
