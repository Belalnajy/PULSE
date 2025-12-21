import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function SubscriptionPrompt({ open, onClose, strict = false }) {
  const {
    user,
    subscription,
    trialDaily,
    subscriptionRequired,
    entitlements,
    logout,
  } = useAuth();
  const [msg, setMsg] = useState('');
  if (!open) return null;
  const isAdmin = !!(
    entitlements?.is_admin ??
    (user?.is_admin || (user?.email || '').toLowerCase() === 'alva@admin.com')
  );
  const isActive = !!(
    entitlements?.has_active_subscription ??
    (subscription &&
      subscription.status === 'active' &&
      subscription.end_at &&
      new Date(subscription.end_at).getTime() > Date.now())
  );
  const hasExpiredSub = false;
  const inTrial = !!(
    entitlements?.can_use_trial_today ??
    (!isAdmin && !isActive && !!trialDaily)
  );
  const mustRenew = !!(
    entitlements?.requires_renewal_block ??
    (!isAdmin && !isActive && !!subscriptionRequired)
  );

  async function startPayment() {
    setMsg('');
    try {
      const returnUrl = window.location.href;
      const res = await api('/api/payments/checkout', {
        method: 'POST',
        body: { plan_id: 'monthly', return_url: returnUrl },
      });
      if (res?.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setMsg('لم يتم العثور على رابط الدفع');
      }
    } catch (e) {
      console.error(e);
      setMsg(e.message || 'حدث خطأ أثناء الاتصال ببوابة الدفع');
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={() => {
        if (!strict) onClose?.();
      }}>
      <div
        className="bg-brand-dark border border-brand-primary/20 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(56,189,248,0.15)] relative overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}>
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex justify-center mb-6 relative">
          <div className={`relative ${mustRenew ? 'grayscale-[50%]' : ''}`}>
            <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl animate-pulse"></div>
            <img
              src="/Pulse-logo.png"
              alt="Pulse"
              className="w-20 h-20 rounded-full shadow-xl relative z-10"
            />
          </div>
        </div>

        {isAdmin ? (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-2">
              الاشتراك
            </h3>
            <div className="text-center text-gray-300 mb-6 text-sm">
              أنت تستخدم حساب إداري – كل ميزات Pulse متاحة لك دائماً بلا حدود.
            </div>
            <div className="flex justify-center">
              <button className="btn btn-secondary w-full" onClick={onClose}>
                إغلاق
              </button>
            </div>
          </>
        ) : isActive ? (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-2">
              اشتراكك فعّال
            </h3>
            <div className="text-center text-green-400 mb-6 text-sm leading-relaxed p-3 bg-green-500/10 rounded-lg border border-green-500/10">
              أنت مشترك حتى:{' '}
              {new Date(
                entitlements?.subscription_end_at ||
                  subscription?.end_at ||
                  Date.now()
              ).toLocaleDateString('ar-SA')}
              <br />
              <span className="text-gray-400 mt-1 block text-xs">
                استمتع بكل مزايا Pulse بدون حدود يومية.
              </span>
            </div>
            <div className="flex justify-center">
              <button className="btn btn-secondary w-full" onClick={onClose}>
                إغلاق
              </button>
            </div>
          </>
        ) : inTrial ? (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-3">
              جرّب Pulse بكامل قوّتِه
            </h3>
            <div className="text-center text-gray-300 mb-6 text-sm leading-relaxed">
              عشان تستفيد من مزايا PULSE الكامله وانشاء غير محدود للمحتوي ,
              وتواصل غير محدود مع شات ALVA ننصحك بترقية الاشتراك .
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
              <h4 className="font-bold text-white mb-3 text-sm border-b border-white/5 pb-2">
                مزايا الترقيه
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-brand-secondary">
                    <svg
                      className="w-4 h-4"
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
                  </span>
                  إنشاء محتوى غير محدود يومياً
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-secondary">
                    <svg
                      className="w-4 h-4"
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
                  </span>
                  دخول غير محدود للشات الذكي
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-secondary">
                    <svg
                      className="w-4 h-4"
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
                  </span>
                  سرعة أكبر في معالجة المحتوى
                </li>{' '}
                <li className="flex items-center gap-2">
                  <span className="text-brand-secondary">
                    <svg
                      className="w-4 h-4"
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
                  </span>
                  دعم فني مخصص للمشتركين
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 text-center">
                متبقي اليوم:{' '}
                {entitlements?.daily_usage?.content_remaining_today ?? 0} محتوى
                · {entitlements?.daily_usage?.chat_remaining_today ?? 0} رسائل
              </div>
            </div>

            {msg && (
              <div className="mb-4 text-center text-sm text-yellow-400">
                {msg}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-full shadow-lg shadow-brand-primary/20"
                onClick={startPayment}>
                ترقية الاشتراك
              </button>
              {!strict && (
                <button
                  className="btn btn-ghost w-full text-xs text-gray-400 hover:text-white"
                  onClick={onClose}>
                  أكمل التجربة حالياً
                </button>
              )}
            </div>
          </>
        ) : mustRenew && !hasExpiredSub ? (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-3">
              انتهت تجربتك المجانية{' '}
              <span className="inline-block">
                <svg
                  className="w-5 h-5 text-red-500 inline"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </h3>
            <div className="text-center text-gray-300 mb-6 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
              {`شكرًا لتجربتك Pulse!
وصلت للحدود القصوى للتجربة، وللاستمرار والاستمتاع بكل المزايا، تحتاج إلى تفعيل الاشتراك الشهري.`}
            </div>
            <div className="text-center text-xs text-brand-primary mb-4 animate-pulse">
              🎉 الاشتراك يمنحك تجربة أكثر سلاسة وبدون حدود يومية
            </div>

            {msg && (
              <div className="mb-4 text-center text-sm text-yellow-400">
                {msg}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-full shadow-lg shadow-brand-primary/20"
                onClick={startPayment}>
                ترقية الاشتراك
              </button>
              {strict && (
                <button className="btn btn-secondary w-full" onClick={logout}>
                  تسجيل الخروج
                </button>
              )}
            </div>
          </>
        ) : mustRenew && hasExpiredSub ? (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-3">
              اشتراكك انتهى
            </h3>
            <div className="text-center text-gray-300 mb-6 text-sm leading-relaxed">
              مشتاقين لك! اشتراكك انتهى، وعلشان تستمر في استخدام أدوات Pulse
              وإنشاء المحتوى والشات، نحتاج نفعّل اشتراكك من جديد.
            </div>
            <div className="text-center text-xs text-gray-500 mb-4">
              ترقية بسيطة… ورجّع كل مميزاتك فوراً
            </div>

            {msg && (
              <div className="mb-4 text-center text-sm text-yellow-400">
                {msg}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-full shadow-lg shadow-brand-primary/20"
                onClick={startPayment}>
                تجديد الاشتراك
              </button>
              {strict && (
                <button className="btn btn-secondary w-full" onClick={logout}>
                  تسجيل الخروج
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-center text-white mb-3">
              الاشتراك
            </h3>
            <div className="text-center text-gray-400 mb-6 text-sm">
              سيتم ربط بوابة الدفع لاحقًا
            </div>
            <div className="text-center text-[10px] text-gray-600 mb-4 uppercase tracking-widest">
              An Alva Product
            </div>

            <div className="flex flex-col gap-3">
              <button className="btn btn-primary w-full" onClick={startPayment}>
                ترقية الاشتراك
              </button>
              {!strict && (
                <button className="btn btn-secondary w-full" onClick={onClose}>
                  إغلاق
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
