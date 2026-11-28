import React, { useState } from 'react';
import { X, ScanLine, CheckCircle } from 'lucide-react';

/**
 * Modal soát vé / điểm danh hành khách cho 1 cuốc xe.
 * Danh sách hành khách do component cha quản lý (để đồng bộ số "Đã lên xe" ở Cổng tài xế).
 *
 * Props:
 *  - isOpen, onClose
 *  - ride: { code, routeLabel, departTime, plateNumber, passengers: [{ id, seat, name, phone, pickupPoint, qrCode, isCheckedIn }] }
 *  - onCheckIn(passengerId)
 */
export default function RideCheckInModal({ isOpen, onClose, ride, onCheckIn }) {
  const [inputQr, setInputQr] = useState('');
  const [scanMessage, setScanMessage] = useState(null);

  if (!isOpen || !ride) return null;

  const passengers = ride.passengers || [];

  const handleClose = () => {
    setInputQr('');
    setScanMessage(null);
    onClose();
  };

  // Xử lý quét / nhập mã vé
  const handleScan = (codeToScan) => {
    const code = (codeToScan || inputQr).trim();
    if (!code) return;

    const found = passengers.find(
      p => p.qrCode === code || p.seat.toLowerCase() === code.toLowerCase()
    );
    if (found) {
      if (found.isCheckedIn) {
        setScanMessage({ type: 'warning', text: `Ghế ${found.seat} (${found.name}) ĐÃ ĐƯỢC SOÁT VÉ TRƯỚC ĐÓ!` });
      } else {
        onCheckIn(found.id);
        setScanMessage({ type: 'success', text: `Soát vé thành công: Ghế ${found.seat} - ${found.name}` });
      }
    } else {
      setScanMessage({ type: 'error', text: 'Mã vé không hợp lệ hoặc không thuộc chuyến xe này!' });
    }
    setInputQr('');
  };

  const checkedCount = passengers.filter(p => p.isCheckedIn).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">

        {/* Header Modal */}
        <div className="sticky top-0 bg-brand-900 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-brand-950 flex items-center justify-center font-bold">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Soát vé & Điểm danh • {ride.code}</h3>
              <p className="text-xs text-brand-300">
                Chuyến: {ride.routeLabel} ({ride.departTime}) • BKS: {ride.plateNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleScan(); }}
          >
            <input
              type="text"
              value={inputQr}
              onChange={(e) => setInputQr(e.target.value)}
              placeholder={`VD: Nhập ${passengers[0]?.seat || 'A01'} hoặc dán mã QR...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none text-sm font-semibold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <ScanLine className="w-4 h-4" /> Soát vé
            </button>
          </form>

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
              Danh sách hành khách ({checkedCount}/{passengers.length} đã lên xe)
            </span>
            <span className="text-xs text-slate-400">Bấm nút để điểm danh thủ công</span>
          </div>

          {passengers.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">Cuốc xe này chưa có hành khách đặt vé.</p>
          )}

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
