import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus, Bell, Send, CircleHelp, LogOut, Download, CheckCheck, Truck, Clock,
  MapPin, ScanLine, LayoutGrid, Check, Ellipsis, LoaderCircle, ShieldAlert, Flag
} from 'lucide-react';
import { getToken, clearToken, getProfileApi } from '../services/userApi';
import RideCheckInModal from './RideCheckInModal'; // Modal soát vé theo cuốc xe (dữ liệu mẫu) - khác DriverCheckInModal dùng API thật ở trang khách hàng
import {
  buildAssignedRides, NEARBY_REQUESTS, RADIUS_OPTIONS, requestToRide,
  getDriverCode, timeAgo, formatVnd
} from '../data/driverMockData';

const VIEWS = {
  notifications: { hash: '#thong-bao', label: 'Thông báo cuốc xe' },
  tracking: { hash: '#theo-doi', label: 'Theo dõi' }
};

function viewFromHash() {
  return window.location.hash === VIEWS.tracking.hash ? 'tracking' : 'notifications';
}

function initials(name = '') {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Lưu trạng thái cổng tài xế theo từng tài khoản (để giữ nguyên khi chuyển qua lại trang khách hàng)
function storageKey(user) {
  return `ecobus_driver_state_${user.id}`;
}

function loadState(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(user)));
    if (saved && Array.isArray(saved.rides)) return saved;
  } catch { /* bỏ qua dữ liệu lỗi */ }
  return {
    rides: buildAssignedRides(user),
    acceptedRequestIds: [],
    nearbyEnabled: true,
    radius: 5
  };
}

