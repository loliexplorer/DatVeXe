import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, 
  Settings, Ticket, Camera, ChevronRight, LogOut, CheckCircle2,
  Award, Sparkles, Gift, Zap, Shield, Crown
} from 'lucide-react';

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onOpenMyTickets, 
  onLogout 
}) {
  if (!isOpen || !currentUser) return null;

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'membership' | 'security' | 'settings'
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Mặc định khách hàng là HỘI VIÊN BẠC (850 điểm / 1500 điểm thăng hạng Vàng)
  const tier = currentUser.membershipTier || "SILVER";
  const points = currentUser.loyaltyPoints ?? 850;
  const maxTierPoints = 1500;
  const progressPercent = Math.min(100, Math.round((points / maxTierPoints) * 100));

  const maskEmail = (email) => {
    if (!email) return "k********@gmail.com";
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.substring(0, 2)}*****${name.slice(-1)}@${domain}`;
  };

  const handleSaveMock = (e) => {
    e.preventDefault();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  // Cấu hình hiển thị theo từng hạng hội viên
  const TIER_CONFIG = {
    BRONZE: {
      name: "Hội Viên Đồng",
      badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
      cardGradient: "from-amber-700 via-amber-800 to-amber-950",
      textColor: "text-amber-200",
      nextTier: "Bạc",
      pointsNeeded: 500 - points,
      discount: "1% tích điểm",
    },
    SILVER: {
      name: "Hội Viên Bạc",
      badgeCls: "bg-slate-200 text-slate-800 border-slate-300",
      cardGradient: "from-slate-600 via-slate-700 to-slate-900",
      textColor: "text-slate-200",
      nextTier: "Vàng",
      pointsNeeded: 1500 - points,
      discount: "Giảm 5% vé Limousine & Tích 3% điểm",
    },
    GOLD: {
      name: "Hội Viên Vàng (VIP)",
      badgeCls: "bg-yellow-200 text-yellow-900 border-yellow-400",
      cardGradient: "from-amber-500 via-yellow-600 to-amber-700",
      textColor: "text-amber-100",
      nextTier: "Đã đạt cấp tối đa",
      pointsNeeded: 0,
      discount: "Giảm 10% mọi chuyến & Miễn phí đổi vé",
    }
  };

  const currentTierInfo = TIER_CONFIG[tier] || TIER_CONFIG.SILVER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-emerald-950 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Phần Avatar & Tên người dùng */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-300 text-brand-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 border-2 border-white/20">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : "H"}
              </div>
              <button 
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-md border-2 border-white transition-all"
                onClick={() => alert("Tính năng đổi ảnh đại diện (sẽ kết nối với API upload ảnh ở phần Backend)")}
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  {currentUser.fullName}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${currentTierInfo.badgeCls}`}>
                  {currentTierInfo.name}
                </span>
              </div>
              <p className="text-xs text-brand-200 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-brand-400" /> {currentUser.phone}
              </p>
              <p className="text-[11px] text-brand-300/80 mt-0.5">
                Điểm tích lũy: <span className="font-mono font-black text-white">{points.toLocaleString('vi-VN')} điểm</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi mục chức năng */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 shrink-0 px-2 sm:px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" /> Cá nhân
          </button>

          <button
            onClick={() => setActiveTab('membership')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'membership'
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" /> Hạng hội viên
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <Lock className="w-4 h-4" /> Bảo mật
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent hover:text-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" /> Cài đặt
          </button>
        </div>

        {/* Thân Modal: Nội dung từng Tab */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {isSavedToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã cập nhật thông tin thành công (Mô phỏng giao diện)!
            </div>
          )}

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveMock} className="space-y-4">
              
              {/* Thẻ Hội viên điện tử thu nhỏ */}
              <div 
                onClick={() => setActiveTab('membership')}
                className={`bg-gradient-to-r ${currentTierInfo.cardGradient} rounded-2xl p-4 text-white shadow-md relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform`}
              >
                <div className="absolute right-3 top-3 opacity-10">
                  <Crown className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">Thẻ Hội Viên Điện Tử</span>
                    <h4 className="text-base font-black tracking-tight">{currentTierInfo.name}</h4>
                  </div>
                  <span className="font-mono text-xs bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white">
                    {points} Điểm
                  </span>
                </div>

                {/* Thanh tiến độ lên hạng */}
                <div className="mt-3 relative z-10">
                  <div className="flex justify-between text-[11px] mb-1 opacity-90">
                    <span>Tiến độ thăng hạng {currentTierInfo.nextTier}:</span>
                    <span className="font-bold">{points} / {maxTierPoints} điểm</span>
                  </div>
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-200 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Nút bấm nhanh sang xem vé đã đặt */}
              <div 
                onClick={() => {
                  onClose();
                  onOpenMyTickets();
                }}
                className="bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500 text-brand-950 flex items-center justify-center font-bold">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-brand-950 block">Vé đã đặt của bạn</span>
                    <span className="text-[11px] text-brand-700">Xem lịch sử các chuyến xe và mã QR soát vé</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-600 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      defaultValue={currentUser.fullName}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-semibold bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      defaultValue={currentUser.phone}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Email được ẩn (Masked) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600">Địa chỉ Email (Được ẩn bảo mật)</label>
                    <button
                      type="button"
                      onClick={() => setShowEmail(!showEmail)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
                    >
                      {showEmail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showEmail ? "Ẩn email" : "Hiện đầy đủ"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      readOnly
                      value={showEmail ? currentUser.email : maskEmail(currentUser.email)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-mono text-sm outline-none cursor-default"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1 text-right">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
                >
                  Lưu thay đổi
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: THÔNG TIN HỘI VIÊN & QUYỀN LỢI 3 MỨC (ĐỒNG - BẠC - VÀNG) */}
          {activeTab === 'membership' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Thẻ VIP to bản */}
              <div className={`bg-gradient-to-r ${currentTierInfo.cardGradient} rounded-2xl p-5 text-white shadow-xl relative overflow-hidden`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-300" />
                    <span className="font-extrabold text-sm uppercase tracking-wider">EcoBus Loyalty Club</span>
                  </div>
                  <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {points} PTS
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-300 block">Hạng hiện tại</span>
                  <h3 className="text-2xl font-black text-white">{currentTierInfo.name}</h3>
                  <p className="text-xs text-brand-200 mt-1">{currentTierInfo.discount}</p>
                </div>

                {/* Thanh tiến độ */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>Tiến độ thăng hạng {currentTierInfo.nextTier}:</span>
                    <span className="font-bold text-emerald-300">{points} / {maxTierPoints} điểm ({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2">
                    ⚡ Tích lũy thêm <strong className="text-white">{1500 - points} điểm</strong> để nhận đặc quyền Hội viên Vàng!
                  </p>
                </div>
              </div>

              {/* Bảng so sánh quyền lợi 3 mức Hội viên */}
              <div>
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-600" /> Bảng quyền lợi 3 cấp độ hội viên
                </h5>

                <div className="space-y-2.5">
                  
                  {/* Cấp 1: HỘI VIÊN ĐỒNG */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                    <span className="text-2xl shrink-0">🥉</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-amber-900">Hội viên Đồng (Bronze)</span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">0 - 499 điểm</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        • Tích 1% điểm mỗi chuyến đi • Nhận tin khuyến mãi sớm nhất.
                      </p>
                    </div>
                  </div>

                  {/* Cấp 2: HỘI VIÊN BẠC */}
                  <div className="p-3.5 rounded-xl border-2 border-slate-300 bg-slate-50 flex items-start gap-3 shadow-xs">
                    <span className="text-2xl shrink-0">🥈</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">Hội viên Bạc (Silver)</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">Cấp của bạn</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">500 - 1.499 điểm</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        • Tích 3% điểm mỗi chuyến • Giảm 5% khi đặt xe Limousine • Tăng thời gian giữ chỗ lên 15 phút.
                      </p>
                    </div>
                  </div>

                  {/* Cấp 3: HỘI VIÊN VÀNG */}
                  <div className="p-3.5 rounded-xl border border-yellow-300 bg-yellow-50/60 flex items-start gap-3">
                    <span className="text-2xl shrink-0">🥇</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-yellow-900">Hội viên Vàng (Gold VIP)</span>
                        <span className="text-[11px] font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">≥ 1.500 điểm</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        • Tích 5% điểm • Giảm 10% mọi chuyến • Miễn phí đổi/hủy vé trước 12h • Ưu tiên chọn ghế đầu không phụ phí.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 3: BẢO MẬT & MẬT KHẨU */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Mật khẩu đăng nhập</span>
                    <span className="text-xs text-slate-500">Mật khẩu của bạn luôn được mã hóa Bcrypt trên hệ thống</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    title={showPassword ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-3">
                  <span className="font-mono text-base tracking-widest text-slate-700 font-black">
                    {showPassword ? "Password123@" : "••••••••••••"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Đổi mật khẩu mới</h5>
                <input
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => alert("Đổi mật khẩu thành công!")}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-all"
                >
                  Xác nhận đổi mật khẩu
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CÀI ĐẶT (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block text-sm mb-2">Cài đặt thông báo & Chuyến đi</span>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="font-semibold text-slate-800 block">Thông báo qua Email</span>
                    <span className="text-[11px] text-slate-500">Nhận vé điện tử và thông tin tích điểm</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded cursor-pointer" />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-200/60 pt-2">
                  <div>
                    <span className="font-semibold text-slate-800 block">Thông báo giờ xe chạy (SMS / Zalo)</span>
                    <span className="text-[11px] text-slate-500">Nhắc nhở trước giờ xuất bến 60 phút</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded cursor-pointer" />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất khỏi tài khoản
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all shadow-sm"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
