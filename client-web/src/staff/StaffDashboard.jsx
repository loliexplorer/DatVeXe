import React, { useState } from 'react';
import {
  LayoutDashboard, Bus, Ticket, Users, UserCheck, Map, Bell, LogOut,
  Plus, Search, Edit2, Eye, Trash2, XCircle, X, CheckCircle2, AlertCircle,
  ScanLine, Star, RefreshCw,
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

const NAV_GROUPS = [
  { label: 'Vận hành', items: [
      { id: 'overview', label: 'Tổng quan ca', Icon: LayoutDashboard },
      { id: 'trips',    label: 'Chuyến xe',    Icon: Bus },
      { id: 'bookings', label: 'Đặt vé',       Icon: Ticket, badgeKey: 'pending' },
      { id: 'checkin',  label: 'Soát vé',      Icon: ScanLine },
      { id: 'users',    label: 'Hành khách',   Icon: Users },
      { id: 'drivers',  label: 'Tài xế',       Icon: UserCheck },
  ]},
  { label: 'Danh mục', items: [
      { id: 'routes', label: 'Tuyến đường', Icon: Map },
  ]},
];

const inputCls = 'w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-medium bg-white';

/* ─── Shared components ─────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

function SeatTag({ seat }) {
  return <span className="bg-brand-50 border border-brand-200 text-brand-800 font-bold text-xs px-2 py-0.5 rounded-md mr-1">{seat}</span>;
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
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
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

function ReadOnlyBanner() {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      <Eye className="w-3 h-3" /> Chế độ chỉ xem
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN STAFF DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
export default function StaffDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Operational data
  const [bookings,   setBookings]   = useState(MOCK.bookings);
  const [trips,      setTrips]      = useState(MOCK.trips);
  const [passengers, setPassengers] = useState(MOCK.passengers ?? []);
  const [users]                     = useState(MOCK.users);      // read-only
  const [drivers]                   = useState(MOCK.drivers);    // read-only
  const [routes]                    = useState(MOCK.routes);     // read-only

  // Filters
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [search,        setSearch]        = useState('');

  // Modals
  const [tripModal,    setTripModal]    = useState({ open: false, trip: null });
  const [walkUpModal,  setWalkUpModal]  = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const badges = { pending: pendingCount };

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleCancelBooking = (id) => {
    if (!confirm('Hủy đơn đặt vé này? Tiền sẽ được hoàn lại cho khách.')) return;
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    showToast('Đã hủy đơn và bắt đầu hoàn tiền.');
  };

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

  const handleWalkUpBooking = (data) => {
    const newBooking = {
      id: Date.now(),
      code: `WALK-${String(Date.now()).slice(-6)}`,
      passengerName: data.passengerName,
      phone: data.phone,
      route: data.route,
      departureTime: data.departureTime,
      seats: data.seats,
      total: data.total,
      status: 'PAID',
    };
    setBookings(prev => [newBooking, ...prev]);
    // add passengers to check-in list
    const newPassengers = data.seats.map((s, i) => ({
      id: Date.now() + i,
      tripId: data.tripId,
      seat: s,
      name: data.passengerName,
      phone: data.phone,
      pickupPoint: 'Bán tại quầy',
      qrCode: `QR-TRIP${data.tripId}-${s}-WALK${Date.now()}`,
      isCheckedIn: false,
    }));
    setPassengers(prev => [...prev, ...newPassengers]);
    // decrement seats on trip
    setTrips(prev => prev.map(t => t.id === data.tripId ? { ...t, seatsLeft: Math.max(0, t.seatsLeft - data.seats.length) } : t));
    showToast(`Đã bán ${data.seats.length} vé tại quầy.`);
    setWalkUpModal(false);
  };

  const handleCheckIn = (passengerId) => {
    setPassengers(prev => prev.map(p => p.id === passengerId ? { ...p, isCheckedIn: true } : p));
  };

  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(n => n.id === activeTab)?.label ?? 'Tổng quan ca';

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-50">
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
            <div className="text-brand-400 text-[10px] font-semibold uppercase tracking-wide">Staff</div>
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
            {currentUser?.fullName?.charAt(0) ?? 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-xs truncate">{currentUser?.fullName ?? 'Staff'}</div>
            <div className="text-brand-400 text-[10px] font-semibold">Nhân viên</div>
          </div>
          <button onClick={onLogout} title="Đăng xuất"
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-brand-300 flex items-center justify-center transition-all">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-slate-500">
            Hệ thống / <strong className="text-slate-900">{activeLabel}</strong>
          </p>
          <div className="flex items-center gap-2.5">
            <button className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center relative hover:bg-slate-200 transition-all">
              <Bell className="w-4 h-4 text-slate-500" />
              {pendingCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />}
            </button>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full pl-1 pr-3 py-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center font-black text-xs text-white">
                {currentUser?.fullName?.charAt(0) ?? 'S'}
              </div>
              <span className="text-xs font-bold text-slate-800">{currentUser?.fullName ?? 'Staff'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              bookings={bookings}
              trips={trips}
              passengers={passengers}
              pendingCount={pendingCount}
              onCancel={handleCancelBooking}
              onOpenWalkUp={() => setWalkUpModal(true)}
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
                         pendingCount={pendingCount} onCancel={handleCancelBooking}
                         onOpenWalkUp={() => setWalkUpModal(true)} />
          )}
          {activeTab === 'checkin' && (
            <CheckInTab trips={trips} passengers={passengers} onCheckIn={handleCheckIn} />
          )}
          {activeTab === 'users'   && <UsersTab   users={users}   search={search} setSearch={setSearch} />}
          {activeTab === 'drivers' && <DriversTab drivers={drivers} search={search} setSearch={setSearch} />}
          {activeTab === 'routes'  && <RoutesTab  routes={routes}  search={search} setSearch={setSearch} />}
        </div>
      </div>

      <TripFormModal     open={tripModal.open}   trip={tripModal.trip}   routes={routes} drivers={drivers}
                         onClose={() => setTripModal({ open: false, trip: null })}  onSave={handleSaveTrip} />
      <WalkUpBookingModal open={walkUpModal}     trips={trips}
                          onClose={() => setWalkUpModal(false)}                      onSave={handleWalkUpBooking} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: OVERVIEW — operational metrics
   ════════════════════════════════════════════════════════════════════════════ */
function OverviewTab({ bookings, trips, passengers, pendingCount, onCancel, onOpenWalkUp }) {
  const activeTrips  = trips.filter(t => t.status === 'RUNNING').length;
  const seatsSold    = bookings.filter(b => b.status !== 'CANCELLED').reduce((a, b) => a + b.seats.length, 0);
  const checkedIn    = passengers.filter(p => p.isCheckedIn).length;
  const sortedTrips  = [...trips].sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Tổng quan ca làm việc 🎫</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}Ca sáng · Nhân viên: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onOpenWalkUp}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Bán vé tại quầy
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Chuyến đang chạy',   value: activeTrips,          icon: '🚌', bg: 'bg-blue-50'  },
          { label: 'Vé đã bán hôm nay',  value: seatsSold,            icon: '🎫', bg: 'bg-brand-50' },
          { label: 'Đã soát vé',         value: checkedIn,            icon: '✅', bg: 'bg-purple-50' },
          { label: 'Chờ xác nhận',       value: pendingCount,         icon: '⏳', bg: 'bg-amber-50' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center text-xl mb-3`}>{k.icon}</div>
            <div className="text-2xl font-black text-slate-900">{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Today's trip timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-slate-800 text-sm">Lịch chạy hôm nay</div>
            <div className="text-xs text-slate-400 mt-0.5">{trips.length} chuyến · sắp xếp theo giờ khởi hành</div>
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="space-y-2">
          {sortedTrips.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm font-black text-slate-900 w-14 flex-shrink-0">{t.departureTime}</div>
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{t.busName} · {t.route}</div>
                <div className="text-xs text-slate-500">TX: {t.driver} · {t.totalSeats - t.seatsLeft}/{t.totalSeats} ghế</div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="font-bold text-slate-800 text-sm">Đặt vé gần đây</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Mã', 'Hành khách', 'Tuyến', 'Giờ', 'Ghế', 'Tổng tiền', 'Trạng thái', ''].map(h => (
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
   TAB: TRIPS (full CRUD — staff need this)
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
                   placeholder="Tìm chuyến xe, tuyến..." className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
          <button onClick={onAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Thêm chuyến xe
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
              {filtered.length === 0 ? <EmptyState message="Không tìm thấy chuyến xe phù hợp" />
                : filtered.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
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
                          <button onClick={() => onEdit(t)} className="text-xs text-brand-600 font-bold hover:text-brand-500 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Sửa
                          </button>
                          <button onClick={() => onDelete(t.id)} className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
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
   TAB: BOOKINGS (cancel + walk-up entry point)
   ════════════════════════════════════════════════════════════════════════════ */
function BookingsTab({ bookings, filter, setFilter, pendingCount, onCancel, onOpenWalkUp }) {
  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý đặt vé</h1>
          <p className="text-xs text-slate-500 mt-0.5">{bookings.length} đơn hôm nay · {pendingCount} chờ xác nhận</p>
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
          <button onClick={onOpenWalkUp}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> Bán vé tại quầy
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
              {filtered.length === 0 ? <EmptyState message="Không có đơn đặt vé nào" />
                : filtered.map(b => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800 whitespace-nowrap">{b.code}</td>
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
                          <button onClick={() => onCancel(b.id)}
                                  className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1">
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
   TAB: CHECK-IN — staff-only feature
   ════════════════════════════════════════════════════════════════════════════ */
function CheckInTab({ trips, passengers, onCheckIn }) {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? null);
  const [qrInput,        setQrInput]        = useState('');
  const [scanMessage,    setScanMessage]    = useState(null);

  const tripPassengers = passengers.filter(p => p.tripId === selectedTripId);
  const checkedInCount = tripPassengers.filter(p => p.isCheckedIn).length;

  const handleScan = (code) => {
    const q = (code || qrInput).trim();
    if (!q) return;

    const match = tripPassengers.find(p =>
      p.qrCode === q || p.seat.toLowerCase() === q.toLowerCase()
    );

    if (!match) {
      setScanMessage({ type: 'error', text: 'Mã vé không hợp lệ hoặc không thuộc chuyến này!' });
    } else if (match.isCheckedIn) {
      setScanMessage({ type: 'warning', text: `Ghế ${match.seat} (${match.name}) ĐÃ SOÁT TRƯỚC ĐÓ!` });
    } else {
      onCheckIn(match.id);
      setScanMessage({ type: 'success', text: `✓ Đã soát ghế ${match.seat} — ${match.name}` });
    }
    setQrInput('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">Soát vé & Điểm danh 🧑‍✈️</h1>
        <p className="text-xs text-slate-500 mt-0.5">Quét mã QR hoặc nhập số ghế để check-in hành khách</p>
      </div>

      {/* Trip selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Chọn chuyến</label>
        <div className="flex flex-wrap gap-2">
          {trips.map(t => (
            <button key={t.id} onClick={() => { setSelectedTripId(t.id); setScanMessage(null); setQrInput(''); }}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                      selectedTripId === t.id
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                    }`}>
              {t.departureTime} · {t.busName}
            </button>
          ))}
        </div>
      </div>

      {/* QR scanner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Quét mã QR (hoặc nhập số ghế):
        </label>
        <div className="flex gap-2">
          <input type="text" value={qrInput}
                 onChange={e => setQrInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleScan()}
                 placeholder="VD: A01 hoặc QR-TRIP1-A01-..."
                 className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-semibold" />
          <button onClick={() => handleScan()}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-sm flex items-center gap-1.5 active:scale-95">
            <ScanLine className="w-4 h-4" /> Soát vé
          </button>
        </div>

        {scanMessage && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${
            scanMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            scanMessage.type === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
            'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            {scanMessage.text}
          </div>
        )}
      </div>

      {/* Passenger list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800 text-sm">Danh sách hành khách</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {checkedInCount}/{tripPassengers.length} đã lên xe
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {tripPassengers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Chưa có hành khách nào cho chuyến này</div>
          ) : tripPassengers.map(p => (
            <div key={p.id} className={`p-4 flex items-center justify-between transition-all ${
              p.isCheckedIn ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center ${
                  p.isCheckedIn ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>{p.seat}</span>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                  <span className="text-xs text-slate-500">SĐT: {p.phone} · {p.pickupPoint}</span>
                </div>
              </div>
              {p.isCheckedIn ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-900">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã lên xe
                </span>
              ) : (
                <button onClick={() => handleScan(p.qrCode)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 font-bold text-xs transition-all border border-slate-300">
                  Điểm danh
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB: USERS (READ-ONLY)
   ════════════════════════════════════════════════════════════════════════════ */
function UsersTab({ users, search, setSearch }) {
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
          <h1 className="text-xl font-black text-slate-900">Danh sách hành khách</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {users.length} tài khoản · {users.filter(u => u.status === 'ACTIVE').length} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <ReadOnlyBanner />
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tên, email, SĐT..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Hành khách', 'Liên hệ', 'Đăng ký', 'Đặt vé', 'Chi tiêu', 'Trạng thái'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <EmptyState message="Không có hành khách" />
                : filtered.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
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
   TAB: DRIVERS (READ-ONLY)
   ════════════════════════════════════════════════════════════════════════════ */
function DriversTab({ drivers, search, setSearch }) {
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
          <h1 className="text-xl font-black text-slate-900">Danh sách tài xế</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {drivers.length} tài xế · {drivers.filter(d => d.status === 'ACTIVE').length} đang hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <ReadOnlyBanner />
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tên, SĐT, GPLX..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Tài xế', 'SĐT', 'GPLX', 'Xe phụ trách', 'Đánh giá', 'Số chuyến', 'Trạng thái'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <EmptyState message="Không có tài xế" />
                : filtered.map(d => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
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
   TAB: ROUTES (READ-ONLY)
   ════════════════════════════════════════════════════════════════════════════ */
function RoutesTab({ routes, search, setSearch }) {
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
          <h1 className="text-xl font-black text-slate-900">Danh mục tuyến đường</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {routes.length} tuyến · {routes.filter(r => r.status === 'ACTIVE').length} đang khai thác
          </p>
        </div>
        <div className="flex gap-2">
          <ReadOnlyBanner />
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Tìm tuyến, mã..."
                   className="text-sm font-medium focus:outline-none min-w-[200px]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Mã tuyến', 'Lộ trình', 'Khoảng cách', 'Thời gian', 'Giá cơ bản', 'Chuyến hôm nay', 'Trạng thái'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <EmptyState message="Không có tuyến đường" />
                : filtered.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
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
   FORM MODAL: TRIP (staff needs this)
   ════════════════════════════════════════════════════════════════════════════ */
function TripFormModal({ open, trip, routes = [], drivers = [], onClose, onSave }) {
  const empty = { busName: '', route: '', departureTime: '07:00', driver: '', totalSeats: 20, status: 'PENDING' };
  const [form, setForm] = useState(empty);
  React.useEffect(() => { setForm(trip ?? empty); }, [trip, open]);

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
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm">
            {trip ? 'Lưu thay đổi' : 'Thêm mới'}
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
   MODAL: WALK-UP BOOKING (staff-only feature)
   ════════════════════════════════════════════════════════════════════════════ */
function WalkUpBookingModal({ open, trips, onClose, onSave }) {
  const [form, setForm] = useState({
    tripId: trips[0]?.id ?? '',
    passengerName: '',
    phone: '',
    seatsText: '',
    payment: 'CASH',
  });

  React.useEffect(() => {
    if (open) setForm({ tripId: trips[0]?.id ?? '', passengerName: '', phone: '', seatsText: '', payment: 'CASH' });
  }, [open, trips]);

  const trip = trips.find(t => t.id === Number(form.tripId));
  const seats = form.seatsText.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const tripPrice = trip ? 350000 : 0;  // simple price derived from route; adjust as needed
  const total = seats.length * tripPrice;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trip || !form.passengerName || !form.phone || seats.length === 0) return;
    onSave({
      tripId: trip.id,
      passengerName: form.passengerName,
      phone: form.phone,
      route: trip.route,
      departureTime: trip.departureTime,
      seats,
      total,
      payment: form.payment,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bán vé tại quầy"
      subtitle="Tạo đơn đặt vé trực tiếp cho khách mua tại bến"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Hủy
          </button>
          <button type="submit" form="walkup-form"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm">
            Xác nhận bán vé ({total.toLocaleString('vi-VN')} đ)
          </button>
        </>
      }
    >
      <form id="walkup-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Chọn chuyến" required>
          <select value={form.tripId} onChange={e => setForm({ ...form, tripId: e.target.value })}
                  className={inputCls} required>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.departureTime} · {t.busName} · {t.route} ({t.totalSeats - t.seatsLeft}/{t.totalSeats} ghế)
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tên khách" required>
            <input value={form.passengerName} onChange={e => setForm({ ...form, passengerName: e.target.value })}
                   className={inputCls} placeholder="Nguyễn Văn A" required />
          </Field>
          <Field label="SĐT" required>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                   className={inputCls} placeholder="0901234567" required />
          </Field>
        </div>

        <Field label="Số ghế (phân cách bằng dấu phẩy)" required>
          <input value={form.seatsText} onChange={e => setForm({ ...form, seatsText: e.target.value })}
                 className={inputCls} placeholder="A01, A02" required />
          {seats.length > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              Đã chọn: {seats.map(s => <SeatTag key={s} seat={s} />)}
            </div>
          )}
        </Field>

        <Field label="Hình thức thanh toán">
          <select value={form.payment} onChange={e => setForm({ ...form, payment: e.target.value })}
                  className={inputCls}>
            <option value="CASH">Tiền mặt</option>
            <option value="CARD">Thẻ / POS</option>
            <option value="TRANSFER">Chuyển khoản</option>
          </select>
        </Field>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Số vé:</span>
            <span className="font-bold">{seats.length}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Đơn giá:</span>
            <span className="font-bold">{tripPrice.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
            <span className="font-bold text-slate-800">Tổng cộng:</span>
            <span className="font-black text-brand-700 text-lg">{total.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}