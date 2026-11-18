import React, { useState } from 'react';
import { 
  X, Lock, Mail, Phone, User, LogIn, UserPlus, 
  Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, 
  ShieldCheck, KeyRound, Sparkles
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  if (!isOpen) return null;

  // Trạng thái form: 'login' | 'register' | 'forgot_password'
  const [mode, setMode] = useState('login'); 

  // Trường thông tin đăng nhập / đăng ký
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Trạng thái ẩn / hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Thông báo lỗi
  const [errorMessage, setErrorMessage] = useState('');

  // Xử lý gửi form Đăng nhập / Đăng ký
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'register') {
      if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
        setErrorMessage("Vui lòng điền đầy đủ tất cả các trường thông tin!");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Mật khẩu phải có tối thiểu 6 ký tự!");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
        return;
      }
      if (!agreeTerms) {
        setErrorMessage("Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật!");
        return;
      }

      // Giả lập đăng ký thành công tài khoản Khách hàng
      onLoginSuccess({
        id: Date.now(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: "CUSTOMER",
        membershipTier: "BRONZE",
        loyaltyPoints: 0
      });
      onClose();
    } else if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu!");
        return;
      }

      // Nhận diện vai trò từ email
      const lowerEmail = email.toLowerCase().trim();
      let role = "CUSTOMER";
      let name = "Hoàng Khách Hàng";
      let tier = "SILVER";
      let points = 850;

      if (lowerEmail.includes("driver")) {
        role = "DRIVER";
        name = "Trần Văn Lái (Tài xế)";
        tier = "BRONZE";
        points = 0;
      } else if (lowerEmail.includes("admin")) {
        role = "ADMIN";
        name = "Nguyễn Quản Trị (Admin)";
        tier = "GOLD";
        points = 2500;
      }

      onLoginSuccess({
        id: role === "ADMIN" ? 1 : (role === "DRIVER" ? 2 : 4),
        fullName: name,
        email: lowerEmail,
        phone: "0903000001",
        role: role,
        membershipTier: tier,
        loyaltyPoints: points
      });
      onClose();
    }
  };

  // Xử lý gửi yêu cầu quên mật khẩu
  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email của bạn!");
      return;
    }
    setErrorMessage('');
    setForgotSuccess(true);
  };

  // Nút đăng nhập nhanh mẫu để test đồ án / demo
  const handleQuickLogin = (roleType) => {
    setErrorMessage('');
    if (roleType === "CUSTOMER") {
      onLoginSuccess({
        id: 4,
        fullName: "Hoàng Khách Hàng",
        email: "khachhang@gmail.com",
        phone: "0903000001",
        role: "CUSTOMER",
        membershipTier: "SILVER",
        loyaltyPoints: 850
      });
    } else if (roleType === "DRIVER") {
      onLoginSuccess({
        id: 2,
        fullName: "Trần Văn Lái (Tài xế)",
        email: "driver1@vexere.com",
        phone: "0902000001",
        role: "DRIVER",
        membershipTier: "BRONZE",
        loyaltyPoints: 0
      });
    } else if (roleType === "ADMIN") {
      onLoginSuccess({
        id: 1,
        fullName: "Nguyễn Quản Trị (Admin)",
        email: "admin@vexere.com",
        phone: "0901000001",
        role: "ADMIN",
        membershipTier: "GOLD",
        loyaltyPoints: 2500
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-brand-900 via-emerald-950 to-brand-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-widest text-brand-300 uppercase">
              Hệ Thống Đặt Xe Trực Tuyến
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {mode === 'register' && "Đăng Ký Tài Khoản Mới"}
            {mode === 'login' && "Đăng Nhập Tài Khoản"}
            {mode === 'forgot_password' && "Khôi Phục Mật Khẩu"}
          </h3>
          
          <p className="text-xs text-brand-200 mt-1">
            {mode === 'register' && "Tạo tài khoản thành viên để tích điểm và nhận ưu đãi chuyến đi"}
            {mode === 'login' && "Vui lòng đăng nhập để tiếp tục chọn chỗ và xuất vé điện tử"}
            {mode === 'forgot_password' && "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu"}
          </p>
        </div>

        {/* Tab chuyển Đăng nhập / Đăng ký (chỉ hiện khi không ở màn Quên mật khẩu) */}
        {mode !== 'forgot_password' && (
          <div className="flex border-b border-slate-200 text-sm font-bold bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-3 text-center transition-all ${
                mode === 'login' 
                  ? "bg-white text-brand-700 border-b-2 border-brand-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-3 text-center transition-all ${
                mode === 'register' 
                  ? "bg-white text-brand-700 border-b-2 border-brand-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: Màn Quên Mật Khẩu */}
        {mode === 'forgot_password' ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            {forgotSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Đã gửi mã khôi phục!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Hệ thống đã gửi hướng dẫn đặt lại mật khẩu đến email <span className="font-bold text-brand-700">{forgotEmail}</span>. Vui lòng kiểm tra hộp thư đến.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setForgotSuccess(false); setForgotEmail(''); }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-md"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Địa chỉ Email đăng ký *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="vd: khachhang@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Gửi mã xác thực khôi phục</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(''); }}
                  className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại trang Đăng nhập
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Modal Body: Màn Đăng Nhập / Đăng Ký */
          <form onSubmit={handleSubmit} className="p-6 space-y-3.5 overflow-y-auto">
            
            {/* Các trường dành riêng cho Đăng Ký */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email (Dùng chung cho cả 2) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Mật khẩu (Có nút con mắt 👁️) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ô Nhập lại mật khẩu (Chỉ hiện khi Đăng ký, có nút con mắt 👁️) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Xác nhận lại mật khẩu *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu trên"
                    className={`w-full pl-10 pr-10 py-2 rounded-xl border outline-none text-sm font-medium ${
                      confirmPassword && confirmPassword !== password
                        ? "border-rose-400 bg-rose-50/40 focus:ring-rose-200"
                        : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <span className="text-[11px] text-rose-500 font-medium block mt-1">
                    ⚠️ Mật khẩu xác nhận chưa khớp
                  </span>
                )}
              </div>
            )}

            {/* Checkbox Ghi nhớ đăng nhập & Quên mật khẩu khi ở tab Đăng nhập */}
            {mode === 'login' ? (
              <div className="flex items-center justify-between text-xs pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setErrorMessage(''); }}
                  className="font-bold text-brand-700 hover:text-brand-800 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            ) : (
              /* Checkbox Đồng ý điều khoản khi ở tab Đăng ký */
              <div className="pt-1 pb-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600 font-normal">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 mt-0.5 cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý với <a href="#" className="font-semibold text-brand-700 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="font-semibold text-brand-700 hover:underline">Chính sách bảo mật</a> của EcoBus.
                  </span>
                </label>
              </div>
            )}

            {/* Nút Submit chính */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {mode === 'register' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{mode === 'register' ? "Đăng ký thành viên" : "Đăng nhập ngay"}</span>
            </button>

            {/* Tiện ích đăng nhập mẫu 1-click dành cho chấm bài / demo */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                ⚡ Đăng nhập thử nhanh theo từng vai trò (Dành cho kiểm thử):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("CUSTOMER")}
                  className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-brand-200 text-brand-800 font-bold text-[11px] transition-all"
                  title="Đăng nhập tài khoản Khách hàng"
                >
                  👤 Khách hàng
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("DRIVER")}
                  className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[11px] transition-all"
                  title="Đăng nhập tài khoản Tài xế"
                >
                  🚗 Tài xế
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("ADMIN")}
                  className="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-[11px] transition-all"
                  title="Đăng nhập tài khoản Quản trị viên"
                >
                  🛡️ Quản trị (Admin)
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
