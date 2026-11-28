import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bus, Bell, Send, CircleHelp, LogOut, Download, CheckCheck, Truck, Clock,
  MapPin, ScanLine, LayoutGrid, Ellipsis, LoaderCircle, ShieldAlert, Flag,
  RefreshCw, Play, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { getToken, clearToken, getProfileApi } from '../services/userApi';
import {
  getDriverScheduleApi,
  getTripDetailApi,
  getTripTicketsApi,
  getTripJourneyLogsApi,
  updateDriverAssignmentStatusApi,
  addDriverJourneyLogApi
} from '../services/busApi';
import RideCheckInModal from './RideCheckInModal';

const VIEWS = {
  notifications: { hash: '#thong-bao', label: 'Thông báo cuốc xe' },
  tracking: { hash: '#theo-doi', label: 'Theo dõi' }
};

const STATUS_META = {
  ASSIGNED: { label: 'Chờ xuất bến', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'Đang chạy', badge: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-500' },
  DELAYED: { label: 'Có sự cố / Trễ', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  COMPLETED: { label: 'Đã hoàn thành', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' }
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

function getDriverCode(user) {
  return `TX-${String(user?.id || 1).padStart(4, '0')}`;
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Vừa cập nhật';
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return 'Vừa cập nhật';
  const minutes = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function readStorageKey(user) {
  return `ecobus_driver_read_ids_${user.id}`;
}

function loadReadIds(user) {
  try {
    const saved = JSON.parse(localStorage.getItem(readStorageKey(user)));
    if (Array.isArray(saved)) return new Set(saved);
  } catch { /* ignore */ }
  return new Set();
}

function computeProgress(status, logs = []) {
  if (status === 'COMPLETED') return 100;
  if (status === 'ASSIGNED') return 10;
  if (logs.some(l => l.event_type === 'ARRIVED')) return 100;
  if (logs.length >= 2) return 75;
  if (logs.length === 1) return 45;
  return 35;
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
        setStatus(String(profile.role || '').toUpperCase() === 'DRIVER' ? 'ok' : 'forbidden');
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
/* Cổng tài xế (100% dữ liệu thực từ Dispatch + Trip + Booking API)     */
/* ------------------------------------------------------------------ */
function DriverPortal({ user }) {
  const [view, setView] = useState(viewFromHash);
  const [rides, setRides] = useState([]);
  const [readIds, setReadIds] = useState(() => loadReadIds(user));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [checkInRideId, setCheckInRideId] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const driverCode = getDriverCode(user);

  const fetchRealSchedule = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const assignments = await getDriverScheduleApi();

      const enriched = await Promise.all(
        assignments.map(async (a) => {
          const [tripDetail, tickets, journeyData] = await Promise.all([
            getTripDetailApi(a.trip_id).catch(() => null),
            getTripTicketsApi(a.trip_id).catch(() => []),
            getTripJourneyLogsApi(a.trip_id).catch(() => null)
          ]);

          const logs = journeyData?.logs || [];
          const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
          const departStr = a.departure_time ? String(a.departure_time).slice(0, 5) : (tripDetail?.departureTime || '--:--');
          const shiftDateStr = a.shift_date ? String(a.shift_date).slice(0, 10) : '';

          return {
            id: a.id,
            tripId: a.trip_id,
            code: `CA-${String(a.id).padStart(4, '0')}`,
            driverName: a.driver_name || user.fullName,
            driverCode,
            plateNumber: a.bus_plate || tripDetail?.plateNumber || 'Đang cập nhật',
            busTypeName: tripDetail?.busTypeName || 'Xe khách EcoBus',
            routeLabel: a.route_name || (tripDetail ? `${tripDetail.originCity} → ${tripDetail.destinationCity}` : `Chuyến #${a.trip_id}`),
            pickup: tripDetail?.originStation || 'Bến xuất phát',
            dropoff: tripDetail?.destStation || 'Bến đích',
            departTime: shiftDateStr ? `${departStr} (${shiftDateStr})` : departStr,
            etaTime: tripDetail?.arrivalTime || 'Theo lịch trình',
            status: String(a.status || 'ASSIGNED').toUpperCase(),
            notes: a.notes || '',
            notifiedAt: a.updated_at || a.created_at || Date.now(),
            currentStop: latestLog
              ? `${latestLog.checkpoint_name}${latestLog.description ? ` — ${latestLog.description}` : ''}`
              : (a.status === 'COMPLETED' ? (tripDetail?.destStation || 'Đã đến bến đích') : (tripDetail?.originStation || 'Tại bến xuất phát')),
            progress: computeProgress(String(a.status || 'ASSIGNED').toUpperCase(), logs),
            logs,
            passengers: tickets.map(t => ({
              id: t.id,
              seat: t.seat_code,
              name: t.passenger_name,
              phone: t.customer_phone || 'Chưa cập nhật',
              bookingCode: t.booking_code,
              qrCode: t.qr_code,
              isCheckedIn: t.check_in_status === 'CHECKED_IN',
              checkedInAt: t.checked_in_at
            }))
          };
        })
      );

      setRides(enriched);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải lịch phân công từ Dispatch Service.');
    } finally {
      setLoading(false);
    }
  }, [user.fullName, driverCode]);

  useEffect(() => {
    fetchRealSchedule();
  }, [fetchRealSchedule]);

  useEffect(() => {
    localStorage.setItem(readStorageKey(user), JSON.stringify(Array.from(readIds)));
  }, [readIds, user]);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goTo = (nextView) => {
    window.location.hash = VIEWS[nextView].hash;
    setView(nextView);
  };

  const markRead = (rideId) => {
    setReadIds(prev => new Set([...prev, rideId]));
  };

  const markAllRead = () => {
    setReadIds(new Set(rides.map(r => r.id)));
  };

  const handleStartRide = async (ride) => {
    if (!window.confirm(`Xác nhận xuất bến cho ${ride.code} (${ride.routeLabel})?`)) return;
    setBusyId(ride.id);
    try {
      await updateDriverAssignmentStatusApi(ride.id, { status: 'IN_PROGRESS' });
      await addDriverJourneyLogApi(ride.id, {
        checkpoint_name: ride.pickup,
        event_type: 'DEPARTED',
        description: `Tài xế ${ride.driverName} xác nhận xuất bến đúng giờ.`
      }).catch(() => {});
      markRead(ride.id);
      await fetchRealSchedule();
    } catch (err) {
      alert(err.message || 'Không thể cập nhật trạng thái xuất bến.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCompleteRide = async (ride) => {
    if (!window.confirm(`Xác nhận hoàn thành cuốc xe ${ride.code}?`)) return;
    setBusyId(ride.id);
    try {
      await updateDriverAssignmentStatusApi(ride.id, { status: 'COMPLETED' });
      await addDriverJourneyLogApi(ride.id, {
        checkpoint_name: ride.dropoff,
        event_type: 'ARRIVED',
        description: 'Xe đã cập bến đích an toàn, hoàn tất ca chạy.'
      }).catch(() => {});
      markRead(ride.id);
      await fetchRealSchedule();
    } catch (err) {
      alert(err.message || 'Không thể kết thúc cuốc xe.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddCheckpoint = async (ride, { checkpoint_name, event_type, description }) => {
    setBusyId(ride.id);
    try {
      await addDriverJourneyLogApi(ride.id, { checkpoint_name, event_type, description });
      await fetchRealSchedule();
    } catch (err) {
      alert(err.message || 'Không thể ghi nhận nhật ký hành trình.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePassengerCheckedIn = async (tripId, ticketId) => {
    // Cập nhật tức thì trên UI rồi đồng bộ lại từ server
    setRides(prev =>
      prev.map(r =>
        r.tripId === tripId
          ? {
              ...r,
              passengers: r.passengers.map(p => (p.id === ticketId ? { ...p, isCheckedIn: true } : p))
            }
          : r
      )
    );
    try {
      const freshTickets = await getTripTicketsApi(tripId);
      setRides(prev =>
        prev.map(r =>
          r.tripId === tripId
            ? {
                ...r,
                passengers: freshTickets.map(t => ({
                  id: t.id,
                  seat: t.seat_code,
                  name: t.passenger_name,
                  phone: t.customer_phone || 'Chưa cập nhật',
                  bookingCode: t.booking_code,
                  qrCode: t.qr_code,
                  isCheckedIn: t.check_in_status === 'CHECKED_IN',
                  checkedInAt: t.checked_in_at
                }))
              }
            : r
        )
      );
    } catch { /* ignore */ }
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
    a.download = `lich-chay-${driverCode}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unreadCount = rides.filter(r => !readIds.has(r.id)).length;
  const activeRides = rides.filter(r => ['ASSIGNED', 'IN_PROGRESS', 'DELAYED'].includes(r.status));
  const checkInRide = rides.find(r => r.id === checkInRideId) || null;

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
              title="Làm mới dữ liệu từ hệ thống"
              onClick={fetchRealSchedule}
              disabled={loading}
              className="text-slate-400 hover:text-brand-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>
            <button
              title="Trợ giúp"
              onClick={() => alert('Cổng tài xế EcoBus (Dữ liệu thực)\n\n• Thông báo cuốc xe: danh sách ca chạy điều hành giao từ Dispatch Service.\n• Theo dõi: xuất bến, soát vé QR thật (Booking Service), ghi trạm dừng / sự cố và kết thúc cuốc.\n\nHotline điều hành: 1900 6868')}
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

        {/* Thanh điều hướng cho màn hình nhỏ */}
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
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between gap-3">
                <span>{errorMsg}</span>
                <button
                  onClick={fetchRealSchedule}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  Thử lại
                </button>
              </div>
            )}

            {loading && rides.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
                <LoaderCircle className="w-7 h-7 animate-spin text-brand-600" />
                <p className="text-sm font-medium">Đang tải lịch chạy & danh sách hành khách từ máy chủ...</p>
              </div>
            ) : view === 'notifications' ? (
              <NotificationsView
                user={user}
                rides={rides}
                readIds={readIds}
                busyId={busyId}
                loading={loading}
                onRefresh={fetchRealSchedule}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onExport={exportRides}
                onStartRide={handleStartRide}
                onOpenCheckIn={(rideId) => { markRead(rideId); setCheckInRideId(rideId); }}
              />
            ) : (
              <TrackingView
                rides={activeRides}
                busyId={busyId}
                onOpenCheckIn={setCheckInRideId}
                onStartRide={handleStartRide}
                onComplete={handleCompleteRide}
                onAddCheckpoint={handleAddCheckpoint}
              />
            )}
          </div>
        </main>
      </div>

      <RideCheckInModal
        isOpen={Boolean(checkInRide)}
        ride={checkInRide}
        onClose={() => setCheckInRideId(null)}
        onCheckedIn={handlePassengerCheckedIn}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Màn hình: Thông báo cuốc xe (Dữ liệu thực từ Dispatch Service)       */
/* ------------------------------------------------------------------ */
function PageHeading({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-brand-700 uppercase mb-2">{eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function NotificationsView({
  user, rides, readIds, busyId, loading, onRefresh,
  onMarkRead, onMarkAllRead, onExport, onStartRide, onOpenCheckIn
}) {
  const [tab, setTab] = useState('ALL'); // ALL | ACTIVE | COMPLETED

  const visibleRides = useMemo(() => {
    if (tab === 'ACTIVE') return rides.filter(r => ['ASSIGNED', 'IN_PROGRESS', 'DELAYED'].includes(r.status));
    if (tab === 'COMPLETED') return rides.filter(r => r.status === 'COMPLETED');
    return rides;
  }, [rides, tab]);

  const stats = useMemo(() => {
    const totalPassengers = rides.reduce((sum, r) => sum + r.passengers.length, 0);
    const boardedPassengers = rides.reduce((sum, r) => sum + r.passengers.filter(p => p.isCheckedIn).length, 0);
    return {
      assigned: rides.filter(r => r.status === 'ASSIGNED').length,
      inProgress: rides.filter(r => r.status === 'IN_PROGRESS' || r.status === 'DELAYED').length,
      completed: rides.filter(r => r.status === 'COMPLETED').length,
      totalPassengers,
      boardedPassengers
    };
  }, [rides]);

  const outlineBtn = 'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm';

  return (
    <>
      <PageHeading
        eyebrow="Điều hành chuyến xe"
        title="Thông báo cuốc xe"
        subtitle="Đồng bộ trực tiếp lịch phân công ca chạy từ Dispatch Service & danh sách hành khách từ Booking Service."
        actions={
          <>
            <button onClick={onRefresh} disabled={loading} className={outlineBtn}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button onClick={onExport} className={outlineBtn}>
              <Download className="w-4 h-4" /> Sao lưu JSON
            </button>
            <button onClick={onMarkAllRead} className={outlineBtn}>
              <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Danh sách ca chạy thực tế */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">Ca chạy được phân công cho {user.fullName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chỉ hiển thị các chuyến gắn với tài khoản tài xế đang đăng nhập.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Dữ liệu trực tiếp
            </span>
          </div>

          <div className="px-6 pb-3 flex gap-1 border-b border-slate-100">
            {[
              ['ALL', `Tất cả (${rides.length})`],
              ['ACTIVE', `Đang hoạt động (${stats.assigned + stats.inProgress})`],
              ['COMPLETED', `Đã hoàn thành (${stats.completed})`]
            ].map(([key, label]) => (
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
            <p className="px-6 py-10 text-center text-sm text-slate-400">Không có ca chạy nào trong mục này.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleRides.map(ride => (
                <RideNotification
                  key={ride.id}
                  ride={ride}
                  isRead={readIds.has(ride.id)}
                  busy={busyId === ride.id}
                  onMarkRead={() => onMarkRead(ride.id)}
                  onStartRide={() => onStartRide(ride)}
                  onOpenCheckIn={() => onOpenCheckIn(ride.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Cột phải: Tổng quan ca trực thực tế */}
        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Tổng quan ca trực
            </h3>
            <p className="text-xs text-slate-500 mt-1">Thống kê trực tiếp từ cơ sở dữ liệu hệ thống.</p>

            <div className="mt-4 space-y-2.5">
              <StatRow label="Chờ xuất bến" value={stats.assigned} color="text-amber-700 bg-amber-50" />
              <StatRow label="Đang chạy" value={stats.inProgress} color="text-brand-700 bg-brand-50" />
              <StatRow label="Đã hoàn thành" value={stats.completed} color="text-slate-700 bg-slate-100" />
              <StatRow
                label="Khách đã soát vé"
                value={`${stats.boardedPassengers}/${stats.totalPassengers}`}
                color="text-emerald-700 bg-emerald-50"
              />
            </div>

            {user.driverProfile?.license_number && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>GPLX: <span className="font-bold text-slate-800">{user.driverProfile.license_number}</span></p>
                {user.driverProfile?.experience_years !== undefined && (
                  <p>Kinh nghiệm: <span className="font-bold text-slate-800">{user.driverProfile.experience_years} năm</span></p>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${color}`}>{value}</span>
    </div>
  );
}

function RideNotification({ ride, isRead, busy, onMarkRead, onStartRide, onOpenCheckIn }) {
  const boarded = ride.passengers.filter(p => p.isCheckedIn).length;
  const completed = ride.status === 'COMPLETED' || ride.status === 'CANCELLED';
  const meta = STATUS_META[ride.status] || STATUS_META.ASSIGNED;

  return (
    <li className={`px-6 py-5 ${isRead ? '' : 'bg-brand-50/30'}`}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <ScanLine className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              Ca chạy {ride.code} — {ride.routeLabel}
              {!isRead && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${meta.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                <Clock className="w-3 h-3" /> {timeAgo(ride.notifiedAt)}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            Tài xế <span className="font-semibold text-slate-700">{ride.driverName}</span> ({ride.driverCode}) • Phương tiện{' '}
            <span className="font-semibold text-slate-700">{ride.plateNumber}</span>
            {ride.notes ? ` • Ghi chú: ${ride.notes}` : ''}
          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-100 bg-white">
            <Detail icon={Truck} label="Phương tiện" value={ride.plateNumber} hint={ride.busTypeName} />
            <Detail icon={Send} label="Tuyến đường" value={ride.routeLabel} hint={`${ride.pickup} → ${ride.dropoff}`} />
            <Detail icon={Clock} label="Giờ khởi hành" value={ride.departTime} hint={`Chuyến #${ride.tripId}`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Hành khách đã lên xe: <strong className="text-brand-700">{boarded}/{ride.passengers.length}</strong>
            </span>
            {completed ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                <Flag className="w-3.5 h-3.5" /> {meta.label}
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                {!isRead && (
                  <button onClick={onMarkRead} className="text-xs font-bold text-brand-700 hover:text-brand-600 px-2">
                    Đánh dấu đã đọc
                  </button>
                )}
                {ride.status === 'ASSIGNED' && (
                  <button
                    disabled={busy}
                    onClick={onStartRide}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" /> Xuất bến
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
/* Màn hình: Theo dõi ca chạy đang hoạt động                            */
/* ------------------------------------------------------------------ */
function TrackingView({ rides, busyId, onOpenCheckIn, onStartRide, onComplete, onAddCheckpoint }) {
  const [logOpenId, setLogOpenId] = useState(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [eventType, setEventType] = useState('REST_STOP');
  const [description, setDescription] = useState('');

  const submitLog = async (e, ride) => {
    e.preventDefault();
    if (!checkpointName.trim()) return;
    await onAddCheckpoint(ride, {
      checkpoint_name: checkpointName.trim(),
      event_type: eventType,
      description: description.trim()
    });
    setCheckpointName('');
    setDescription('');
    setEventType('REST_STOP');
    setLogOpenId(null);
  };

  return (
    <>
      <PageHeading
        eyebrow="Chuyến đang diễn ra"
        title="Theo dõi cuốc xe đang nhận"
        subtitle="Cập nhật trạng thái xuất bến, ghi nhận trạm dừng / sự cố dọc đường và soát vé trực tiếp trên hệ thống."
      />

      <div className="flex items-center gap-3 px-5 py-3.5 mb-6 rounded-2xl bg-brand-50/70 border border-brand-100 text-sm text-slate-600">
        <Send className="w-4 h-4 text-brand-600" />
        {rides.length} ca chạy đang hoạt động / chờ xuất bến
      </div>

      {rides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Hiện chưa có ca chạy nào đang hoạt động.
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map(ride => {
            const boarded = ride.passengers.filter(p => p.isCheckedIn).length;
            const meta = STATUS_META[ride.status] || STATUS_META.IN_PROGRESS;
            const busy = busyId === ride.id;

            return (
              <article key={ride.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{ride.code} · {ride.routeLabel}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Xe {ride.plateNumber} · Khởi hành {ride.departTime}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${meta.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                  </span>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Điểm đón</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{ride.pickup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-brand-600 uppercase">Mốc mới nhất · {ride.progress}%</p>
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

                {ride.logs.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nhật ký hành trình ({ride.logs.length})</p>
                    {ride.logs.slice(-3).map(log => (
                      <div key={log.id} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span className="truncate">
                          <strong className="text-slate-800">[{log.event_type}]</strong> {log.checkpoint_name}
                          {log.description ? ` — ${log.description}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(log.logged_at)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {logOpenId === ride.id && (
                  <form onSubmit={(e) => submitLog(e, ride)} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={checkpointName}
                        onChange={e => setCheckpointName(e.target.value)}
                        placeholder="Tên trạm dừng / vị trí (VD: Trạm dừng Km57)"
                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold outline-none focus:border-brand-500"
                      />
                      <select
                        value={eventType}
                        onChange={e => setEventType(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold outline-none focus:border-brand-500 bg-white"
                      >
                        <option value="REST_STOP">Trạm dừng chân (REST_STOP)</option>
                        <option value="INCIDENT">Báo cáo sự cố / kẹt xe (INCIDENT)</option>
                        <option value="DEPARTED">Đã rời trạm (DEPARTED)</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Mô tả chi tiết (không bắt buộc)..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-brand-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setLogOpenId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-50"
                      >
                        Lưu nhật ký
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    Dự kiến đến: <span className="font-bold text-slate-700">{ride.etaTime}</span> · Khách đã lên xe:{' '}
                    <span className="font-bold text-brand-700">{boarded}/{ride.passengers.length}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenCheckIn(ride.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brand-200 bg-brand-50/50 text-brand-700 hover:bg-brand-50 text-xs font-bold"
                    >
                      <ScanLine className="w-3.5 h-3.5" /> Soát vé
                    </button>
                    <button
                      onClick={() => setLogOpenId(logOpenId === ride.id ? null : ride.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Ghi trạm / Sự cố
                    </button>
                    {ride.status === 'ASSIGNED' ? (
                      <button
                        disabled={busy}
                        onClick={() => onStartRide(ride)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" /> Xuất bến
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => onComplete(ride)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kết thúc cuốc
                      </button>
                    )}
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
