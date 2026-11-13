import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Bus, Ticket, Users, UserCheck, TrendingUp,
  Map, Settings, Bell, LogOut, Plus, Search, Edit2, Eye, Trash2,
  XCircle, X, CheckCircle2, AlertCircle, Save, Send, Mail,
  ShieldCheck, CreditCard, Wallet, Star, BarChart3, PieChart,
  RefreshCw, Route as RouteIcon,
} from 'lucide-react';
import { MOCK } from './mockData';

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PAID:      { label: '✅ Đã thanh toán', cls: 'bg-brand-50  text-brand-700  border border-brand-200' },
  PENDING:   { label: '⏳ Chờ thanh toán', cls: 'bg-amber-50  text-amber-700  border border-amber-200' },
  CANCELLED: { label: '❌ Đã hủy',         cls: 'bg-rose-50   text-rose-700   border border-rose-200'  },
  ON_BOARD:  { label: '🚌 Đang di chuyển', cls: 'bg-blue-50   text-blue-700   border border-blue-200'  },
  RUNNING:   { label: '🚌 Đang di chuyển', cls: 'bg-blue-50   text-blue-700   border border-blue-200'  },
  DONE:      { label: '✓ Hoàn thành',      cls: 'bg-slate-100 text-slate-600  border border-slate-200' },
  ACTIVE:    { label: '● Hoạt động',       cls: 'bg-brand-50  text-brand-700  border border-brand-200' },
  INACTIVE:  { label: '● Tạm dừng',        cls: 'bg-slate-100 text-slate-600  border border-slate-200' },
  BLOCKED:   { label: '● Bị khóa',         cls: 'bg-rose-50   text-rose-700   border border-rose-200'  },
  ON_LEAVE:  { label: '● Nghỉ phép',       cls: 'bg-amber-50  text-amber-700  border border-amber-200' },
};

const ACTIVITY_ICON = { BOOKING: '🎫', DEPARTURE: '🚌', CANCEL: '❌', CHECKIN: '🧑‍✈️', USER: '👤' };
const ACTIVITY_BG   = { BOOKING: 'bg-brand-50', DEPARTURE: 'bg-blue-50', CANCEL: 'bg-rose-50', CHECKIN: 'bg-amber-50', USER: 'bg-brand-50' };

const NAV_GROUPS = [
  { label: 'Điều hành', items: [
      { id: 'overview', label: 'Tổng quan',  Icon: LayoutDashboard },
      { id: 'trips',    label: 'Chuyến xe',  Icon: Bus },
      { id: 'bookings', label: 'Đặt vé',     Icon: Ticket, badgeKey: 'pending' },
      { id: 'users',    label: 'Hành khách', Icon: Users },
      { id: 'drivers',  label: 'Tài xế',     Icon: UserCheck },
  ]},
  { label: 'Phân tích', items: [
      { id: 'revenue', label: 'Báo cáo doanh thu',   Icon: TrendingUp },
      { id: 'routes',  label: 'Quản lý tuyến đường', Icon: Map },
  ]},
  { label: 'Hệ thống', items: [
      { id: 'notifications', label: 'Thông báo',        Icon: Bell, badgeKey: 'notif' },
      { id: 'settings',      label: 'Cài đặt hệ thống', Icon: Settings },
  ]},
];

const inputCls = 'w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium bg-white';

