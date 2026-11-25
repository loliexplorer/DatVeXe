import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, ShieldCheck, QrCode, CreditCard, CheckCircle2, Tag, AlertCircle } from 'lucide-react';
import {
  holdSeatsApi,
  releaseSeatsApi,
  createBookingApi,
  validateVoucherApi,
  applyVoucherApi,
  initiatePaymentApi,
  webhookPaymentApi,
  sendBookingEmailApi
} from '../../services/busApi';

export default function CheckoutModal({ trip, selectedSeats, currentUser, onClose, onPaymentSuccess }) {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [pickupPoint, setPickupPoint] = useState(trip.originStation);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mã giảm giá (Voucher Service)
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMsg, setVoucherMsg] = useState(null);

  const sessionIdRef = useRef(`sess_${currentUser?.id || 'guest'}_${Date.now()}`);
  const isCompletedRef = useRef(false);

  // Countdown timer: 10 phút (600s)
  const [timeLeft, setTimeLeft] = useState(600);

  // Giữ chỗ 10 phút qua booking-service khi mở modal
  useEffect(() => {
    holdSeatsApi({
      trip_id: trip.id,
      seat_codes: selectedSeats,
      session_id: sessionIdRef.current
    }).catch((err) => {
      setErrorMessage(err.message);
    });

    return () => {
      if (!isCompletedRef.current) {
        releaseSeatsApi({
          trip_id: trip.id,
          seat_codes: selectedSeats,
          session_id: sessionIdRef.current
        }).catch(() => {});
      }
    };
  }, [trip.id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const rawTotalPrice = selectedSeats.length * trip.price;
  const discountAmount = appliedVoucher ? appliedVoucher.discount_amount : 0;
  const finalPrice = Math.max(0, rawTotalPrice - discountAmount);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherMsg(null);
    try {
      const res = await validateVoucherApi({
        code: voucherCode.trim().toUpperCase(),
        order_amount: rawTotalPrice,
        route_name: `${trip.originCity} - ${trip.destinationCity} ${trip.destStation}`
      });
      setAppliedVoucher(res.data);
      setVoucherMsg({ type: 'success', text: res.message });
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherMsg({ type: 'error', text: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số điện thoại và email!");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Tạo đơn đặt vé thật qua booking-service
      const seatPriceAfterDiscount = selectedSeats.length > 0 ? Math.round(finalPrice / selectedSeats.length) : trip.price;
      const bookingRes = await createBookingApi({
        trip_id: trip.id,
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        session_id: sessionIdRef.current,
        seats: selectedSeats.map(code => ({
          seat_code: code,
          passenger_name: fullName.trim(),
          ticket_price: seatPriceAfterDiscount
        }))
      });

      const booking = bookingRes.data;
      isCompletedRef.current = true;

      // 2. Nếu có dùng voucher -> ghi nhận lượt dùng qua voucher-service
      if (appliedVoucher) {
        await applyVoucherApi({
          code: appliedVoucher.code,
          booking_code: booking.booking_code,
          order_amount: rawTotalPrice,
          route_name: `${trip.originCity} - ${trip.destinationCity} ${trip.destStation}`
        }).catch(() => {});
      }

      // 3. Khởi tạo & Xác nhận thanh toán qua payment-service
      const payMethod = paymentMethod === 'QR_VNPAY' ? 'VNPAY' : 'BANK_TRANSFER';
      const payInit = await initiatePaymentApi({
        booking_id: booking.id,
        booking_code: booking.booking_code,
        amount: finalPrice,
        payment_method: payMethod
      });
      if (payInit?.data?.payment_id) {
        await webhookPaymentApi({
          payment_id: payInit.data.payment_id,
          transaction_id: `${payMethod}-${Date.now()}`,
          gateway_status: 'SUCCESS',
          bank_code: payMethod,
          amount_paid: finalPrice
        }).catch(() => {});
      }

      // 4. Gửi Email vé điện tử kèm QR thật qua notification-service
      const emailRes = await sendBookingEmailApi({
        user_id: currentUser?.id || null,
        booking_code: booking.booking_code,
        customer_name: fullName.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        route_name: `${trip.originStation} → ${trip.destStation}`,
        departure_time: trip.departureTime,
        bus_plate: trip.plateNumber,
        total_amount: finalPrice,
        tickets: booking.tickets || []
      }).catch(() => null);

      onPaymentSuccess({
        bookingCode: booking.booking_code,
        customer: { fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), pickupPoint },
        trip,
        selectedSeats,
        totalPrice: finalPrice,
        paymentMethod: payMethod,
        tickets: booking.tickets || [],
        emailPreviewUrl: emailRes?.data?.preview_url || null
      });
    } catch (err) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đặt vé!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Header Modal */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Xác nhận thông tin & Thanh toán</h3>
            <p className="text-xs text-slate-500">Hoàn tất đặt vé trong vòng 10 phút để giữ chỗ</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh đếm ngược giữ chỗ */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-2.5 flex items-center justify-between text-amber-800 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Ghế của bạn đang được khóa giữ chỗ trên hệ thống:</span>
          </div>
          <span className="font-mono text-base font-black text-amber-700 bg-white px-2.5 py-0.5 rounded-md border border-amber-200 shadow-xs">
            {formattedTime}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {/* Tóm tắt chuyến & Ghế */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-sm">
              <span className="font-bold text-slate-800">{trip.busName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-bold">
                {trip.departureTime} ({trip.originCity} ➔ {trip.destinationCity})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
              <div>
                <span className="text-slate-400 block">Ghế đã chọn:</span>
                <span className="font-black text-brand-700 text-sm">{selectedSeats.join(', ')}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Tổng thanh toán:</span>
                {discountAmount > 0 && (
                  <span className="text-slate-400 line-through mr-1.5">{rawTotalPrice.toLocaleString('vi-VN')} đ</span>
                )}
                <span className="font-black text-slate-900 text-base">{finalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Form thông tin người đi */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
              1. Thông tin hành khách
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại nhận vé *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0903123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email nhận vé điện tử (QR) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm đón trả</label>
                <select
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium bg-white"
                >
                  <option value={trip.originStation}>{trip.originStation} (Bến chính)</option>
                  <option value="Đón tại Văn phòng Phố Cổ">Đón tại Văn phòng Phố Cổ (Trung chuyển miễn phí)</option>
                  <option value="Đón tại Sân bay Nội Bài">Đón tại Sân bay Nội Bài</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mã giảm giá (Voucher Service) */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">
              2. Mã khuyến mãi (Tùy chọn)
            </h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (VD: CHAOBANMOI, VEXETET50, SAPA2026)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-semibold uppercase"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyVoucher}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all"
              >
                Áp dụng
              </button>
            </div>
            {voucherMsg && (
              <p className={`text-xs font-semibold mt-1.5 ${voucherMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {voucherMsg.text}
              </p>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
              3. Phương thức thanh toán
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: QR VNPAY / MoMo */}
              <label 
                className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === "QR_VNPAY"
                    ? "border-brand-600 bg-brand-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QR_VNPAY"
                  checked={paymentMethod === "QR_VNPAY"}
                  onChange={() => setPaymentMethod("QR_VNPAY")}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-brand-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Quét mã QR Ngân hàng / VNPay</span>
                  <span className="text-[11px] text-slate-500">Khuyên dùng - Xử lý tức thì</span>
                </div>
              </label>

              {/* Option 2: Chuyển khoản / Thẻ */}
              <label 
                className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-brand-600 bg-brand-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 block">Chuyển khoản VietQR Napas247</span>
                  <span className="text-[11px] text-slate-500">Miễn phí thanh toán</span>
                </div>
              </label>

            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-black text-base shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý đặt vé & thanh toán...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Xác nhận thanh toán {finalPrice.toLocaleString('vi-VN')} đ</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Kết nối trực tiếp Booking • Voucher • Payment • Notification Service
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}
