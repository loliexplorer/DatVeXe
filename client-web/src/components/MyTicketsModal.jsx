import React from 'react';
import { X, Ticket, Calendar, MapPin, QrCode, Clock, CheckCircle2, Navigation } from 'lucide-react';

export default function MyTicketsModal({ isOpen, onClose, user, onShowQrTicket, onOpenTracking, ticketsList = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Header Modal */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900">Vé của tôi</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  {ticketsList.length} vé
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tài khoản: <span className="font-bold text-slate-800">{user?.fullName || "Khách hàng"}</span> ({user?.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách vé */}
        <div className="p-6 space-y-4">
          {ticketsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Bạn chưa có đơn đặt vé nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy tìm kiếm chuyến xe và đặt vé ngay nhé!</p>
            </div>
          ) : (
            ticketsList.map(ticket => (
              <div 
                key={ticket.id}
                className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md hover:border-brand-300"
              >
                {/* Header vé */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-200/80 px-2.5 py-1 rounded-md text-slate-700">
                      {ticket.bookingCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                      BKS: {ticket.plateNumber}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-brand-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {ticket.statusText}
                  </span>
                </div>

                {/* Thông tin chuyến */}
                <div className="py-4 space-y-2">
                  <h4 className="font-bold text-slate-900 text-base">{ticket.tripName}</h4>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-brand-700">
                      <Clock className="w-3.5 h-3.5" /> {ticket.departureTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5" /> {ticket.departureDate}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>{ticket.origin} ➔ {ticket.destination}</span>
                  </div>
                </div>

                {/* Footer vé: Ghế, Tiền và Nút xem mã QR */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Ghế đã đặt:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {ticket.seats.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-bold text-xs">
                          {s}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        ({ticket.totalPrice.toLocaleString('vi-VN')} đ)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenTracking(ticket)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5 text-brand-600" />
                      <span>Theo dõi hành trình</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onShowQrTicket(ticket)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Xem mã QR</span>
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
