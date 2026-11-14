import React, { useState } from 'react';
import { 
  X, Ticket, Calendar, MapPin, QrCode, Clock, 
  CheckCircle2, Navigation, AlertTriangle, ArrowRight,
  RotateCcw, Star, ShieldAlert
} from 'lucide-react';

export default function MyTicketsModal({ 
  isOpen, 
  onClose, 
  user, 
  onShowQrTicket, 
  onOpenTracking, 
  ticketsList = [],
  onCancelTicket,
  onOpenReviews
}) {
  if (!isOpen) return null;

  // Trạng thái modal xác nhận hủy vé
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  const handleConfirmCancel = () => {
    if (!ticketToCancel) return;
    onCancelTicket(ticketToCancel.id);
    setCancelSuccessMsg(`Đã hủy thành công vé ${ticketToCancel.bookingCode}. Tiền hoàn đang được xử lý theo chính sách.`);
    setTicketToCancel(null);
    setTimeout(() => setCancelSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden relative">
        
        {/* Header Modal */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
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

        {/* Thông báo hủy vé thành công nếu có */}
        {cancelSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}

        {/* Nội dung danh sách vé */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {ticketsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Bạn chưa có đơn đặt vé nào</p>
              <p className="text-xs text-slate-400 mt-1">Hãy tìm kiếm chuyến xe và đặt vé ngay nhé!</p>
            </div>
          ) : (
            ticketsList.map(ticket => {
              const isCancelled = ticket.status === 'CANCELLED';

              return (
                <div 
                  key={ticket.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isCancelled 
                      ? "bg-slate-100/70 border-slate-200 opacity-75" 
                      : "bg-slate-50 hover:bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-brand-300"
                  }`}
                >
                  {/* Header vé */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md ${
                        isCancelled ? "bg-slate-200 text-slate-500 line-through" : "bg-slate-200/80 text-slate-700"
                      }`}>
                        {ticket.bookingCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                        BKS: {ticket.plateNumber}
                      </span>
                    </div>

                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Đã hủy & Hoàn tiền
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-brand-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {ticket.statusText || "Đã thanh toán"}
                      </span>
                    )}
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

                  {/* Footer vé: Ghế, Tiền và Các nút hành động */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Ghế đã đặt:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {ticket.seats.map(s => (
                          <span key={s} className={`px-2 py-0.5 rounded font-bold text-xs ${
                            isCancelled ? "bg-slate-200 text-slate-400 line-through" : "bg-brand-100 text-brand-800"
                          }`}>
                            {s}
                          </span>
                        ))}
                        <span className="text-xs text-slate-500 font-medium ml-1">
                          ({ticket.totalPrice.toLocaleString('vi-VN')} đ)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {!isCancelled && (
                        <>
                          {/* Nút Hủy vé */}
                          <button
                            type="button"
                            onClick={() => setTicketToCancel(ticket)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all"
                            title="Yêu cầu hủy vé và hoàn tiền"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Hủy vé</span>
                          </button>

                          {/* Nút Theo dõi hành trình */}
                          <button
                            type="button"
                            onClick={() => onOpenTracking(ticket)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-brand-800 border border-brand-200 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <Navigation className="w-3.5 h-3.5 text-brand-600" />
                            <span>Theo dõi xe</span>
                          </button>

                          {/* Nút Xem mã QR */}
                          <button
                            type="button"
                            onClick={() => onShowQrTicket(ticket)}
                            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã QR</span>
                          </button>
                        </>
                      )}

                      {/* Nút Đánh giá chuyến xe */}
                      <button
                        type="button"
                        onClick={() => onOpenReviews(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 transition-all"
                        title="Đánh giá chất lượng chuyến xe"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Đánh giá</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all shadow-xs"
          >
            Đóng
          </button>
        </div>

        {/* MODAL POPUP: XÁC NHẬN HỦY VÉ & CHÍNH SÁCH HOÀN TIỀN */}
        {ticketToCancel && (
          <div className="absolute inset-0 z-20 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">Xác nhận Hủy Vé Xe?</h4>
                  <p className="text-xs text-slate-500">Mã đơn: <span className="font-mono font-bold text-slate-800">{ticketToCancel.bookingCode}</span></p>
                </div>
              </div>

              {/* Thông tin vé hủy */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chuyến đi:</span>
                  <span className="font-bold text-slate-800">{ticketToCancel.tripName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ghế hủy:</span>
                  <span className="font-bold text-brand-700">{ticketToCancel.seats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền đã thanh toán:</span>
                  <span className="font-bold text-slate-900">{ticketToCancel.totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Bảng chính sách hoàn tiền */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <span className="font-bold block text-amber-800">📋 Chính sách hoàn hủy của nhà xe:</span>
                <p>• Hủy trước 24 giờ khởi hành: <strong className="text-emerald-700">Hoàn 100%</strong> (phí 0đ)</p>
                <p>• Hủy từ 12 - 24 giờ khởi hành: <strong>Hoàn 50%</strong> giá trị vé</p>
                <p>• Hủy dưới 12 giờ: Không áp dụng hoàn tiền</p>
                <p className="text-[11px] text-amber-700 pt-1">
                  * Số tiền hoàn sẽ tự động được gửi lại qua phương thức thanh toán ban đầu của quý khách.
                </p>
              </div>

              {/* Nút hành động */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Giữ lại vé
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20"
                >
                  Đồng ý hủy & Hoàn tiền
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
