import React from 'react';
import { Bus, Ticket, ShieldCheck, UserCheck, PhoneCall, LogOut, ScanLine, User } from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onReset, 
  onOpenAuth, 
  onLogout, 
  onOpenMyTickets, 
  onOpenProfile,
  onOpenDriverMode 
}) {
  return (
    <header className="sticky top-0 z-50 bg-brand-900/95 backdrop-blur-md text-white shadow-lg border-b border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={onReset}
            className="flex items-center gap-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-300 flex items-center justify-center text-brand-950 font-bold shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Bus className="w-6 h-6 text-brand-950" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-brand-100 to-brand-300 bg-clip-text text-transparent">
                EcoBus
              </span>
              <span className="block text-[10px] text-brand-300 font-medium tracking-wider uppercase">
                Hệ thống đặt xe xanh
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={onReset}
              className="text-brand-100 hover:text-white transition-colors"
            >
              Trang chủ
            </button>
            <a href="#popular-routes" className="text-brand-200 hover:text-white transition-colors">
              Tuyến phổ biến
            </a>

            {/* Menu "Vé của tôi" */}
            <button 
              onClick={onOpenMyTickets}
              className="flex items-center gap-1.5 text-brand-200 hover:text-white transition-colors font-semibold"
            >
              <Ticket className="w-4 h-4 text-brand-400" />
              Vé của tôi
            </button>

            {/* Nếu là Tài xế ➔ Hiện menu Chế độ tài xế soát vé */}
            {currentUser?.role === "DRIVER" && (
              <button
                onClick={onOpenDriverMode}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 transition-all font-bold text-xs"
              >
                <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                Chế độ Tài xế (Soát vé)
              </button>
            )}

            <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-brand-800/80 border border-brand-700/60 text-brand-300">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Cam kết giữ đúng 100% số ghế
            </div>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            
            {currentUser ? (
              /* Đã đăng nhập: Hiện Avatar + Tên + Đăng xuất */
              <div className="flex items-center gap-3">
                <div 
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 cursor-pointer bg-brand-800/80 hover:bg-brand-800 px-3 py-1.5 rounded-xl border border-brand-700/60 transition-all hover:scale-105"
                  title="Xem hồ sơ & Cài đặt tài khoản"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-brand-950 font-black flex items-center justify-center text-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold block leading-tight text-white">{currentUser.fullName}</span>
                    {currentUser.role === "DRIVER" ? (
                      <span className="text-[10px] text-amber-300 uppercase font-semibold flex items-center gap-1">
                        🚗 Tài xế
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold flex items-center gap-1">
                        {currentUser.membershipTier === "GOLD" && (
                          <span className="text-amber-300 flex items-center gap-0.5">👑 Hội viên Vàng</span>
                        )}
                        {currentUser.membershipTier === "SILVER" && (
                          <span className="text-slate-200 flex items-center gap-0.5">🥈 Hội viên Bạc</span>
                        )}
                        {(!currentUser.membershipTier || currentUser.membershipTier === "BRONZE") && (
                          <span className="text-amber-400 flex items-center gap-0.5">🥉 Hội viên Đồng</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="w-9 h-9 rounded-xl bg-brand-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-brand-300 flex items-center justify-center transition-all border border-brand-700/60"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Chưa đăng nhập: Hiện nút Đăng nhập / Đăng ký */
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-brand-950 font-bold text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
