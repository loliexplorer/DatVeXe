import React, { useState, useEffect } from 'react';
import { Bus, Lock, Mail, LogIn } from 'lucide-react';
import StaffDashboard from './StaffDashboard.jsx';

const STORAGE_KEY = 'ecobus_staff_user';

export default function StaffApp() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('staff@ecobus.vn');
  const [password, setPassword] = useState('staff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@') || password.length < 3) {
      setError('Vui lòng nhập email và mật khẩu hợp lệ (≥ 3 ký tự).');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const staffUser = {
        id: 42,
        fullName: 'Nguyễn Văn Staff',
        email,
        role: 'STAFF',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(staffUser));
      setUser(staffUser);
      setLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setPassword('');
  };

  if (user) {
    return <StaffDashboard currentUser={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-300 flex items-center justify-center text-brand-950 shadow-lg shadow-brand-500/30">
              <Bus className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">EcoBus Staff</h1>
          <p className="text-brand-300 text-sm mt-1">Cổng nhân viên vận hành</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl shadow-2xl p-7 space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Đăng nhập nhân viên</h2>
            <p className="text-xs text-slate-500 mt-1">Nhập bất kỳ email + mật khẩu ≥ 3 ký tự để demo.</p>
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email nhân viên</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                     className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                     placeholder="staff@ecobus.vn" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium"
                     placeholder="••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang đăng nhập...</>
              : <><LogIn className="w-4 h-4" /> Vào ca làm việc</>}
          </button>

          <p className="text-[11px] text-center text-slate-400 pt-2">
            © {new Date().getFullYear()} EcoBus · Staff Panel v1.0
          </p>
        </form>
      </div>
    </div>
  );
}