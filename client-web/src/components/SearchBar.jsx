import React, { useState } from 'react';
import { MapPin, Calendar, ArrowRightLeft, Search } from 'lucide-react';
import { STATIONS } from '../data/mockData';

export default function SearchBar({ onSearch, initialOrigin = "Hà Nội", initialDest = "Sa Pa" }) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDest);
  const [departDate, setDepartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (origin === destination) {
      alert("Điểm xuất phát và điểm đến không được trùng nhau!");
      return;
    }
    onSearch({ origin, destination, departDate });
  };

  // Distinct cities from stations
  const cities = Array.from(new Set(STATIONS.map(s => s.city)));

  return (
    <div className="w-full max-w-5xl mx-auto -mt-12 relative z-20 px-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-4 sm:p-6 transition-all hover:shadow-2xl hover:shadow-emerald-950/10"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Điểm đi */}
          <div className="md:col-span-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl p-3 border border-slate-200 transition-colors">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              Điểm xuất phát
            </label>
            <select 
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-800 text-base focus:outline-none cursor-pointer"
            >
              {cities.map(c => (
                <option key={`origin-${c}`} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 block truncate">
              {STATIONS.find(s => s.city === origin)?.name || "Bến xe trung tâm"}
            </span>
          </div>

          {/* Nút đảo chiều */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Đổi chiều đi - về"
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-600 flex items-center justify-center transition-all border border-slate-200 shadow-sm hover:rotate-180 duration-300"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Điểm đến */}
          <div className="md:col-span-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl p-3 border border-slate-200 transition-colors">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Điểm đến
            </label>
            <select 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-800 text-base focus:outline-none cursor-pointer"
            >
              {cities.map(c => (
                <option key={`dest-${c}`} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 block truncate">
              {STATIONS.find(s => s.city === destination)?.name || "Bến xe trung tâm"}
            </span>
          </div>

          {/* Ngày đi */}
          <div className="md:col-span-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl p-3 border border-slate-200 transition-colors">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              Ngày khởi hành
            </label>
            <input 
              type="date"
              value={departDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-800 text-base focus:outline-none cursor-pointer"
            />
            <span className="text-[11px] text-brand-600 font-medium block">
              {departDate === new Date().toISOString().split('T')[0] ? "Hôm nay" : "Chuyến sắp tới"}
            </span>
          </div>

          {/* Nút tìm kiếm */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-[68px] rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-5 h-5 text-white" />
              <span className="text-sm">Tìm Chuyến</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
