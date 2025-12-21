import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

export default function TrialStatusModal({ open, onClose }) {
  const { entitlements, trialDaily, user, logout } = useAuth();

  if (!open) return null;

  const contentLeft =
    entitlements?.daily_usage?.content_remaining_today ??
    trialDaily?.contentLeft ??
    0;
  const chatLeft =
    entitlements?.daily_usage?.chat_remaining_today ??
    trialDaily?.chatLeft ??
    0;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in"
      onClick={onClose}>
      <div
        className="bg-brand-dark border border-brand-primary/20 rounded-[2.5rem] p-8 w-full max-w-md shadow-depth relative overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}>
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl animate-pulse"></div>
              <img
                src="/alva-logo.png"
                alt="Alva"
                className="w-20 h-20 rounded-full shadow-glow relative z-10 border-2 border-white/10"
              />
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-center text-white mb-2">
            الرصيد المتبقي في التجربه المجانيه
          </h2>
          <p className="text-center text-gray-400 text-sm mb-8 leading-relaxed">
            في حالة انتهاء المحتوي او الرسائل ايهما اسبق ستنتهي الفتره المجانيه
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card-glass-premium p-4 flex flex-col items-center justify-center border-brand-primary/20">
              <span className="text-3xl font-display font-bold text-brand-primary mb-1">
                {contentLeft}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                محتوى متبقي
              </span>
            </div>
            <div className="card-glass-premium p-4 flex flex-col items-center justify-center border-brand-secondary/20">
              <span className="text-3xl font-display font-bold text-brand-secondary mb-1">
                {chatLeft}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                رسائل متبقية
              </span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
            <h3 className="text-xs font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">
              ليه تشترك في باقة Pulse؟
            </h3>
            <ul className="space-y-2.5">
              {[
                'إنشاء محتوى غير محدود يومياً',
                'دخول غير محدود للشات الذكي',
                'سرعة أكبر في معالجة المحتوى',
                'دعم فني مخصص للمشتركين',
              ].map((text, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-400">
                  <svg
                    className="w-4 h-4 text-brand-secondary shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              className="btn btn-primary w-full shadow-glow py-3.5 rounded-2xl font-bold"
              onClick={() => {
                onClose();
                // We don't have a direct link yet, but we can assume clicking upgrade might open SubscriptionPrompt
                // In context, the user just wants visibility.
              }}>
              ترقية الحساب الآن
            </button>
            <button
              className="btn btn-ghost w-full text-xs text-gray-500 hover:text-white"
              onClick={onClose}>
              إكمال التجربة المجانية
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
