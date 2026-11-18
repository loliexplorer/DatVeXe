import React, { useState } from 'react';
import { Clock, Star, Wifi, Coffee, Usb, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import SeatMap from './SeatMap';

export default function TripCard({ trip, onSelectTrip, isExpanded, onToggleExpand, selectedSeats, onToggleSeat, onProceed, onOpenReviews }) {
  const availableSeatsCount = trip.totalSeats - (trip.bookedSeats?.length || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden mb-4">
      {/* Thẻ chuyến xe chính */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Thông tin nhà xe & Lộ trình */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2.5 flex-wrap">
              <span className="font-extrabold text-lg text-slate-900">{trip.busName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-semibold">
                {trip.busTypeName}
              </span>
              <button
                type="button"
                onClick={() => onOpenReviews && onOpenReviews(trip)}
                className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-0.5 rounded-md transition-all cursor-pointer"
                title="Bấm để xem các đánh giá từ hành khách"
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>{trip.rating}</span>
                <span className="text-slate-500 font-normal underline">({trip.reviewsCount} đánh giá)</span>
              </button>
            </div>

            {/* Lịch trình giờ chạy */}
            <div className="flex items-center gap-4 sm:gap-8 my-3">
              <div>
                <span className="text-2xl font-black text-slate-800">{trip.departureTime}</span>
                <span className="block text-xs font-semibold text-slate-500">{trip.originStation}</span>
              </div>

              {/* Đường gạch thời lượng */}
              <div className="flex-1 max-w-[160px] flex flex-col items-center">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> {trip.duration}
                </span>
                <div className="w-full flex items-center">
                  <div className="w-2 h-2 rounded-full bg-brand-600"></div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-600 via-emerald-400 to-emerald-600"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                </div>
                <span className="text-[10px] text-brand-600 font-semibold mt-1">Chạy thẳng</span>
              </div>

              <div>
                <span className="text-2xl font-black text-slate-800">{trip.arrivalTime}</span>
                <span className="block text-xs font-semibold text-slate-500">{trip.destStation}</span>
              </div>
            </div>

            {/* Tiện ích xe */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              {trip.amenities.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md text-[11px]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Cột giá vé & Nút chọn chỗ */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div className="text-left lg:text-right">
              <span className="text-xs text-slate-400 line-through mr-2">
                {(trip.price * 1.15).toLocaleString('vi-VN')} đ
              </span>
              <div className="text-2xl font-black text-brand-700">
                {trip.price.toLocaleString('vi-VN')} <span className="text-sm font-semibold">đ</span>
              </div>
              <span className={`text-xs font-semibold block mt-0.5 ${availableSeatsCount > 5 ? "text-emerald-600" : "text-amber-600"}`}>
                Còn {availableSeatsCount} chỗ trống
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleExpand}
              className={`mt-3 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
                isExpanded
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-brand-500 hover:bg-brand-400 text-brand-950 shadow-brand-500/20 active:scale-95"
              }`}
            >
              <span>{isExpanded ? "Đóng sơ đồ" : "Chọn chỗ"}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Sơ đồ chọn ghế mở rộng */}
      {isExpanded && (
        <SeatMap 
          trip={trip}
          selectedSeats={selectedSeats}
          onToggleSeat={onToggleSeat}
          onProceed={onProceed}
        />
      )}
    </div>
  );
}
