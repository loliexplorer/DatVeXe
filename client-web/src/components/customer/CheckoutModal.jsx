import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, ShieldCheck, QrCode, CreditCard, CheckCircle2, Tag, AlertCircle, Copy, Check, ArrowLeft } from 'lucide-react';
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

const SUPPORTED_QR_APPS = [
  { id: 'MBBank', name: 'MBBank', badge: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600' },
  { id: 'VPBank', name: 'VPBank', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' },
  { id: 'BIDV', name: 'BIDV', badge: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-600' },
  { id: 'Techcombank', name: 'Techcombank', badge: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-600' },
  { id: 'VietinBank', name: 'VietinBank', badge: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-600' },
  { id: 'MoMo', name: 'Ví MoMo', badge: 'bg-pink-50 text-pink-800 border-pink-200', dot: 'bg-pink-600' }
];

export default function CheckoutModal({ trip, selectedSeats, currentUser, onClose, onPaymentSuccess }) {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'PAY'
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [pickupPoint, setPickupPoint] = useState(trip.originStation);
  const [paymentMethod, setPaymentMethod] = useState('QR_PAYMENT'); // 'QR_PAYMENT' | 'BANK_TRANSFER'
  const [selectedQrApp, setSelectedQrApp] = useState('MBBank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dữ liệu đơn & thanh toán đã khởi tạo ở Bước 2
  const [pendingBooking, setPendingBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

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

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

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

  // Bước 1 -> Bước 2: Tạo đơn vé & Khởi tạo mã VietQR / Thông tin chuyển khoản MB Bank
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số điện thoại và email!");
      return;
    }

    setIsProcessing(true);
    try {
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

      if (appliedVoucher) {
        await applyVoucherApi({
          code: appliedVoucher.code,
          booking_code: booking.booking_code,
          order_amount: rawTotalPrice,
          route_name: `${trip.originCity} - ${trip.destinationCity} ${trip.destStation}`
        }).catch(() => {});
      }

      const backendMethod = paymentMethod === 'QR_PAYMENT'
        ? (selectedQrApp === 'MoMo' ? 'MOMO' : 'BANK_TRANSFER')
        : 'BANK_TRANSFER';

      const payInit = await initiatePaymentApi({
        booking_id: booking.id,
        booking_code: booking.booking_code,
        amount: finalPrice,
        payment_method: backendMethod
      });

      setPendingBooking(booking);
      setPaymentInfo(payInit.data);
      setStep('PAY');
    } catch (err) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi khởi tạo thanh toán!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bước 2 -> Hoàn tất: Xác nhận đã chuyển khoản / quét QR (gọi webhook + gửi Email vé QR)
  const handleConfirmPaid = async () => {
    if (!pendingBooking || !paymentInfo) return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const bankTag = paymentMethod === 'QR_PAYMENT' ? selectedQrApp.toUpperCase() : 'MBBANK';
      await webhookPaymentApi({
        payment_id: paymentInfo.payment_id,
        transaction_id: `${bankTag}-${Date.now()}`,
        gateway_status: 'SUCCESS',
        bank_code: bankTag,
        amount_paid: finalPrice
      });

      const emailRes = await sendBookingEmailApi({
        user_id: currentUser?.id || null,
        booking_code: pendingBooking.booking_code,
        customer_name: fullName.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        route_name: `${trip.originStation} → ${trip.destStation}`,
        departure_time: trip.departureTime,
        bus_plate: trip.plateNumber,
        total_amount: finalPrice,
        tickets: pendingBooking.tickets || []
      }).catch(() => null);

      onPaymentSuccess({
        bookingCode: pendingBooking.booking_code,
        customer: { fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), pickupPoint },
        trip,
        selectedSeats,
        totalPrice: finalPrice,
        paymentMethod: paymentMethod === 'QR_PAYMENT' ? `QR (${selectedQrApp})` : 'Chuyển khoản MB Bank',
        tickets: pendingBooking.tickets || [],
        emailPreviewUrl: emailRes?.data?.preview_url || null
      });
    } catch (err) {
      setErrorMessage(err.message || 'Không thể xác nhận giao dịch lúc này!');
    } finally {
      setIsProcessing(false);
    }
  };

  const bankInfo = paymentInfo?.bank_info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Header Modal */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {step === 'FORM' ? 'Xác nhận thông tin & Chọn thanh toán' : 'Thanh toán đơn vé xe'}
            </h3>
            <p className="text-xs text-slate-500">
              {step === 'FORM'
                ? 'Hoàn tất đặt vé trong vòng 10 phút để giữ chỗ'
                : `Mã đơn hàng: ${pendingBooking?.booking_code || ''}`}
            </p>
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

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'FORM' ? (
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-6">
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

            {/* Mã giảm giá */}
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
                {/* Option 1: Quét mã QR đa ngân hàng & MoMo */}
                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'QR_PAYMENT'
                      ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'QR_PAYMENT'}
                    onChange={() => setPaymentMethod('QR_PAYMENT')}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-brand-700 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 block">Thanh toán quét mã QR</span>
                    <span className="text-[11px] text-slate-500">Hỗ trợ MB, VP, BIDV, TCB, Vietin, MoMo</span>
                  </div>
                </label>

                {/* Option 2: Chuyển khoản trực tiếp về MB Bank */}
                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800 block">Chuyển khoản MB Bank</span>
                    <span className="text-[11px] text-slate-500">Chuyển khoản nhanh 24/7 về tài khoản MB</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Nút tiếp tục sang màn hình QR / Chuyển khoản */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-black text-base shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang tạo mã thanh toán...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Tiếp tục thanh toán {finalPrice.toLocaleString('vi-VN')} đ</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                Chuẩn liên ngân hàng VietQR Napas247 • Tự điền sẵn số tiền & nội dung
              </p>
            </div>
          </form>
        ) : (
          /* BƯỚC 2: HIỂN THỊ MÃ VIETQR THẬT & THÔNG TIN CHUYỂN KHOẢN MB BANK */
          <div className="p-6 space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Cột trái: Ảnh mã VietQR động */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 mb-3">
                  <QrCode className="w-3.5 h-3.5" />
                  {paymentMethod === 'QR_PAYMENT' ? 'Quét mã VietQR để thanh toán' : 'Quét nhanh VietQR MB Bank'}
                </span>

                {bankInfo?.qr_code_image_url && (
                  <img
                    src={bankInfo.qr_code_image_url}
                    alt="VietQR MB Bank"
                    className="w-60 h-auto mx-auto rounded-xl border border-slate-200 bg-white shadow-sm"
                  />
                )}

                <p className="text-[11px] text-slate-500 mt-2.5">
                  Hỗ trợ quét bởi: <strong>MBBank, VPBank, BIDV, Techcombank, VietinBank, MoMo</strong>
                </p>
              </div>

              {/* Cột phải: Thông tin chuyển khoản MB Bank có nút Copy */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                  Thông tin chuyển khoản MB Bank
                </h4>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Ngân hàng</span>
                    <span className="font-bold text-slate-900">{bankInfo?.bank_name || 'MBBank'}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Chủ tài khoản</span>
                    <span className="font-bold text-slate-900">{bankInfo?.account_name}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-slate-500 block">Số tài khoản</span>
                      <span className="font-mono font-black text-base text-brand-700">{bankInfo?.account_number}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('acc', bankInfo?.account_number)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-brand-500 text-slate-700 font-bold flex items-center gap-1"
                    >
                      {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'acc' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-slate-500 block">Số tiền</span>
                      <span className="font-mono font-black text-base text-rose-600">
                        {Number(bankInfo?.amount || finalPrice).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('amt', bankInfo?.amount || finalPrice)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-brand-500 text-slate-700 font-bold flex items-center gap-1"
                    >
                      {copiedKey === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'amt' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Nội dung chuyển khoản</span>
                      <span className="font-mono font-bold text-slate-900">{bankInfo?.transfer_content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('msg', bankInfo?.transfer_content)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-brand-500 text-slate-700 font-bold flex items-center gap-1"
                    >
                      {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'msg' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Để sau
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPaid}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 disabled:opacity-60 text-white font-black text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xác nhận giao dịch & xuất vé...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Tôi đã thanh toán • Xác nhận xuất vé QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
