import React, { useEffect, useRef, useState } from 'react';
import { X, Navigation, Phone, Gauge, Clock, ShieldCheck, MapPin, Bus, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tọa độ tuyến Hà Nội - Sa Pa qua cao tốc Nội Bài - Lào Cai
const ROUTE_COORDINATES = [
  [21.0285, 105.7783], // Bến xe Mỹ Đình (Hà Nội)
  [21.1214, 105.7758], // Trạm thu phí Nội Bài
  [21.3256, 105.5892], // Vĩnh Phúc
  [21.4333, 105.2833], // Trạm dừng chân Km117 (Phù Ninh - Phú Thọ)
  [21.7167, 104.9000], // Yên Bái
  [22.1500, 104.3500], // Bảo Thắng (Lào Cai)
  [22.3364, 103.8438]  // Bến xe Sa Pa (Điểm đến)
];

export default function TripTrackingModal({ isOpen, onClose, ticket }) {
  if (!isOpen) return null;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(2); // Vị trí xe hiện tại (đang giữa Phú Thọ và Yên Bái)
  const [speed, setSpeed] = useState(65);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix lỗi icon marker mặc định của Leaflet trong webpack/vite
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // 1. Khởi tạo bản đồ OpenStreetMap miễn phí
    const map = L.map(mapContainerRef.current).setView([21.65, 104.9], 8);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // 2. Vẽ đường lộ trình (Polyline) màu xanh ngọc lục bảo
    const routeLine = L.polyline(ROUTE_COORDINATES, {
      color: '#059669',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
    }).addTo(map);

    // Zoom vừa vặn toàn bộ tuyến đường
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    // 3. Đánh dấu Điểm xuất phát (Hà Nội)
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div style="background-color: #064e3b; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">HN</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker(ROUTE_COORDINATES[0], { icon: startIcon })
      .addTo(map)
      .bindPopup('<b>Bến xe Mỹ Đình (Hà Nội)</b><br>Xuất bến: 07:00 (Đã chạy)');

    // 4. Đánh dấu Trạm dừng nghỉ chân (Km117)
    const restIcon = L.divIcon({
      className: 'custom-rest-marker',
      html: `<div style="background-color: #f59e0b; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">☕</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker(ROUTE_COORDINATES[3], { icon: restIcon })
      .addTo(map)
      .bindPopup('<b>Trạm dừng nghỉ Km117</b><br>Dừng nghỉ chân ăn uống (20 phút)');

    // 5. Đánh dấu Điểm đến (Sa Pa)
    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `<div style="background-color: #dc2626; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">SP</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker(ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1], { icon: destIcon })
      .addTo(map)
      .bindPopup('<b>Bến xe Sa Pa</b><br>Dự kiến đến bến: 12:30');

    // 6. Đánh dấu Chiếc xe bus đang di chuyển thời gian thực (Live Bus Marker)
    const busIcon = L.divIcon({
      className: 'live-bus-marker',
      html: `
        <div style="position: relative;">
          <div style="position: absolute; top: -10px; left: -10px; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background-color: #10b981; color: #022c22; border: 2.5px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(16,185,129,0.5); position: relative; z-index: 10;">
            🚌
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const busMarker = L.marker(ROUTE_COORDINATES[currentStep], { icon: busIcon })
      .addTo(map)
      .bindPopup(`<b>Xe 29B-998.88</b><br>Tốc độ: ${speed} km/h<br>Đang chạy trên Cao tốc`)
      .openPopup();

    // Giả lập tốc độ dao động nhẹ
    const speedInterval = setInterval(() => {
      setSpeed(prev => Math.floor(62 + Math.random() * 8));
    }, 3000);

    return () => {
      clearInterval(speedInterval);
      map.remove();
    };
  }, [currentStep]);

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
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Theo Dõi Hành Trình Trực Tuyến</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live GPS
                </span>
              </div>
              <p className="text-xs text-brand-300">
                Mã vé: <span className="font-mono font-bold text-white">{ticket?.bookingCode || "BK20261106-0001"}</span> • Chuyến Hà Nội ➔ Sa Pa
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
              <span className="font-black text-slate-800 text-sm">142 km <span className="font-normal text-slate-400 text-xs">/ 315 km</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Dự kiến đến nơi</span>
              <span className="font-black text-slate-800 text-sm">~ 2 giờ 15 phút</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Xe phụ trách</span>
              <span className="font-black text-slate-800 text-sm">29B-998.88</span>
            </div>
          </div>
        </div>

        {/* Thân Modal: Bản đồ Leaflet + Cột thông tin hành trình */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-[420px] overflow-hidden">
          
          {/* Cột trái: Khung bản đồ Leaflet */}
          <div className="flex-1 relative bg-slate-100 min-h-[300px]">
            <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
            
            {/* Chú thích góc bản đồ */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[11px] font-semibold text-slate-700 z-10 flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> Điểm xuất phát</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Trạm dừng</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Điểm đến</span>
            </div>
          </div>

          {/* Cột phải: Timeline tiến trình & Tài xế */}
          <div className="w-full lg:w-80 bg-white p-5 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wider">
                Tiến độ hành trình
              </h4>

              {/* Timeline các chặng */}
              <div className="space-y-4 relative pl-5 border-l-2 border-emerald-500 my-4 text-xs">
                
                {/* Chặng 1: Bến xe Mỹ Đình */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <span className="font-bold text-slate-800 block text-xs">Bến xe Mỹ Đình (Hà Nội)</span>
                  <span className="text-slate-400 block text-[11px]">07:00 • Đã xuất bến đúng giờ</span>
                </div>

                {/* Chặng 2: Trạm dừng Km117 Phù Ninh */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white text-white flex items-center justify-center text-[9px] animate-pulse">
                    ●
                  </span>
                  <span className="font-bold text-amber-800 block text-xs">Trạm dừng chân Km117 (Phù Ninh)</span>
                  <span className="text-slate-500 block text-[11px]">09:15 • Xe đang di chuyển tới (còn 15 phút)</span>
                </div>

                {/* Chặng 3: Bến xe Sa Pa */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></span>
                  <span className="font-bold text-slate-600 block text-xs">Bến xe Sa Pa (Lào Cai)</span>
                  <span className="text-slate-400 block text-[11px]">12:30 (Dự kiến) • Điểm trả khách cuối</span>
                </div>

              </div>

              {/* Card thông tin tài xế */}
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
                      <span className="font-bold text-slate-900 text-sm block">Trần Văn Lái</span>
                      <span className="text-[11px] text-slate-500">GPLX Hạng E • 5 năm kn</span>
                    </div>
                  </div>

                  <a
                    href="tel:0902000001"
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
