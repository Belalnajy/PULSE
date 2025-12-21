import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AddTestimonialModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api('/api/testimonials/user', {
        method: 'POST',
        body: { rating, content },
      });

      // Success
      onSuccess?.(res.message || 'شكراً لك! تقييمك قيد المراجعة.');
      onClose();
      setContent('');
      setRating(5);
    } catch (err) {
      setError(err.error || 'فشل إرسال التقييم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-100 p-6"
      onClick={onClose}>
      <div
        className="card-glass-premium p-8 w-full max-w-lg border border-white/10 rounded-3xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <div className="absolute top-0 left-0 p-6">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium tracking-wide mb-4">
            شارك تجربتك
          </div>
          <h3 className="text-3xl font-display font-black text-white mb-2">
            أضف تقييمك
          </h3>
          <p className="text-gray-400 text-sm">
            رأيك يهمنا ويساعد الآخرين في اتخاذ القرار
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-white font-bold mb-3 text-center">
              التقييم
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-125 duration-200">
                  <svg
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-600'
                    } transition-colors`}
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-white font-bold mb-3">
              تجربتك مع Alva
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="شارك تجربتك مع Alva وكيف ساعدك في إنشاء المحتوى..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors resize-none"
            />
          </div>

          {/* User Info Display */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold border border-brand-primary/50">
              {user?.name?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-sm">
                {user?.name || user?.email}
              </div>
              <div className="text-xs text-gray-400">سيظهر اسمك مع التقييم</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn btn-primary w-full py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الإرسال...
              </span>
            ) : (
              'إرسال التقييم'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            سيتم مراجعة تقييمك قبل نشره للعامة
          </p>
        </form>
      </div>
    </div>
  );
}
