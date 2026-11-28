import React, { useEffect, useRef, useState } from 'react';
import { X, Navigation, Phone, Gauge, Clock, Bus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTripTrackingApi, getTripJourneyLogsApi } from '../../services/busApi';

// Tọa độ dự phòng khi mất kết nối Internet tới OSRM
const FALLBACK_ROUTE_COORDINATES = [
  [21.0285, 105.7783], // Bến xe Mỹ Đình (Hà Nội)
  [21.1214, 105.7758], // Nội Bài
  [21.3256, 105.5892], // Vĩnh Phúc
  [21.4333, 105.2833], // Phú Thọ
  [21.7167, 104.9000], // Yên Bái
  [22.1500, 104.3500], // Bảo Thắng (Lào Cai)
  [22.3364, 103.8438]  // Bến xe Sa Pa
];

// Cache tuyến đường OSRM trong bộ nhớ để mở lại tức thì (0ms)
const osrmRouteCache = new Map();

async function fetchOsrmRoadRoute(originLat, originLng, destLat, destLng) {
  const cacheKey = `${originLat},${originLng}->${destLat},${destLng}`;
  if (osrmRouteCache.has(cacheKey)) {
    return osrmRouteCache.get(cacheKey);
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=simplified&geometries=geojson`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('OSRM status ' + res.status);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      throw new Error('Empty OSRM route');
    }

    // GeoJSON là [lng, lat] -> đảo sang [lat, lng] cho Leaflet
    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const result = {
      coords,
      distanceKm: Math.round(route.distance / 1000),
      durationMin: Math.round(route.duration / 60),
      isRealRoad: true
    };
    osrmRouteCache.set(cacheKey, result);
    return result;
  } catch {
    clearTimeout(timeout);
    return {
      coords: FALLBACK_ROUTE_COORDINATES,
      distanceKm: 315,
      durationMin: 330,
      isRealRoad: false
    };
  }
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.max(0, Math.round(minutes % 60));
  if (h <= 0) return `~ ${m} phút`;
  return `~ ${h} giờ ${m} phút`;
}

export default function TripTrackingModal({ isOpen, onClose, ticket }) {
  const mapContainerRef = useRef(null);
  const [speed, setSpeed] = useState(65);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [journeyLogs, setJourneyLogs] = useState([]);
  const [routeStats, setRouteStats] = useState({
    totalKm: 315,
    remainingKm: 132,
    etaText: '~ 2 giờ 15 phút',
    isRealRoad: false,
    loadingRoute: true
  });

  // 1. Lấy dữ liệu GPS từ trip-service & Nhật ký hành trình từ dispatch-service
  useEffect(() => {
    if (!isOpen) return;
    const tripId = ticket?.tripId || 1;

    getTripTrackingApi(tripId)
      .then((data) => {
        setTrackingInfo(data);
        if (data?.speed_kmh) setSpeed(data.speed_kmh);
      })
      .catch(() => {});

    getTripJourneyLogsApi(tripId)
      .then((data) => {
        if (data?.logs) setJourneyLogs(data.logs);
      })
      .catch(() => setJourneyLogs([]));
  }, [isOpen, ticket?.tripId]);

  // 2. Khởi tạo bản đồ Leaflet 1 lần duy nhất + vẽ đường bám mặt đường thật bằng OSRM
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isCancelled = false;
    let moveInterval = null;
    let speedInterval = null;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([21.65, 104.9], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const originLat = trackingInfo?.route?.origin?.lat || 21.0285;
    const originLng = trackingInfo?.route?.origin?.lng || 105.7780;
    const destLat = trackingInfo?.route?.destination?.lat || 22.3364;
    const destLng = trackingInfo?.route?.destination?.lng || 103.8438;
    const originName = trackingInfo?.route?.origin?.name || ticket?.origin || 'Bến xe Mỹ Đình (Hà Nội)';
    const destName = trackingInfo?.route?.destination?.name || ticket?.destination || 'Bến xe Sa Pa (Lào Cai)';
    const plate = trackingInfo?.plate_number || ticket?.plateNumber || '29B-998.88';

    setRouteStats(prev => ({ ...prev, loadingRoute: true }));

    fetchOsrmRoadRoute(originLat, originLng, destLat, destLng).then((routeData) => {
      if (isCancelled) return;

      const coords = routeData.coords;
      const startProgressRatio = (trackingInfo?.progress_percent || 45) / 100;
      let busIndex = Math.min(coords.length - 1, Math.max(1, Math.floor(coords.length * startProgressRatio)));
      const restIndex = Math.floor(coords.length * 0.5);

      const updateTelemetry = (idx) => {
        const remainRatio = Math.max(0, 1 - idx / Math.max(1, coords.length - 1));
        const remKm = Math.round(routeData.distanceKm * remainRatio);
        const remMin = Math.round(routeData.durationMin * remainRatio);
        setRouteStats({
          totalKm: routeData.distanceKm,
          remainingKm: remKm,
          etaText: formatDuration(remMin),
          isRealRoad: routeData.isRealRoad,
          loadingRoute: false
        });
      };

      // Đoạn đường đã đi qua (nét liền xanh ngọc đậm)
      const traveledLine = L.polyline(coords.slice(0, busIndex + 1), {
        color: '#059669',
        weight: 5,
        opacity: 0.95
      }).addTo(map);

      // Đoạn đường còn lại (nét đứt xanh nhạt)
      const remainingLine = L.polyline(coords.slice(busIndex), {
        color: '#64748b',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8'
      }).addTo(map);

      const fullBounds = L.latLngBounds(coords);
      map.fitBounds(fullBounds, { padding: [36, 36] });

      // Marker Điểm đi
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div style="background-color: #064e3b; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">ĐI</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(coords[0], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b>${originName}</b><br>Điểm xuất phát`);

      // Marker Trạm dừng nghỉ giữa tuyến
      const restIcon = L.divIcon({
        className: 'custom-rest-marker',
        html: `<div style="background-color: #f59e0b; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">☕</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(coords[restIndex], { icon: restIcon })
        .addTo(map)
        .bindPopup('<b>Trạm dừng nghỉ chân cao tốc</b><br>Dừng nghỉ 15–20 phút');

      // Marker Điểm đến
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="background-color: #dc2626; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">ĐẾN</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(coords[coords.length - 1], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>${destName}</b><br>Điểm đến cuối cùng`);

      // Marker Xe Bus Live bám sát mặt đường
      const busIcon = L.divIcon({
        className: 'live-bus-marker',
        html: `
          <div style="position: relative;">
            <div style="position: absolute; top: -8px; left: -8px; width: 48px; height: 48px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #10b981; color: #022c22; border: 2.5px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(16,185,129,0.5); position: relative; z-index: 10;">
              🚌
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const busMarker = L.marker(coords[busIndex], { icon: busIcon })
        .addTo(map)
        .bindPopup(`<b>Xe ${plate}</b><br>Đang di chuyển bám lộ trình thực tế`)
        .openPopup();

      updateTelemetry(busIndex);

      // Cho xe bus di chuyển mượt dọc theo tọa độ đường thật (chỉ gọi setLatLng, không render lại map)
      const stepStride = Math.max(1, Math.floor(coords.length / 180));
      moveInterval = setInterval(() => {
        if (busIndex < coords.length - 1) {
          busIndex = Math.min(coords.length - 1, busIndex + stepStride);
          busMarker.setLatLng(coords[busIndex]);
          traveledLine.setLatLngs(coords.slice(0, busIndex + 1));
          remainingLine.setLatLngs(coords.slice(busIndex));
          updateTelemetry(busIndex);
        }
      }, 1500);

      speedInterval = setInterval(() => {
        setSpeed(Math.floor(62 + Math.random() * 8));
      }, 3000);
    });

    return () => {
      isCancelled = true;
      if (moveInterval) clearInterval(moveInterval);
      if (speedInterval) clearInterval(speedInterval);
      map.remove();
    };
  }, [isOpen, trackingInfo?.trip_id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header Modal */}
        <div className="bg-brand-950 text-white px-6 py-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-brand-950 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white">Theo Dõi Hành Trình Trực Tuyến</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live GPS
                </span>
                {routeStats.isRealRoad && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    OSRM Road Routing
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-300">
                Mã vé: <span className="font-mono font-bold text-white">{ticket?.bookingCode || "BK20261106-0001"}</span> • {ticket?.origin || 'Hà Nội'} ➔ {ticket?.destination || 'Sa Pa'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh trạng thái nhanh (Telemetry Bar) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tốc độ hiện tại</span>
              <span className="font-black text-slate-800 text-sm">{speed} km/h</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Quãng đường còn lại</span>
              <span className="font-black text-slate-800 text-sm">
                {routeStats.remainingKm} km <span className="font-normal text-slate-400 text-xs">/ {routeStats.totalKm} km</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Dự kiến đến nơi</span>
              <span className="font-black text-slate-800 text-sm">{routeStats.etaText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Xe phụ trách</span>
              <span className="font-black text-slate-800 text-sm">{trackingInfo?.plate_number || ticket?.plateNumber || '29B-998.88'}</span>
            </div>
          </div>
        </div>

        {/* Nội dung chính: Bản đồ bên trái + Timeline tiến độ bên phải */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Cột Trái: Khung Bản đồ OpenStreetMap Leaflet */}
          <div className="relative flex-1 min-h-[300px] lg:min-h-[420px] bg-slate-200 z-0">
            <div ref={mapContainerRef} className="w-full h-full min-h-[320px] z-0" />

            {routeStats.loadingRoute && (
              <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow border border-slate-200 text-[11px] font-bold text-brand-700">
                Đang tải lộ trình đường thật...
              </div>
            )}

            {/* Chú thích bản đồ nổi */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[11px] flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="w-3 h-1 rounded bg-emerald-600 inline-block"></span> Đã đi qua
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500 inline-block"></span> Sắp đi tới
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Trạm dừng
              </span>
            </div>
          </div>

          {/* Cột Phải: Timeline các mốc hành trình thực tế & Tài xế */}
          <div className="w-full lg:w-80 bg-white p-5 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wider">
                Tiến độ hành trình
              </h4>

              {/* Timeline các chặng thực tế từ dispatch-service */}
              <div className="space-y-4 relative pl-5 border-l-2 border-emerald-500 my-4 text-xs">
                {journeyLogs.length > 0 ? (
                  journeyLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <span className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 border-white text-white flex items-center justify-center text-[9px] font-bold ${
                        log.event_type === 'INCIDENT' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-600'
                      }`}>
                        {log.event_type === 'INCIDENT' ? '!' : '✓'}
                      </span>
                      <span className="font-bold text-slate-800 block text-xs">{log.checkpoint_name}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {new Date(log.logged_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {log.description || log.event_type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <span className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                    <span className="font-bold text-slate-800 block text-xs">{ticket?.origin || 'Bến xuất phát'}</span>
                    <span className="text-slate-400 block text-[11px]">{ticket?.departureTime || '07:00'} • Đang theo dõi lộ trình GPS</span>
                  </div>
                )}
              </div>

              {/* Card thông tin tài xế từ trip-service */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Tài xế chuyến xe
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-brand-950 font-black flex items-center justify-center text-sm">
                      TL
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {trackingInfo?.driver?.name || 'Trần Văn Lái'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        BKS: {trackingInfo?.plate_number || ticket?.plateNumber || '29B-998.88'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${trackingInfo?.driver?.phone || '0902000001'}`}
                    className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-brand-800 flex items-center justify-center transition-all shadow-xs"
                    title="Gọi cho tài xế"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Đóng bản đồ
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
