import React, { useState } from 'react';
import { X, ScanLine, CheckCircle, ShieldAlert, Bus, User, MapPin } from 'lucide-react';

export default function DriverCheckInModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [passengers, setPassengers] = useState([
    {
      id: 1,
      seat: "A01",
      name: "Hoàng Khách Hàng",
      phone: "0903000001",
      pickupPoint: "Bến xe Mỹ Đình",
      qrCode: "QR-TRIP1-SEAT-A01-SEC99182",
      isCheckedIn: false
    },
    {
      id: 2,
      seat: "A02",
      name: "Nguyễn Thị Bạn",
      phone: "0903000002",
      pickupPoint: "Bến xe Mỹ Đình",
      qrCode: "QR-TRIP1-SEAT-A02-SEC99183",
      isCheckedIn: true
    },
    {
      id: 3,
      seat: "A05",
      name: "Lê Văn Khách",
      phone: "0905999888",
      pickupPoint: "Đón tại Sân bay Nội Bài",
      qrCode: "QR-TRIP1-SEAT-A05-SEC99184",
      isCheckedIn: false
    }
  ]);

  const [inputQr, setInputQr] = useState('');
  const [scanMessage, setScanMessage] = useState(null);

  // Xử lý quét / nhập mã vé
  const handleScan = (codeToScan) => {
    const code = codeToScan || inputQr.trim();
    if (!code) return;

    const found = passengers.find(p => p.qrCode === code || p.seat.toLowerCase() === code.toLowerCase());
    if (found) {
      if (found.isCheckedIn) {
        setScanMessage({ type: 'warning', text: `Ghế ${found.seat} (${found.name}) ĐÃ ĐƯỢC SOÁT VÉ TRƯỚC ĐÓ!` });
      } else {
        setPassengers(prev => prev.map(p => p.id === found.id ? { ...p, isCheckedIn: true } : p));
        setScanMessage({ type: 'success', text: `Soát vé thành công: Ghế ${found.seat} - ${found.name}` });
      }
    } else {
      setScanMessage({ type: 'error', text: 'Mã vé không hợp lệ hoặc không thuộc chuyến xe này!' });
    }
    setInputQr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Header Modal */}
        <div className="sticky top-0 bg-brand-900 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-brand-950 flex items-center justify-center font-bold">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Chế độ Tài xế • Soát vé & Điểm danh</h3>
              <p className="text-xs text-brand-300">Chuyến: Hà Nội ➔ Sa Pa (07:00) • BKS: 29B-998.88</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Khung quét mã QR */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Quét mã QR từ vé của khách (hoặc nhập số ghế):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputQr}
              onChange={(e) => setInputQr(e.target.value)}
              placeholder="VD: Nhập A01 hoặc dán mã QR-TRIP1..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-semibold"
            />
            <button
              type="button"
              onClick={() => handleScan()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <ScanLine className="w-4 h-4" /> Soát vé
            </button>
          </div>

          {/* Thông báo quét */}
          {scanMessage && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              scanMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              scanMessage.type === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {scanMessage.text}
            </div>
          )}
        </div>

        {/* Danh sách hành khách trên chuyến */}
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase">
              Danh sách hành khách ({passengers.filter(p => p.isCheckedIn).length}/{passengers.length} đã lên xe)
            </span>
            <span className="text-xs text-slate-400">Bấm nút để điểm danh thủ công</span>
          </div>

          {passengers.map(p => (
            <div 
              key={p.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                p.isCheckedIn 
                  ? "bg-emerald-50/60 border-emerald-300 text-slate-800" 
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center ${
                  p.isCheckedIn ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  {p.seat}
                </span>

                <div>
                  <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    SĐT: {p.phone} • {p.pickupPoint}
                  </span>
                </div>
              </div>

              <div>
                {p.isCheckedIn ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-900">
                    <CheckCircle className="w-3.5 h-3.5" /> Đã lên xe
                  </span>
                ) : (
                  <button
                    onClick={() => handleScan(p.qrCode)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 font-bold text-xs transition-all border border-slate-300"
                  >
                    Điểm danh
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