/* ------------------------------------------------------------------ */
/* Khung trang: kiểm tra đăng nhập & quyền tài xế                       */
/* ------------------------------------------------------------------ */
export default function DriverApp() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | forbidden

  useEffect(() => {
    if (!getToken()) {
      window.location.replace('/');
      return;
    }
    getProfileApi()
      .then((profile) => {
        setUser(profile);
        setStatus(profile.role === 'DRIVER' ? 'ok' : 'forbidden');
      })
      .catch(() => {
        clearToken();
        window.location.replace('/');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 gap-2 text-sm">
        <LoaderCircle className="w-5 h-5 animate-spin text-brand-600" /> Đang tải Cổng tài xế...
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-lg font-extrabold text-slate-900">Không có quyền truy cập</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cổng tài xế chỉ dành cho tài khoản Tài xế. Bạn đang đăng nhập với tài khoản {user?.fullName}.
          </p>
          <a href="/" className="inline-block mt-5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold">
            Về trang khách hàng
          </a>
        </div>
      </div>
    );
  }

  return <DriverPortal user={user} />;
}

/* ------------------------------------------------------------------ */
/* Cổng tài xế                                                          */
/* ------------------------------------------------------------------ */
function DriverPortal({ user }) {
  const [view, setView] = useState(viewFromHash);
  const [state, setState] = useState(() => loadState(user));
  const [checkInRideId, setCheckInRideId] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { rides, acceptedRequestIds, nearbyEnabled, radius } = state;

  useEffect(() => {
    localStorage.setItem(storageKey(user), JSON.stringify(state));
  }, [state, user]);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goTo = (nextView) => {
    window.location.hash = VIEWS[nextView].hash;
    setView(nextView);
  };

  const updateRide = (rideId, patch) => {
    setState(s => ({
      ...s,
      rides: s.rides.map(r => (r.id === rideId ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r))
    }));
  };

  const markRead = (rideId) => updateRide(rideId, { isRead: true });
  const markAllRead = () => setState(s => ({ ...s, rides: s.rides.map(r => ({ ...r, isRead: true })) }));
  const completeRide = (rideId) => {
    if (!window.confirm('Xác nhận kết thúc cuốc xe này?')) return;
    updateRide(rideId, { status: 'COMPLETED', progress: 100, isRead: true });
  };
  const checkInPassenger = (rideId, passengerId) => {
    updateRide(rideId, r => ({
      passengers: r.passengers.map(p => (p.id === passengerId ? { ...p, isCheckedIn: true } : p))
    }));
  };
  const acceptRequest = (request) => {
    setState(s => ({
      ...s,
      acceptedRequestIds: [...s.acceptedRequestIds, request.id],
      rides: [...s.rides, requestToRide(request, user)]
    }));
  };

  const handleLogout = () => {
    clearToken();
    window.location.href = '/';
  };

  const exportRides = () => {
    const blob = new Blob([JSON.stringify(rides, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuoc-xe-${getDriverCode(user)}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unreadCount = rides.filter(r => !r.isRead).length;
  const activeRides = rides.filter(r => r.status === 'ACCEPTED');
  const checkInRide = rides.find(r => r.id === checkInRideId) || null;
  const driverCode = getDriverCode(user);

  const navItems = [
    { key: 'notifications', icon: Bell, count: unreadCount },
    { key: 'tracking', icon: Send, count: activeRides.length }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
        <a href="/" className="flex items-center gap-3 px-5 h-[72px] border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="block font-extrabold text-slate-900 leading-tight">EcoBus</span>
            <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Cổng tài xế</span>
          </div>
        </a>

        <nav className="flex-1 px-3 py-6">
          <p className="px-3 mb-3 text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Không gian làm việc</p>
          <ul className="space-y-1">
            {navItems.map(({ key, icon: Icon, count }) => {
              const active = view === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => goTo(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      active ? 'bg-brand-50 text-brand-800 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left">{VIEWS[key].label}</span>
                    {count > 0 && (
                      <span className={`min-w-[22px] h-[22px] px-1.5 rounded-md text-[11px] font-bold flex items-center justify-center ${
                        key === 'notifications' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3 space-y-2">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium">
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            Trang khách hàng
          </a>
          <div className="relative flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-500">{driverCode}</p>
            </div>
            <button
              onClick={() => setIsUserMenuOpen(o => !o)}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-400 flex items-center justify-center"
              title="Tùy chọn tài khoản"
            >
              <Ellipsis className="w-4 h-4" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-20">
                {user.driverProfile?.license_number && (
                  <p className="px-3 py-2 text-[11px] text-slate-500 border-b border-slate-100">
                    GPLX: <span className="font-semibold text-slate-700">{user.driverProfile.license_number}</span>
                  </p>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-sm">
            <span className="text-slate-400">Cổng tài xế</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-bold text-slate-900">{VIEWS[view].label}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              title="Trợ giúp"
              onClick={() => alert('Cổng tài xế EcoBus\n\n• Thông báo cuốc xe: các cuốc điều hành giao cho bạn và khách gọi xe gần đây.\n• Theo dõi: các cuốc đang chạy, soát vé và kết thúc cuốc.\n\nHotline điều hành: 1900 6868')}
              className="text-slate-400 hover:text-slate-700"
            >
              <CircleHelp className="w-5 h-5" />
            </button>
            <button
              title="Thông báo"
              onClick={() => goTo('notifications')}
              className="relative text-slate-400 hover:text-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
                {initials(user.fullName)}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{user.fullName}</span>
            </div>
            <button title="Đăng xuất" onClick={handleLogout} className="text-slate-400 hover:text-rose-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Thanh điều hướng cho màn hình nhỏ (sidebar bị ẩn) */}
        <div className="md:hidden flex gap-2 px-4 pt-4">
          {navItems.map(({ key, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm border ${
                view === key ? 'bg-brand-50 border-brand-200 text-brand-800 font-bold' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" /> {VIEWS[key].label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>

        <main className="flex-1 px-4 sm:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            {view === 'notifications' ? (
              <NotificationsView
                user={user}
                rides={rides}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onExport={exportRides}
                onOpenCheckIn={setCheckInRideId}
                nearbyEnabled={nearbyEnabled}
                radius={radius}
                acceptedRequestIds={acceptedRequestIds}
                onToggleNearby={(v) => setState(s => ({ ...s, nearbyEnabled: v }))}
                onChangeRadius={(v) => setState(s => ({ ...s, radius: v }))}
                onAcceptRequest={acceptRequest}
              />
            ) : (
              <TrackingView
                rides={activeRides}
                onOpenCheckIn={setCheckInRideId}
                onComplete={completeRide}
              />
            )}
          </div>
        </main>
      </div>

      <RideCheckInModal
        isOpen={Boolean(checkInRide)}
        ride={checkInRide}
        onClose={() => setCheckInRideId(null)}
        onCheckIn={(passengerId) => checkInPassenger(checkInRide.id, passengerId)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Màn hình: Thông báo cuốc xe                                          */
/* ------------------------------------------------------------------ */
function PageHeading({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-brand-700 uppercase mb-2">{eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

function NotificationsView({
  user, rides, onMarkRead, onMarkAllRead, onExport, onOpenCheckIn,
  nearbyEnabled, radius, acceptedRequestIds, onToggleNearby, onChangeRadius, onAcceptRequest
}) {
  const [tab, setTab] = useState('ALL'); // ALL | ASSIGNED

  const visibleRides = useMemo(() => {
    const list = tab === 'ASSIGNED' ? rides.filter(r => r.source === 'ASSIGNED') : rides;
    return [...list].sort((a, b) => b.notifiedAt - a.notifiedAt);
  }, [rides, tab]);

  const nearby = NEARBY_REQUESTS.filter(
    r => r.distanceKm <= radius && !acceptedRequestIds.includes(r.id)
  );

  const outlineBtn = 'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm';

  return (
    <>
      <PageHeading
        eyebrow="Điều hành chuyến xe"
        title="Thông báo cuốc xe"
        subtitle="Chỉ hiển thị cuốc đã được giao cho tài xế cụ thể."
        actions={
          <>
            <button onClick={onExport} className={outlineBtn}>
              <Download className="w-4 h-4" /> Sao lưu cuốc xe
            </button>
            <button onClick={onMarkAllRead} className={outlineBtn}>
              <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc
            </button>
          </>
        }
      />

      <div className="flex items-center gap-3 px-5 py-4 mb-6 rounded-2xl bg-brand-50/70 border border-brand-100">
        <Bell className="w-4 h-4 text-brand-600" />
        <p className="flex-1 text-sm text-slate-600">Thông báo hiển thị cuốc xe có tên tài xế và phương tiện phụ trách.</p>
        <span className="px-3 py-1 rounded-full bg-white text-xs font-bold text-slate-700 border border-brand-100">
          {rides.length} cuốc
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Danh sách thông báo */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">Cuốc xe được giao cho {user.fullName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chỉ hiển thị thông báo gắn với tài khoản tài xế đang đăng nhập.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Vừa cập nhật
            </span>
          </div>

          <div className="px-6 pb-3 flex gap-1 border-b border-slate-100">
            {[['ALL', 'Tất cả'], ['ASSIGNED', 'Cuốc được giao']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  tab === key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleRides.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">Chưa có cuốc xe nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleRides.map(ride => (
                <RideNotification
                  key={ride.id}
                  ride={ride}
                  onMarkRead={() => onMarkRead(ride.id)}
                  onOpenCheckIn={() => { onMarkRead(ride.id); onOpenCheckIn(ride.id); }}
                />
              ))}
            </ul>
          )}

          <p className="px-6 py-4 border-t border-slate-100 text-[11px] text-slate-400">Dữ liệu thông báo hiện là dữ liệu mẫu.</p>
        </section>

        {/* Cột phải */}
        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Tùy chọn cuốc gần đây
            </h3>
            <p className="text-xs text-slate-500 mt-1">Chọn nhận yêu cầu gọi xe ở gần vị trí tài xế.</p>

            <label className="mt-4 flex items-center justify-between px-3 py-3 rounded-xl bg-slate-50 cursor-pointer">
              <span className="text-sm font-semibold text-slate-700">Nhận thông báo cuốc gần</span>
              <input
                type="checkbox"
                checked={nearbyEnabled}
                onChange={(e) => onToggleNearby(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
            </label>

            <label className="block mt-4 text-xs font-medium text-slate-500">Bán kính nhận cuốc</label>
            <select
              value={radius}
              disabled={!nearbyEnabled}
              onChange={(e) => onChangeRadius(Number(e.target.value))}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-brand-500 disabled:opacity-50"
            >
              {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="mt-2 text-[11px] text-slate-400">Khoảng cách hiện dùng dữ liệu mô phỏng, chưa lấy GPS thực tế.</p>
          </section>

          {nearbyEnabled && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Khách gọi xe gần đây</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhận cuốc cho tài khoản {user.fullName}.</p>
                </div>
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold flex items-center justify-center">
                  {nearby.length}
                </span>
              </div>
              {nearby.length === 0 ? (
                <p className="px-5 pb-5 text-xs text-slate-400">Không có khách gọi xe trong bán kính đã chọn.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {nearby.map(req => (
                    <li key={req.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.place}</p>
                          <p className="text-[11px] text-slate-500">Đến {req.destination}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold">
                          {req.distanceKm.toLocaleString('vi-VN')} km
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                        <span>{req.passengerCount} hành khách · {formatVnd(req.price)}</span>
                        <span>{timeAgo(req.requestedAt)}</span>
                      </div>
                      <button
                        onClick={() => onAcceptRequest(req)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold active:scale-[0.98]"
                      >
                        <Check className="w-3.5 h-3.5" /> Nhận cuốc
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function RideNotification({ ride, onMarkRead, onOpenCheckIn }) {
  const boarded = ride.passengers.filter(p => p.isCheckedIn).length;
  const completed = ride.status === 'COMPLETED';
  const title = ride.source === 'ASSIGNED'
    ? `Cuốc xe ${ride.code} đã được phân công`
    : `Bạn đã nhận cuốc ${ride.code}`;

  return (
    <li className={`px-6 py-5 ${ride.isRead ? '' : 'bg-brand-50/30'}`}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <ScanLine className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              {title}
              {!ride.isRead && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </p>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
              <Clock className="w-3 h-3" /> {timeAgo(ride.notifiedAt)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tài xế <span className="font-semibold text-slate-700">{ride.driverName}</span> ({ride.driverCode}) sẽ lái phương tiện{' '}
            <span className="font-semibold text-slate-700">{ride.plateNumber}</span>.
          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-100 bg-white">
            <Detail icon={Truck} label="Phương tiện" value={ride.plateNumber} hint={ride.busTypeName} />
            <Detail icon={Send} label="Tuyến đường" value={ride.routeLabel} hint={`${ride.pickup} → ${ride.dropoff}`} />
            <Detail icon={Clock} label="Giờ khởi hành" value={ride.departTime} hint="Tài xế đã được chỉ định" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">Đã lên xe: {boarded}/{ride.passengers.length}</span>
            {completed ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                <Flag className="w-3.5 h-3.5" /> Cuốc đã kết thúc
              </span>
            ) : (
              <div className="flex items-center gap-4">
                {!ride.isRead && (
                  <button onClick={onMarkRead} className="text-xs font-bold text-brand-700 hover:text-brand-600">
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={onOpenCheckIn}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  <ScanLine className="w-3.5 h-3.5" /> Quét QR / soát vé
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Detail({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
        <p className="text-[10px] text-slate-400 leading-snug">{hint}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Màn hình: Theo dõi cuốc xe đang nhận                                 */
/* ------------------------------------------------------------------ */
function TrackingView({ rides, onOpenCheckIn, onComplete }) {
  return (
    <>
      <PageHeading
        eyebrow="Chuyến đang diễn ra"
        title="Theo dõi cuốc xe đang nhận"
        subtitle="Theo dõi các cuốc đã được tài xế nhận, từ điểm đón đến điểm trả khách."
      />

      <div className="flex items-center gap-3 px-5 py-3.5 mb-6 rounded-2xl bg-brand-50/70 border border-brand-100 text-sm text-slate-600">
        <Send className="w-4 h-4 text-brand-600" />
        {rides.length} cuốc xe đang được theo dõi
      </div>

      {rides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Chưa có cuốc xe nào đang chạy. Nhận cuốc mới ở mục Thông báo cuốc xe.
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map(ride => {
            const boarded = ride.passengers.filter(p => p.isCheckedIn).length;
            return (
              <article key={ride.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{ride.code} · {ride.driverName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Xe {ride.plateNumber} · Khởi hành {ride.departTime}</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Đang nhận cuốc
                  </span>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Điểm đón</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{ride.pickup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-brand-600 uppercase">Vị trí hiện tại · {ride.progress}%</p>
                    <p className="text-sm font-bold text-brand-700 mt-1">{ride.currentStop}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Điểm trả khách</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{ride.dropoff}</p>
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all"
                    style={{ width: `${ride.progress}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    Dự kiến đến: <span className="font-bold text-slate-700">{ride.etaTime}</span> · Khách đã lên xe: {boarded}/{ride.passengers.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenCheckIn(ride.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brand-200 bg-brand-50/50 text-brand-700 hover:bg-brand-50 text-xs font-bold"
                    >
                      <ScanLine className="w-3.5 h-3.5" /> Soát vé
                    </button>
                    <button
                      onClick={() => onComplete(ride.id)}
                      className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      Kết thúc cuốc
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
