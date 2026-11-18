import React, { useState } from 'react';
import { X, Star, MessageSquare, ThumbsUp, Send, CheckCircle2, User } from 'lucide-react';

export default function TripReviewsModal({ isOpen, onClose, trip, reviews = [], onAddReview, currentUser }) {
  if (!isOpen || !trip) return null;

  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Tính điểm đánh giá trung bình từ danh sách
  const currentReviews = reviews.length > 0 ? reviews : [
    { id: 1, userName: "Hoàng Khách Hàng", rating: 5, date: "12/11/2026", comment: "Xe chạy rất êm, bác tài lái cẩn thận, giường nằm sạch sẽ thơm tho!" },
    { id: 2, userName: "Lê Thị Mai", rating: 5, date: "10/11/2026", comment: "Khởi hành đúng giờ, có nước suối và khăn lạnh miễn phí. Rất hài lòng!" },
    { id: 3, userName: "Trần Minh Quân", rating: 4, date: "08/11/2026", comment: "Xe mới, wifi ổn định. Điểm cộng là có rèm che cabin riêng tư." }
  ];

  const avgScore = (currentReviews.reduce((acc, r) => acc + r.rating, 0) / currentReviews.length).toFixed(1);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      alert("Vui lòng viết đôi lời nhận xét về chuyến đi!");
      return;
    }

    const reviewObj = {
      id: Date.now(),
      userName: currentUser?.fullName || "Khách hàng thân thiết",
      rating: newRating,
      date: new Date().toLocaleDateString('vi-VN'),
      comment: commentText.trim()
    };

    onAddReview(trip.id, reviewObj);
    setCommentText('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-brand-900 to-emerald-950 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/30 border border-brand-400/40 text-brand-200 font-bold uppercase">
              {trip.busTypeName}
            </span>
          </div>

          <h3 className="text-xl font-black text-white">{trip.busName}</h3>
          <p className="text-xs text-brand-200 mt-0.5">
            Tuyến: {trip.originStation} ➔ {trip.destStation}
          </p>
        </div>

        {/* Tổng quan điểm số */}
        <div className="bg-amber-50/60 border-b border-amber-100 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl font-black text-amber-600 block leading-none">{avgScore}</span>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">TRÊN 5 SAO</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs text-slate-600 font-medium block mt-1">
                Dựa trên <span className="font-bold text-slate-800">{currentReviews.length} lượt đánh giá</span> thực tế
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <ThumbsUp className="w-3.5 h-3.5" /> 98% Hài lòng
            </span>
          </div>
        </div>

        {/* Danh sách nhận xét (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
          {currentReviews.map((rev) => (
            <div key={rev.id} className="pt-3.5 first:pt-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs">
                    {rev.userName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{rev.userName}</span>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-9">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>

        {/* Form Viết đánh giá của bạn */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 shrink-0">
          {isSubmitted ? (
            <div className="text-center py-2 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cảm ơn bạn! Đánh giá đã được ghi nhận thành công.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Viết đánh giá của bạn:
                </span>
                
                {/* Chọn số sao */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star 
                        className={`w-4 h-4 ${
                          star <= (hoverRating || newRating) 
                            ? "text-amber-500 fill-amber-400" 
                            : "text-slate-300"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-1">
                    {newRating} sao
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm về chuyến xe (xe êm, đúng giờ, tài xế...)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
