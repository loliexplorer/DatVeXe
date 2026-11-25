import React, { useState, useEffect } from 'react';
import { X, ScanLine, CheckCircle, ShieldAlert, Bus, User, MapPin } from 'lucide-react';
import { checkInTicketApi, getDriverScheduleApi } from '../../services/busApi';

export default function DriverCheckInModal({ isOpen, onClose }) {
  const [schedule, setSchedule] = useState(null);
  const [checkedList, setCheckedList] = useState([]);
  const [inputQr, setInputQr] = useState('');
  const [scanMessage, setScanMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getDriverScheduleApi()
      .then((rows) => {
        if (rows && rows.length > 0) setSchedule(rows[0]);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý quét / nhập mã vé thật qua booking-service
  const handleScan = async (codeToScan) => {
    const code = (codeToScan || inputQr).trim();
    if (!code) return;

    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await checkInTicketApi(code);
      const tk = res.data;
      setScanMessage({ type: 'success', text: res.message });
      if (tk) {
        setCheckedList(prev => [
          {
            id: tk.id || Date.now(),
            seat: tk.seat_code,
            name: tk.passenger_name,
            qrCode: code,
            checkedAt: tk.checked_in_at ? new Date(tk.checked_in_at).toLocaleTimeString('vi-VN') : 'Vừa xong'
          },
          ...prev.filter(item => item.qrCode !== code)
        ]);
      }
      setInputQr('');
    } catch (err) {
      const isAlready = err.message && err.message.includes('check-in trước đó');
      setScanMessage({
        type: isAlready ? 'warning' : 'error',
        text: err.message || 'Mã vé không hợp lệ hoặc không thể check-in!'
      });
    } finally {
      setIsScanning(false);
    }
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
              <p className="text-xs text-brand-300">
                {schedule
                  ? `Chuyến: ${schedule.route_name} (${schedule.departure_time}) • BKS: ${schedule.bus_plate}`
                  : 'Chuyến: Hà Nội ➔ Sa Pa • BKS: 29B-998.88'}
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
              disabled={isScanning}
              onClick={() => handleScan()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <ScanLine className="w-4 h-4" /> {isScanning ? 'Đang soát...' : 'Soát vé'}
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span>Mã vé mẫu trong DB:</span>
            <button
              type="button"
              onClick={() => handleScan('QR-TRIP1-SEAT-A01-SEC99182')}
              className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:border-brand-500 font-mono text-slate-700"
            >
              QR-TRIP1-SEAT-A01-SEC99182
            </button>
            <button
              type="button"
              onClick={() => handleScan('QR-TRIP1-SEAT-A02-SEC99183')}
              className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:border-brand-500 font-mono text-slate-700"
            >
              QR-TRIP1-SEAT-A02-SEC99183
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

        {/* Lịch sử vé vừa soát thành công */}
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase">
              Hành khách đã soát vé trong phiên ({checkedList.length})
            </span>
            <span className="text-xs text-slate-400">Kết nối trực tiếp Booking Service</span>
          </div>

          {checkedList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Nhập hoặc dán mã QR từ vé của hành khách để thực hiện check-in lên xe.
            </p>
          ) : (
            checkedList.map(p => (
              <div
                key={p.id}
                className="p-4 rounded-xl border bg-emerald-50/60 border-emerald-300 text-slate-800 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center bg-emerald-600 text-white">
                    {p.seat}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{p.qrCode}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-900">
                  <CheckCircle className="w-3.5 h-3.5" /> Đã lên xe ({p.checkedAt})
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
