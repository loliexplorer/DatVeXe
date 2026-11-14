import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, QrCode, Download, Printer, Home, Bus, Calendar, MapPin, Ticket, Navigation } from 'lucide-react';

export default function TicketSuccess({ orderData, onReset, onOpenTracking, isNewBooking = false }) {
  useEffect(() => {
    // Chỉ kích hoạt pháo hoa chúc mừng nếu vừa thanh toán mới thành công
    if (isNewBooking) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isNewBooking]);

  const { bookingCode, customer, trip, selectedSeats, totalPrice, paymentMethod } = orderData;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-fadeIn">
      
      {/* Banner đầu trang: Phân biệt giữa Vừa đặt thành công vs Xem lại vé từ 'Vé của tôi' */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md ${
          isNewBooking 
            ? "bg-emerald-100 text-brand-600 shadow-emerald-500/20" 
            : "bg-slate-100 text-brand-700 shadow-slate-200"
        }`}>
          {isNewBooking ? (
            <CheckCircle className="w-10 h-10 stroke-[2.5]" />
          ) : (
            <QrCode className="w-9 h-9" />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isNewBooking ? "Đặt Vé Thành Công!" : "Thông Tin Vé Điện Tử • Mã QR"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isNewBooking ? (
            <>Thông tin vé điện tử đã được gửi tới email <span className="font-bold text-slate-800">{customer?.email}</span></>
          ) : (
            "Xuất trình mã QR dưới đây cho tài xế hoặc nhân viên soát vé khi lên xe"
          )}
        </p>
      </div>

      {/* Vé điện tử E-Ticket */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xl overflow-hidden relative">
        
        {/* Phần đầu vé */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-brand-300 font-bold block mb-1">
                Vé điện tử xe khách • E-Ticket
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">{trip.busName}</h3>
              <p className="text-xs text-brand-200 font-medium">{trip.busTypeName} • BKS: {trip.plateNumber}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right">
              <span className="text-[10px] uppercase tracking-wider text-brand-200 block">Mã đặt chỗ</span>
              <span className="font-mono text-base font-black tracking-wider text-white">{bookingCode}</span>
            </div>
          </div>
        </div>

        {/* Thân vé: Thông tin chi tiết */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Tuyến đường & Giờ chạy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" /> Điểm khởi hành
              </span>
              <span className="text-xl font-black text-slate-900 block">{trip.departureTime}</span>
              <span className="font-bold text-slate-800 text-sm block">{trip.originStation}</span>
              <span className="text-xs text-slate-500">{trip.originCity}</span>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400 font-medium flex items-center sm:justify-end gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Điểm đến
              </span>
              <span className="text-xl font-black text-slate-900 block">{trip.arrivalTime}</span>
              <span className="font-bold text-slate-800 text-sm block">{trip.destStation}</span>
              <span className="text-xs text-slate-500">{trip.destinationCity}</span>
            </div>
          </div>

          {/* Chi tiết hành khách & Ghế */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-y border-slate-100 py-4">
            <div>
              <span className="text-slate-400 block mb-1">Hành khách</span>
              <span className="font-bold text-slate-800 text-sm">{customer?.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Số điện thoại</span>
              <span className="font-bold text-slate-800 text-sm">{customer?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Vị trí ghế ({selectedSeats.length})</span>
              <span className="font-black text-brand-700 text-base">{selectedSeats.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Tổng tiền thanh toán</span>
              <span className="font-black text-slate-900 text-base">{totalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Khu vực mã QR để tài xế soát vé */}
          <div className="bg-emerald-50/60 rounded-2xl p-6 border-2 border-dashed border-brand-300 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white font-bold text-xs uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5" /> Mã QR Soát Vé
              </span>
              <h4 className="font-bold text-slate-800 text-base pt-2">Dùng để lên xe</h4>
              <p className="text-xs text-slate-600 max-w-sm">
                Vui lòng xuất trình mã QR này cho tài xế hoặc phụ xe khi lên xe để quét điểm danh (Check-in).
              </p>
            </div>

            {/* Mô phỏng mã QR đồ họa sắc nét */}
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 text-center">
              <div className="w-28 h-28 bg-slate-900 rounded-lg flex items-center justify-center p-2 text-white">
                <QrCode className="w-full h-full text-emerald-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                {bookingCode}
              </span>
            </div>
          </div>

        </div>

        {/* Nút hành động */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => onOpenTracking && onOpenTracking(orderData)}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Navigation className="w-4 h-4 text-brand-600" /> Theo dõi lộ trình xe
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" /> In vé
            </button>
          </div>

          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </button>
        </div>

      </div>

    </div>
  );
}
