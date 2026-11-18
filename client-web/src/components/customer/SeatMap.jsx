import React, { useState } from 'react';
import { Check, Disc, Armchair, Sparkles, Crown } from 'lucide-react';

export default function SeatMap({ trip, selectedSeats, onToggleSeat, onProceed }) {
  const isLimousine = trip.busType === "LIMOUSINE";
  const [activeFloor, setActiveFloor] = useState(1);

  // Sinh danh sách ghế dựa theo loại xe
  let currentSeats = [];

  if (isLimousine) {
    // Xe Limousine 12 chỗ (1 tầng duy nhất, mã ghế L01 - L12)
    currentSeats = Array.from({ length: 12 }, (_, i) => {
      const code = `L${String(i + 1).padStart(2, '0')}`;
      return {
        code,
        floor: 1,
        type: i >= 2 && i <= 7 ? "VIP MASSAGE" : "TIÊU CHUẨN",
        isBooked: trip.bookedSeats?.includes(code)
      };
    });
  } else {
    // Xe Giường nằm 20 chỗ (2 tầng: A01-A10 tầng 1, B01-B10 tầng 2)
    const floor1Seats = Array.from({ length: 10 }, (_, i) => {
      const code = `A${String(i + 1).padStart(2, '0')}`;
      return {
        code,
        floor: 1,
        type: i < 2 ? "CABIN VIP" : "GIƯỜNG ĐƠN",
        isBooked: trip.bookedSeats?.includes(code)
      };
    });

    const floor2Seats = Array.from({ length: 10 }, (_, i) => {
      const code = `B${String(i + 1).padStart(2, '0')}`;
      return {
        code,
        floor: 2,
        type: i < 2 ? "CABIN VIP" : "GIƯỜNG ĐƠN",
        isBooked: trip.bookedSeats?.includes(code)
      };
    });

    currentSeats = activeFloor === 1 ? floor1Seats : floor2Seats;
  }

  const totalPrice = selectedSeats.length * trip.price;

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-6 rounded-b-2xl animate-fadeIn">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Cột trái: Sơ đồ xe */}
        <div className="flex-1 w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Header chọn tầng */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-base">
                  {isLimousine ? "Sơ đồ xe Limousine 12 chỗ VIP" : "Sơ đồ xe Giường nằm 20 chỗ"}
                </h4>
                {isLimousine && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600" /> Ghế hạng thương gia
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLimousine 
                  ? "Xe 1 tầng rộng rãi, ghế ngả bọc da cao cấp" 
                  : "Bấm vào ghế để chọn hoặc bỏ chọn tầng dưới / tầng trên"}
              </p>
            </div>

            {/* Chỉ hiện nút chuyển tầng nếu là xe Giường nằm 2 tầng */}
            {!isLimousine && (
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFloor(1)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFloor === 1 
                      ? "bg-brand-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tầng dưới (A)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFloor(2)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFloor === 2 
                      ? "bg-brand-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tầng trên (B)
                </button>
              </div>
            )}
          </div>

          {/* Mô phỏng khung xe */}
          <div className="max-w-md mx-auto bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 relative">
            
            {/* Đầu xe & Vô lăng */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 text-slate-400">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Disc className="w-5 h-5 text-brand-600 animate-spin-slow" />
                Vô lăng tài xế
              </div>
              <span className="text-[11px] font-medium bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                Cửa lên xuống
              </span>
            </div>

            {/* Lưới bố trí ghế ngồi */}
            {isLimousine ? (
              /* Bố trí xe Limousine 12 chỗ: 2 ghế đầu + 3 hàng ghế đôi 2 bên */
              <div className="space-y-4">
                {/* 2 Ghế đầu cạnh tài xế (L01, L02) */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-dashed border-slate-200">
                  {currentSeats.slice(0, 2).map(seat => renderSeatButton(seat))}
                </div>

                {/* Các ghế khoang VIP phía sau (L03 -> L12) */}
                <div className="grid grid-cols-2 gap-4">
                  {currentSeats.slice(2).map(seat => renderSeatButton(seat))}
                </div>
              </div>
            ) : (
              /* Bố trí xe Giường nằm: 2 dãy đối xứng */
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {currentSeats.map(seat => renderSeatButton(seat))}
              </div>
            )}

            {/* Chú thích màu sắc */}
            <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white border border-slate-300"></span>
                <span className="text-slate-600">Còn trống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-brand-500 border border-brand-600"></span>
                <span className="text-slate-800 font-semibold">Đang chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></span>
                <span className="text-slate-400">Đã bán</span>
              </div>
            </div>

          </div>
        </div>

        {/* Cột phải: Bảng thanh toán & Tóm tắt */}
        <div className="w-full lg:w-80 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-3">Tóm tắt chỗ ngồi</h4>
            
            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Dòng xe:</span>
                <span className="font-semibold text-slate-800">{trip.busTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tuyến xe:</span>
                <span className="font-semibold text-slate-800">{trip.originCity} ➔ {trip.destinationCity}</span>
              </div>
              <div className="flex justify-between">
                <span>Giờ xuất bến:</span>
                <span className="font-semibold text-slate-800">{trip.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá / vé:</span>
                <span className="font-semibold text-brand-700">{trip.price.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="py-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 block mb-1">Ghế bạn đã chọn:</span>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-md bg-brand-50 border border-brand-200 text-brand-800 font-bold text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">Chưa chọn ghế nào</p>
              )}
            </div>

            <div className="pt-4 flex items-baseline justify-between mb-6">
              <span className="text-sm font-medium text-slate-700">Tổng tiền tạm tính:</span>
              <span className="text-2xl font-black text-brand-600">
                {totalPrice.toLocaleString('vi-VN')} <span className="text-sm font-semibold">đ</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={onProceed}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              selectedSeats.length > 0
                ? "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-brand-500/25 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {selectedSeats.length > 0 
              ? `Tiếp tục đặt ${selectedSeats.length} vé` 
              : "Vui lòng chọn ít nhất 1 ghế"}
          </button>
        </div>

      </div>
    </div>
  );

  // Helper render từng nút bấm ghế
  function renderSeatButton(seat) {
    const isSelected = selectedSeats.includes(seat.code);
    const isBooked = seat.isBooked;

    return (
      <button
        key={seat.code}
        type="button"
        disabled={isBooked}
        onClick={() => onToggleSeat(seat.code)}
        className={`h-16 rounded-xl flex items-center justify-between px-3 transition-all relative border-2 ${
          isBooked
            ? "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
            : isSelected
            ? "bg-gradient-to-r from-brand-500 to-brand-600 border-brand-700 text-white shadow-md shadow-brand-500/30 scale-105"
            : "bg-white hover:bg-emerald-50/80 border-slate-200 hover:border-brand-400 text-slate-700 cursor-pointer shadow-sm hover:scale-[1.02]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Armchair className={`w-6 h-6 ${isSelected ? "text-white" : isBooked ? "text-slate-400" : isLimousine ? "text-amber-600" : "text-brand-600"}`} />
          <div className="text-left">
            <span className="font-extrabold text-sm block leading-none">{seat.code}</span>
            <span className="text-[10px] opacity-80">{seat.type}</span>
          </div>
        </div>

        {isSelected && (
          <span className="w-5 h-5 rounded-full bg-white text-brand-700 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        )}
        {isBooked && (
          <span className="text-[10px] font-bold text-slate-500">Đã bán</span>
        )}
      </button>
    );
  }
}