/* ─── Shared small components ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

function SeatTag({ seat }) {
  return <span className="bg-brand-50 border border-brand-200 text-brand-800 font-bold text-xs px-2 py-0.5 rounded-md mr-1">{seat}</span>;
}

function SkeletonRow({ cols }) {
  return <tr><td colSpan={cols} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-full" /></td></tr>;
}

function EmptyState({ message }) {
  return (
    <tr>
      <td colSpan={99} className="text-center py-16 text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-semibold">{message}</p>
      </td>
    </tr>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Data (initialised from MOCK, mutable via CRUD)
  const [bookings,      setBookings]      = useState(MOCK.bookings);
  const [trips,         setTrips]         = useState(MOCK.trips);
  const [users,         setUsers]         = useState(MOCK.users);
  const [drivers,       setDrivers]       = useState(MOCK.drivers);
  const [routes,        setRoutes]        = useState(MOCK.routes);
  const [notifications, setNotifications] = useState(MOCK.notifications);
  const [settings,      setSettings]      = useState(MOCK.settings);

  // Filters
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [search,        setSearch]        = useState('');

  // Modals
  const [tripModal,   setTripModal]   = useState({ open: false, trip: null });
  const [userModal,   setUserModal]   = useState({ open: false, user: null });
  const [driverModal, setDriverModal] = useState({ open: false, driver: null });
  const [routeModal,  setRouteModal]  = useState({ open: false, route: null });

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const badges = { pending: pendingCount, notif: 3 };

  /* ── Cancel booking ────────────────────────────────────────────────── */
  const handleCancelBooking = (id) => {
    if (!confirm('Hủy đơn đặt vé này? Tiền sẽ được hoàn lại cho khách.')) return;
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    showToast('Đã hủy đơn và bắt đầu hoàn tiền.');
  };

  /* ── Modal handlers ────────────────────────────────────────────────── */
  const handleSaveTrip = (data) => {
    if (data.id) {
      setTrips(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
      showToast('Đã cập nhật chuyến xe.');
    } else {
      setTrips(prev => [{ ...data, id: Date.now(), seatsLeft: data.totalSeats }, ...prev]);
      showToast('Đã thêm chuyến xe mới.');
    }
    setTripModal({ open: false, trip: null });
  };
  const handleDeleteTrip = (id) => {
    if (!confirm('Xóa chuyến xe này?')) return;
    setTrips(prev => prev.filter(t => t.id !== id));
    showToast('Đã xóa chuyến xe.');
  };

  const handleSaveUser = (data) => {
    if (data.id) {
      setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
      showToast('Đã cập nhật hành khách.');
    } else {
      setUsers(prev => [{ ...data, id: Date.now(), joinedAt: new Date().toLocaleDateString('vi-VN'), totalBookings: 0, totalSpent: 0 }, ...prev]);
      showToast('Đã thêm hành khách.');
    }
    setUserModal({ open: false, user: null });
  };
  const handleDeleteUser = (id) => {
    if (!confirm('Xóa hành khách này?')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Đã xóa hành khách.');
  };

  const handleSaveDriver = (data) => {
    if (data.id) {
      setDrivers(prev => prev.map(d => d.id === data.id ? { ...d, ...data } : d));
      showToast('Đã cập nhật tài xế.');
    } else {
      setDrivers(prev => [{ ...data, id: Date.now(), joinedAt: new Date().toLocaleDateString('vi-VN'), tripsCompleted: 0, rating: 5 }, ...prev]);
      showToast('Đã thêm tài xế.');
    }
    setDriverModal({ open: false, driver: null });
  };
  const handleDeleteDriver = (id) => {
    if (!confirm('Xóa tài xế này?')) return;
    setDrivers(prev => prev.filter(d => d.id !== id));
    showToast('Đã xóa tài xế.');
  };

  const handleSaveRoute = (data) => {
    if (data.id) {
      setRoutes(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
      showToast('Đã cập nhật tuyến đường.');
    } else {
      setRoutes(prev => [{ ...data, id: Date.now(), tripsToday: 0 }, ...prev]);
      showToast('Đã thêm tuyến đường.');
    }
    setRouteModal({ open: false, route: null });
  };
  const handleDeleteRoute = (id) => {
    if (!confirm('Xóa tuyến đường này?')) return;
    setRoutes(prev => prev.filter(r => r.id !== id));
    showToast('Đã xóa tuyến đường.');
  };

  const handleSendNotification = (payload) => {
    const n = {
      ...payload,
      id: Date.now(),
      sentAt: new Date().toLocaleString('vi-VN'),
      sentCount: users.length,
      openRate: 0,
      status: 'SENT',
    };
    setNotifications(prev => [n, ...prev]);
    showToast(`Đã gửi thông báo tới ${n.sentCount} người.`);
  };

  const handleSaveSettings = (payload) => {
    setSettings(payload);
    showToast('Đã lưu cài đặt hệ thống.');
  };

  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(n => n.id === activeTab)?.label ?? 'Tổng quan';

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-brand-700 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 bg-brand-900 flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-brand-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-300 flex items-center justify-center text-brand-950 shadow-sm">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-black text-base leading-tight">EcoBus</div>
            <div className="text-brand-400 text-[10px] font-semibold uppercase tracking-wide">Admin</div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-brand-500 text-[10px] font-bold uppercase tracking-wider px-2 py-2">{group.label}</div>
              {group.items.map(({ id, label, Icon, badgeKey }) => (
                <button key={id} onClick={() => { setActiveTab(id); setSearch(''); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all mb-0.5 ${
                          activeTab === id ? 'bg-white/15 text-white' : 'text-brand-200 hover:bg-white/10 hover:text-white'
                        }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {badgeKey && badges[badgeKey] > 0 && (
                    <span className="bg-brand-500 text-brand-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">{badges[badgeKey]}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-brand-800 p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center font-black text-xs text-white flex-shrink-0">
            {currentUser?.fullName?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-xs truncate">{currentUser?.fullName ?? 'Admin'}</div>
            <div className="text-brand-400 text-[10px] font-semibold">Quản trị viên</div>
          </div>
          <button onClick={onLogout} title="Đăng xuất"
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-brand-300 flex items-center justify-center transition-all">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-slate-500">
            Hệ thống / <strong className="text-slate-900">{activeLabel}</strong>
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-400 min-w-[200px]">
              <Search className="w-3.5 h-3.5" /> Tìm kiếm...
            </div>
            <button className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center relative hover:bg-slate-200 transition-all">
              <Bell className="w-4 h-4 text-slate-500" />
              {pendingCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />}
            </button>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full pl-1 pr-3 py-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center font-black text-xs text-white">
                {currentUser?.fullName?.charAt(0) ?? 'A'}
              </div>
              <span className="text-xs font-bold text-slate-800">{currentUser?.fullName ?? 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              bookings={bookings}
              pendingCount={pendingCount}
              onCancel={handleCancelBooking}
            />
          )}
          {activeTab === 'trips' && (
            <TripsTab trips={trips} search={search} setSearch={setSearch}
                      onAdd={() => setTripModal({ open: true, trip: null })}
                      onEdit={(t) => setTripModal({ open: true, trip: t })}
                      onDelete={handleDeleteTrip} />
          )}
          {activeTab === 'bookings' && (
            <BookingsTab bookings={bookings} filter={bookingFilter} setFilter={setBookingFilter}
                         pendingCount={pendingCount} onCancel={handleCancelBooking} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} search={search} setSearch={setSearch}
                      onAdd={() => setUserModal({ open: true, user: null })}
                      onEdit={(u) => setUserModal({ open: true, user: u })}
                      onDelete={handleDeleteUser} />
          )}
          {activeTab === 'drivers' && (
            <DriversTab drivers={drivers} search={search} setSearch={setSearch}
                        onAdd={() => setDriverModal({ open: true, driver: null })}
                        onEdit={(d) => setDriverModal({ open: true, driver: d })}
                        onDelete={handleDeleteDriver} />
          )}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'routes' && (
            <RoutesTab routes={routes} search={search} setSearch={setSearch}
                       onAdd={() => setRouteModal({ open: true, route: null })}
                       onEdit={(r) => setRouteModal({ open: true, route: r })}
                       onDelete={handleDeleteRoute} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab notifications={notifications} onSend={handleSendNotification} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onSave={handleSaveSettings} />
          )}
        </div>
      </div>

      {/* Modals */}
      <TripFormModal   open={tripModal.open}   trip={tripModal.trip}     routes={routes} drivers={drivers}
                       onClose={() => setTripModal({ open: false, trip: null })}   onSave={handleSaveTrip} />
      <UserFormModal   open={userModal.open}   user={userModal.user}
                       onClose={() => setUserModal({ open: false, user: null })}   onSave={handleSaveUser} />
      <DriverFormModal open={driverModal.open} driver={driverModal.driver}
                       onClose={() => setDriverModal({ open: false, driver: null })} onSave={handleSaveDriver} />
      <RouteFormModal  open={routeModal.open}  route={routeModal.route}
                       onClose={() => setRouteModal({ open: false, route: null })}   onSave={handleSaveRoute} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: OVERVIEW
   ════════════════════════════════════════════════════════════════════════════ */
function OverviewTab({ bookings, pendingCount, onCancel }) {
  const chart = MOCK.chart;
  const chartMax = Math.max(...chart.map(d => d.count), 1);
  const stats = MOCK.stats;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">Tổng quan hệ thống 📊</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}Dữ liệu cập nhật thời gian thực
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'revenue', label: 'Doanh thu tháng (đ)', icon: '💰', bg: 'bg-brand-50'  },
          { key: 'trips',   label: 'Chuyến xe hôm nay',   icon: '🚌', bg: 'bg-blue-50'  },
          { key: 'tickets', label: 'Vé đã bán (tháng)',   icon: '🎫', bg: 'bg-amber-50' },
          { key: 'users',   label: 'Tổng người dùng',     icon: '👥', bg: 'bg-purple-50' },
        ].map(({ key, label, icon, bg }) => {
          const s = stats[key];
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-xl`}>{icon}</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.up ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-700'
                }`}>{s.up ? '▲' : '▼'} {s.delta}</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-slate-800 text-sm">Lượt đặt vé trong tuần</div>
              <div className="text-xs text-slate-400 mt-0.5">7 ngày gần nhất</div>
            </div>
            <button className="text-xs text-brand-600 font-bold bg-brand-50 px-3 py-1 rounded-lg hover:bg-brand-100 transition-all">
              Xem tháng →
            </button>
          </div>
          <div className="flex items-end gap-2 h-32">
            {chart.map((d, i) => {
              const pct = Math.round((d.count / chartMax) * 100);
              const isToday = i === chart.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">{d.count}</span>
                  <div className="w-full rounded-t-lg transition-all duration-500"
                       style={{ height: `${Math.max(pct, 8)}%`,
                                background: isToday
                                  ? 'linear-gradient(180deg,#fbbf24,#d97706)'
                                  : 'linear-gradient(180deg,#4ade80,#16a34a)' }} />
                  <span className="text-[10px] font-semibold text-slate-400">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
            {[
              { label: 'Tổng lượt', val: chart.reduce((a, d) => a + d.count, 0), color: 'text-brand-700' },
              { label: 'Cao nhất',  val: chartMax,                                color: 'text-slate-800' },
              { label: 'Hôm nay',   val: chart.at(-1)?.count ?? 0,                color: 'text-amber-600' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 text-center">
                <div className={`font-black text-lg ${color}`}>{val}</div>
                <div className="text-[10px] text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-slate-800 text-sm">Hoạt động gần đây</div>
            <RefreshCw className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-brand-600 transition-colors" />
          </div>
          <div>
            {MOCK.activity.map((a, i) => (
              <div key={a.id} className={`flex gap-2.5 py-2.5 ${i < MOCK.activity.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className={`w-7 h-7 rounded-full ${ACTIVITY_BG[a.type] ?? 'bg-slate-100'} flex items-center justify-center text-xs flex-shrink-0`}>
                  {ACTIVITY_ICON[a.type] ?? '•'}
                </div>
                <div>
                  <p className="text-xs text-slate-700 leading-snug">{a.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-sm">Đặt vé gần đây</div>
          <button className="text-xs text-brand-600 font-bold hover:text-brand-500 transition-colors">Xem tất cả →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Mã đặt vé', 'Hành khách', 'Tuyến', 'Giờ', 'Ghế', 'Tổng tiền', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(b => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                  <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800">{b.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 text-sm whitespace-nowrap">{b.passengerName}</div>
                    <div className="text-xs text-slate-400">{b.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{b.route}</td>
                  <td className="px-4 py-3 font-bold text-sm">{b.departureTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{b.seats.map(s => <SeatTag key={s} seat={s} />)}</td>
                  <td className="px-4 py-3 font-black text-sm whitespace-nowrap"
                      style={{ color: b.status === 'CANCELLED' ? '#94a3b8' : '#0f172a',
                               textDecoration: b.status === 'CANCELLED' ? 'line-through' : 'none' }}>
                    {b.total.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    {b.status !== 'CANCELLED' && (
                      <button onClick={() => onCancel(b.id)} className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════════════════════════════════════════
   TAB: TRIPS
   ════════════════════════════════════════════════════════════════════════════ */
function TripsTab({ trips, search, setSearch, onAdd, onEdit, onDelete }) {
  const filtered = trips.filter(t =>
    !search ||
    t.busName.toLowerCase().includes(search.toLowerCase()) ||
    t.route.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý chuyến xe</h1>
          <p className="text-xs text-slate-500 mt-0.5">{trips.length} chuyến hôm nay</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm chuyến xe, tuyến đường..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
          <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm chuyến xe mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Tên xe', 'Tuyến đường', 'Giờ xuất bến', 'Tài xế', 'Chỗ trống', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState message="Không tìm thấy chuyến xe phù hợp" />
              ) : filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className="px-4 py-3 font-bold text-slate-900 text-sm">{t.busName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{t.route}</td>
                  <td className="px-4 py-3 font-bold text-sm">{t.departureTime}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{t.driver}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${t.seatsLeft <= 4 ? 'text-amber-600' : 'text-brand-600'}`}>
                      {t.seatsLeft}/{t.totalSeats} còn trống
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onEdit(t)}
                              className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1 transition-colors">
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      <button onClick={() => onDelete(t.id)}
                              className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: BOOKINGS
   ════════════════════════════════════════════════════════════════════════════ */
function BookingsTab({ bookings, filter, setFilter, pendingCount, onCancel }) {
  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý đặt vé</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {bookings.length} đơn hôm nay · {pendingCount} chờ xác nhận
          </p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:border-brand-500">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="ON_BOARD">Đang di chuyển</option>
          </select>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm đặt vé thủ công
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="font-bold text-slate-800 text-sm">Danh sách đặt vé</div>
          <div className="text-xs text-slate-400 mt-0.5">{filtered.length} kết quả</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Mã đặt vé', 'Hành khách', 'Tuyến đường', 'Giờ', 'Ghế', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState message="Không có đơn đặt vé nào" />
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800 whitespace-nowrap">{b.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 text-sm whitespace-nowrap">{b.passengerName}</div>
                    <div className="text-xs text-slate-400">{b.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{b.route}</td>
                  <td className="px-4 py-3 font-bold text-sm">{b.departureTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {b.seats.map(s => <SeatTag key={s} seat={s} />)}
                  </td>
                  <td className="px-4 py-3 font-black text-sm whitespace-nowrap"
                      style={{
                        textDecoration: b.status === 'CANCELLED' ? 'line-through' : 'none',
                        color: b.status === 'CANCELLED' ? '#94a3b8' : '#0f172a',
                      }}>
                    {b.total.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1 transition-colors">
                        <Eye className="w-3 h-3" /> Xem
                      </button>
                      {b.status !== 'CANCELLED' && (
                        <button onClick={() => onCancel(b.id)}
                                className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1 transition-colors">
                          <XCircle className="w-3 h-3" /> Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: USERS
   ════════════════════════════════════════════════════════════════════════════ */
function UsersTab({ users, search, setSearch, onAdd, onEdit, onDelete }) {
  const filtered = users.filter(u =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý hành khách</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {users.length} tài khoản · {users.filter(u => u.status === 'ACTIVE').length} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tên, email, SĐT..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
          <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm hành khách
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Hành khách', 'Liên hệ', 'Đăng ký', 'Đặt vé', 'Chi tiêu', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState message="Không có hành khách" />
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 whitespace-nowrap">{u.fullName}</div>
                        <div className="text-xs text-slate-400">ID #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700">{u.email}</div>
                    <div className="text-xs text-slate-400">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{u.joinedAt}</td>
                  <td className="px-4 py-3 text-sm font-bold">{u.totalBookings}</td>
                  <td className="px-4 py-3 text-sm font-black text-brand-700 whitespace-nowrap">
                    {u.totalSpent.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => onEdit(u)}
                              className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      <button onClick={() => onDelete(u.id)}
                              className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: DRIVERS
   ════════════════════════════════════════════════════════════════════════════ */
function DriversTab({ drivers, search, setSearch, onAdd, onEdit, onDelete }) {
  const filtered = drivers.filter(d =>
    !search ||
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search) ||
    d.licenseNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý tài xế</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {drivers.length} tài xế · {drivers.filter(d => d.status === 'ACTIVE').length} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tên, SĐT, GPLX..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
          <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm tài xế
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Tài xế', 'SĐT', 'GPLX', 'Xe phụ trách', 'Đánh giá', 'Số chuyến', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState message="Không có tài xế" />
              ) : filtered.map(d => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {d.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 whitespace-nowrap">{d.fullName}</div>
                        <div className="text-xs text-slate-400">Từ {d.joinedAt}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{d.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.licenseNo}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{d.assignedBus}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-current" /> {d.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">{d.tripsCompleted}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => onEdit(d)}
                              className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      <button onClick={() => onDelete(d.id)}
                              className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: REVENUE  (read-only, uses MOCK.revenue directly)
   ════════════════════════════════════════════════════════════════════════════ */
function RevenueTab() {
  const revenue = MOCK.revenue;
  const maxMonthly = Math.max(...revenue.monthly.map(m => m.amount), 1);
  const growth = (((revenue.totals.month - revenue.totals.prevMonth) / revenue.totals.prevMonth) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Báo cáo doanh thu 📈</h1>
          <p className="text-xs text-slate-500 mt-0.5">Thống kê doanh thu theo tháng · quý · năm</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-brand-600 text-white font-bold text-xs rounded-lg">Năm nay</button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50">
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Doanh thu tháng này',   value: revenue.totals.month,     delta: `▲ +${growth}%`, bg: 'bg-brand-50',  icon: '💰' },
          { label: 'Doanh thu tháng trước', value: revenue.totals.prevMonth, bg: 'bg-slate-100', icon: '📊' },
          { label: 'Lũy kế năm nay',        value: revenue.totals.ytd,       bg: 'bg-blue-50',   icon: '📈' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl`}>{card.icon}</div>
              {card.delta && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{card.delta}</span>
              )}
            </div>
            <div className="text-2xl font-black text-slate-900">
              {(card.value / 1_000_000).toFixed(1)} tr đ
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-slate-800 text-sm">Doanh thu theo tháng</div>
            <div className="text-xs text-slate-400 mt-0.5">Đơn vị: triệu VNĐ</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart3 className="w-4 h-4 text-brand-600" /> Năm {new Date().getFullYear()}
          </div>
        </div>
        <div className="flex items-end gap-2 h-52">
          {revenue.monthly.map((m, i) => {
            const isLast = i === revenue.monthly.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500">{(m.amount / 1_000_000).toFixed(0)}</span>
                <div className="w-full rounded-t-md transition-all duration-500"
                     style={{
                       height: `${(m.amount / maxMonthly) * 100}%`,
                       background: isLast
                         ? 'linear-gradient(180deg,#fbbf24,#d97706)'
                         : 'linear-gradient(180deg,#4ade80,#16a34a)',
                     }} />
                <span className="text-[10px] font-semibold text-slate-400">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <RouteIcon className="w-4 h-4 text-brand-600" />
            <div className="font-bold text-slate-800 text-sm">Top tuyến đường doanh thu</div>
          </div>
          <div className="space-y-3.5">
            {revenue.byRoute.map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">{r.route}</span>
                  <span className="font-bold text-brand-700">{(r.amount / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all"
                       style={{ width: `${r.pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{r.tickets} vé · {r.pct}% tổng doanh thu</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-brand-600" />
            <div className="font-bold text-slate-800 text-sm">Phương thức thanh toán</div>
          </div>
          <div className="space-y-3">
            {revenue.byMethod.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                  <span className="text-sm font-semibold text-slate-700">{m.method}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">{(m.amount / 1_000_000).toFixed(1)}M</div>
                  <div className="text-xs text-slate-400">{m.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: ROUTES
   ════════════════════════════════════════════════════════════════════════════ */
function RoutesTab({ routes, search, setSearch, onAdd, onEdit, onDelete }) {
  const filtered = routes.filter(r =>
    !search ||
    r.origin.toLowerCase().includes(search.toLowerCase()) ||
    r.destination.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý tuyến đường</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {routes.length} tuyến · {routes.filter(r => r.status === 'ACTIVE').length} đang khai thác
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tuyến, mã..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
          <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm tuyến đường
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Mã tuyến', 'Lộ trình', 'Khoảng cách', 'Thời gian', 'Giá cơ bản', 'Chuyến hôm nay', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyState message="Không có tuyến đường" />
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0">
                  <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800">{r.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      <span>{r.origin}</span>
                      <span className="text-brand-500">→</span>
                      <span>{r.destination}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.distance} km</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.duration}</td>
                  <td className="px-4 py-3 font-bold text-sm text-brand-700 whitespace-nowrap">
                    {r.basePrice.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">{r.tripsToday} chuyến</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => onEdit(r)}
                              className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                      <button onClick={() => onDelete(r.id)}
                              className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: NOTIFICATIONS
   ════════════════════════════════════════════════════════════════════════════ */
function NotificationsTab({ notifications, onSend }) {
  const [title,    setTitle]    = useState('');
  const [message,  setMessage]  = useState('');
  const [audience, setAudience] = useState('ALL');
  const [channel,  setChannel]  = useState('PUSH');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onSend({ title: title.trim(), message: message.trim(), audience, channel });
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">Trung tâm thông báo 🔔</h1>
        <p className="text-xs text-slate-500 mt-0.5">Gửi thông báo tới hành khách qua nhiều kênh</p>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="font-bold text-slate-800 text-sm">Thông báo đã gửi</div>
            <div className="text-xs text-slate-400 mt-0.5">{notifications.length} thông báo</div>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 whitespace-nowrap">
                    {n.channel}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {n.sentCount.toLocaleString('vi-VN')} người nhận
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {(n.openRate * 100).toFixed(0)}% mở
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {n.sentAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 sticky top-6">
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-600" /> Soạn thông báo mới
          </div>

          <Field label="Tiêu đề" required>
            <input value={title} onChange={e => setTitle(e.target.value)}
                   placeholder="VD: Khuyến mãi Tết 2025" className={inputCls} required />
          </Field>

          <Field label="Nội dung" required>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                      placeholder="Nhập nội dung thông báo..."
                      className={inputCls + ' resize-none'} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Đối tượng">
              <select value={audience} onChange={e => setAudience(e.target.value)} className={inputCls}>
                <option value="ALL">Tất cả</option>
                <option value="CUSTOMER">Hành khách</option>
                <option value="DRIVER">Tài xế</option>
              </select>
            </Field>
            <Field label="Kênh gửi">
              <select value={channel} onChange={e => setChannel(e.target.value)} className={inputCls}>
                <option value="PUSH">Push</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </Field>
          </div>

          <button type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95">
            <Send className="w-4 h-4" /> Gửi thông báo
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: SETTINGS
   ════════════════════════════════════════════════════════════════════════════ */
function SettingsTab({ settings, onSave }) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);

  const update = (section, key, value) =>
    setForm(f => ({ ...f, [section]: { ...f[section], [key]: value } }));

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-black text-slate-900">Cài đặt hệ thống ⚙️</h1>
        <p className="text-xs text-slate-500 mt-0.5">Cấu hình chung, đặt vé, thanh toán và thông báo</p>
      </div>

      {/* Site */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" /> Thông tin chung
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tên hệ thống"><input value={form.site.name} onChange={e => update('site','name',e.target.value)} className={inputCls} /></Field>
          <Field label="Hotline"><input value={form.site.hotline} onChange={e => update('site','hotline',e.target.value)} className={inputCls} /></Field>
          <Field label="Email hỗ trợ"><input value={form.site.email} onChange={e => update('site','email',e.target.value)} className={inputCls} /></Field>
          <Field label="Địa chỉ"><input value={form.site.address} onChange={e => update('site','address',e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      {/* Booking */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Ticket className="w-4 h-4 text-brand-600" /> Chính sách đặt vé
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Thời gian giữ ghế (phút)"><input type="number" value={form.booking.holdMinutes} onChange={e => update('booking','holdMinutes', +e.target.value)} className={inputCls} /></Field>
          <Field label="Hủy miễn phí trước (giờ)"><input type="number" value={form.booking.cancellationHours} onChange={e => update('booking','cancellationHours', +e.target.value)} className={inputCls} /></Field>
          <Field label="Tỷ lệ hoàn tiền (%)"><input type="number" value={form.booking.refundPercent} onChange={e => update('booking','refundPercent', +e.target.value)} className={inputCls} /></Field>
          <Field label="Số ghế tối đa / đơn"><input type="number" value={form.booking.maxSeatsPerBooking} onChange={e => update('booking','maxSeatsPerBooking', +e.target.value)} className={inputCls} /></Field>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-600" /> Cổng thanh toán
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'vnpayEnabled',        icon: Wallet,     label: 'VNPay QR',            cls: 'text-brand-700 bg-brand-50' },
            { key: 'momoEnabled',         icon: Wallet,     label: 'Ví MoMo',             cls: 'text-pink-700 bg-pink-50'   },
            { key: 'bankTransferEnabled', icon: CreditCard, label: 'Thẻ ATM / Banking',   cls: 'text-blue-700 bg-blue-50'   },
            { key: 'codEnabled',          icon: Wallet,     label: 'Tiền mặt khi lên xe', cls: 'text-amber-700 bg-amber-50' },
          ].map(({ key, icon: Icon, label, cls }) => (
            <label key={key}
                   className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                     form.payment[key] ? 'border-brand-500 bg-brand-50/40' : 'border-slate-200'
                   }`}>
              <div className={`w-9 h-9 rounded-lg ${cls} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-700">{label}</span>
              <span className={`w-9 h-5 rounded-full p-0.5 transition-all flex-shrink-0 ${
                form.payment[key] ? 'bg-brand-600' : 'bg-slate-300'
              }`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.payment[key] ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </span>
              <input type="checkbox" checked={form.payment[key]}
                     onChange={e => update('payment', key, e.target.checked)}
                     className="hidden" />
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-600" /> Kênh thông báo
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'emailEnabled', icon: Mail, label: 'Email' },
            { key: 'smsEnabled',   icon: Send, label: 'SMS'   },
            { key: 'pushEnabled',  icon: Bell, label: 'Push'  },
          ].map(({ key, icon: Icon, label }) => (
            <label key={key}
                   className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                     form.notifications[key] ? 'border-brand-500 bg-brand-50/40' : 'border-slate-200'
                   }`}>
              <Icon className={`w-4 h-4 ${form.notifications[key] ? 'text-brand-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-sm font-semibold text-slate-700">{label}</span>
              <span className={`w-9 h-5 rounded-full p-0.5 transition-all flex-shrink-0 ${
                form.notifications[key] ? 'bg-brand-600' : 'bg-slate-300'
              }`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.notifications[key] ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </span>
              <input type="checkbox" checked={form.notifications[key]}
                     onChange={e => update('notifications', key, e.target.checked)}
                     className="hidden" />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={() => onSave(form)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all active:scale-95">
          <Save className="w-4 h-4" /> Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL: TRIP
   ════════════════════════════════════════════════════════════════════════════ */
function TripFormModal({ open, trip, routes = [], drivers = [], onClose, onSave }) {
  const empty = { busName: '', route: '', departureTime: '07:00', driver: '', totalSeats: 20, status: 'PENDING' };
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(trip ?? empty); }, [trip, open]); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.busName || !form.route || !form.driver) return;
    onSave({ ...form, totalSeats: +form.totalSeats });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trip ? 'Sửa chuyến xe' : 'Thêm chuyến xe mới'}
      subtitle={trip ? `Chuyến #${trip.id}` : 'Tạo chuyến xe mới'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Hủy
          </button>
          <button type="submit" form="trip-form"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm">
            <Save className="w-4 h-4" /> {trip ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </>
      }
    >
      <form id="trip-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tên xe" required>
            <input value={form.busName} onChange={e => setForm({ ...form, busName: e.target.value })}
                   className={inputCls} placeholder="EcoBus Limousine" required />
          </Field>
          <Field label="Tuyến đường" required>
            {routes.length > 0 ? (
              <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}
                      className={inputCls} required>
                <option value="">— Chọn tuyến —</option>
                {routes.filter(r => r.status === 'ACTIVE').map(r => (
                  <option key={r.id} value={`${r.origin} → ${r.destination}`}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.route} onChange={e => setForm({ ...form, route: e.target.value })}
                     className={inputCls} placeholder="Hà Nội → Sa Pa" required />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Giờ xuất bến" required>
            <input type="time" value={form.departureTime}
                   onChange={e => setForm({ ...form, departureTime: e.target.value })}
                   className={inputCls} required />
          </Field>
          <Field label="Tài xế" required>
            {drivers.length > 0 ? (
              <select value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })}
                      className={inputCls} required>
                <option value="">— Chọn tài xế —</option>
                {drivers.filter(d => d.status === 'ACTIVE').map(d => (
                  <option key={d.id} value={d.fullName}>{d.fullName}</option>
                ))}
              </select>
            ) : (
              <input value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })}
                     className={inputCls} placeholder="Trần Văn Lái" required />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tổng số ghế" required>
            <input type="number" min="1" value={form.totalSeats}
                   onChange={e => setForm({ ...form, totalSeats: e.target.value })}
                   className={inputCls} required />
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className={inputCls}>
              <option value="PENDING">Chờ khởi hành</option>
              <option value="RUNNING">Đang di chuyển</option>
              <option value="DONE">Hoàn thành</option>
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL: USER
   ════════════════════════════════════════════════════════════════════════════ */
function UserFormModal({ open, user, onClose, onSave }) {
  const empty = { fullName: '', email: '', phone: '', status: 'ACTIVE' };
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(user ?? empty); }, [user, open]); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Sửa hành khách' : 'Thêm hành khách mới'}
      subtitle={user ? `ID #${user.id}` : 'Tạo tài khoản khách hàng mới'}
      footer={
        <>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Hủy
          </button>
          <button type="submit" form="user-form"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm">
            <Save className="w-4 h-4" /> {user ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Họ và tên" required>
          <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                 className={inputCls} placeholder="Nguyễn Văn A" required />
        </Field>
        <Field label="Email" required>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                 className={inputCls} placeholder="email@example.com" required />
        </Field>
        <Field label="Số điện thoại" required>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                 className={inputCls} placeholder="0901234567" required />
        </Field>
        <Field label="Trạng thái">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className={inputCls}>
            <option value="ACTIVE">Hoạt động</option>
            <option value="BLOCKED">Bị khóa</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL: DRIVER
   ════════════════════════════════════════════════════════════════════════════ */
function DriverFormModal({ open, driver, onClose, onSave }) {
  const empty = { fullName: '', phone: '', licenseNo: '', assignedBus: '', status: 'ACTIVE' };
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(driver ?? empty); }, [driver, open]); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.licenseNo) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={driver ? 'Sửa tài xế' : 'Thêm tài xế mới'}
      subtitle={driver ? `ID #${driver.id}` : 'Tạo hồ sơ tài xế mới'}
      footer={
        <>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Hủy
          </button>
          <button type="submit" form="driver-form"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm">
            <Save className="w-4 h-4" /> {driver ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </>
      }
    >
      <form id="driver-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Họ và tên" required>
          <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                 className={inputCls} placeholder="Trần Văn Lái" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Số điện thoại" required>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                   className={inputCls} placeholder="0901234567" required />
          </Field>
          <Field label="Số GPLX" required>
            <input value={form.licenseNo} onChange={e => setForm({ ...form, licenseNo: e.target.value })}
                   className={inputCls} placeholder="B2-123456" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Biển số xe phụ trách">
            <input value={form.assignedBus} onChange={e => setForm({ ...form, assignedBus: e.target.value })}
                   className={inputCls} placeholder="29B-123.45" />
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className={inputCls}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL: ROUTE
   ════════════════════════════════════════════════════════════════════════════ */
function RouteFormModal({ open, route, onClose, onSave }) {
  const empty = {
    code: '', origin: '', destination: '', distance: 100,
    duration: '', basePrice: 200000, status: 'ACTIVE',
  };
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(route ?? empty); }, [route, open]); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.origin || !form.destination) return;
    onSave({
      ...form,
      distance:  +form.distance,
      basePrice: +form.basePrice,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={route ? 'Sửa tuyến đường' : 'Thêm tuyến đường mới'}
      subtitle={route ? `Mã ${route.code}` : 'Khai thác tuyến đường mới'}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Hủy
          </button>
          <button type="submit" form="route-form"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm">
            <Save className="w-4 h-4" /> {route ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </>
      }
    >
      <form id="route-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Mã tuyến" required>
          <input value={form.code}
                 onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                 className={inputCls} placeholder="HN-SP-01" required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Điểm đi" required>
            <input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })}
                   className={inputCls} placeholder="Hà Nội" required />
          </Field>
          <Field label="Điểm đến" required>
            <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
                   className={inputCls} placeholder="Sa Pa" required />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Khoảng cách (km)" required>
            <input type="number" min="1" value={form.distance}
                   onChange={e => setForm({ ...form, distance: e.target.value })}
                   className={inputCls} required />
          </Field>
          <Field label="Thời gian" required>
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                   className={inputCls} placeholder="5h 30m" required />
          </Field>
          <Field label="Giá cơ bản (đ)" required>
            <input type="number" min="0" step="1000" value={form.basePrice}
                   onChange={e => setForm({ ...form, basePrice: e.target.value })}
                   className={inputCls} required />
          </Field>
        </div>

        <Field label="Trạng thái">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className={inputCls}>
            <option value="ACTIVE">Đang khai thác</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}