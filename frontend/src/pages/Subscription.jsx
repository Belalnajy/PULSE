import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA');
}

export default function SubscriptionPage() {
  const { user, subscription, trialDaily, loadMe } = useAuth();
  const isAdmin =
    !!user?.is_admin || (user?.email || '').toLowerCase() === 'alva@admin.com';
  const active = !!(
    subscription &&
    subscription.status === 'active' &&
    subscription.end_at &&
    new Date(subscription.end_at).getTime() > Date.now()
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function mockActivate() {
    setError('');
    setLoading(true);
    try {
      await api('/api/subscription/mock/confirm', {
        method: 'POST',
        body: { months: 1 },
      });
      await loadMe();
    } catch (e) {
      setError(e.message || 'تعذر تنفيذ العملية');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPayment() {
    setError('');
    setLoading(true);
    try {
      const res = await api('/api/payments/verify-my-last-session');
      if (res.success) {
        alert(res.message);
        await loadMe();
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError(e.message || 'تعذر التحقق من الدفع');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-card" style={{ padding: 16 }}>
      <h2 className="section-title">الاشتراك</h2>
      {isAdmin ? (
        <div className="info">
          أنت متصل كحساب إداري – لا تنطبق عليك حدود الاشتراك أو التجربة.
        </div>
      ) : null}
      {active ? (
        <div className="success" style={{ marginTop: 8 }}>
          مشترك حتى: {fmtDate(subscription.end_at)}
        </div>
      ) : trialDaily ? (
        <div className="warning" style={{ marginTop: 8 }}>
          وضع التجربة المجانية (Trial Mode) — متبقي اليوم:{' '}
          {trialDaily.contentLeft} محتوى · {trialDaily.chatLeft} رسائل
        </div>
      ) : (
        <div className="error" style={{ marginTop: 8 }}>
          غير مشترك – الرجاء الاشتراك للاستمرار في الاستخدام
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <h3 className="section-title">مزايا الاشتراك</h3>
        <ul>
          <li>توليد محتوى PULSE بدون حدود يومية</li>
          <li>استخدام كامل لميزات المحادثة والمحتوى</li>
          <li>حماية استخدام عادلة داخليًا دون إظهار حدود للمستخدم</li>
        </ul>
      </div>

      {!isAdmin && (
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              onClick={mockActivate}
              disabled={loading}>
              {loading
                ? 'جارٍ التحضير...'
                : active
                ? 'ترقية الاشتراك'
                : 'بدء الاشتراك'}
            </button>

            {!active && (
              <button
                className="btn border border-brand-primary/40 hover:bg-brand-primary/10 text-brand-primary font-bold px-6"
                onClick={handleVerifyPayment}
                disabled={loading}>
                {loading
                  ? 'جارٍ التحقق...'
                  : 'تفعيل الاشتراك يدوياً (بعد الدفع)'}
              </button>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
}
