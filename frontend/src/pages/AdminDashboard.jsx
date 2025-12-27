import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Banknote, Save, Loader } from 'lucide-react';

import TestimonialsManager from '../components/TestimonialsManager';

function toArabicStatus(status) {
  if (status === 'active') return 'نشط';
  if (status === 'expired') return 'منتهي';
  return 'لا يوجد اشتراك';
}

function computeRemainingDays(expiresAt) {
  if (!expiresAt) return null;
  const diff = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
  return Number.isFinite(diff) ? diff : null;
}

export default function AdminDashboard({ onCancel, defaultTab = 'users' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab); // users, testimonials, pricing
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rowLoading, setRowLoading] = useState({});
  const [rowMsg, setRowMsg] = useState({});
  const [openUserSupport, setOpenUserSupport] = useState(null);
  const [supportByUser, setSupportByUser] = useState({});

  // Pricing states
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansSaving, setPlansSaving] = useState(null);
  const [plansMessage, setPlansMessage] = useState({ type: '', text: '' });

  const isAdmin = useMemo(() => user?.email === 'Alva@admin.com', [user]);

  const [initialLastVisit] = useState(() =>
    parseInt(localStorage.getItem('lastAdminVisit') || '0', 10)
  );

  useEffect(() => {
    return () => {
      // Mark as seen when leaving the admin dashboard
      localStorage.setItem('lastAdminVisit', Date.now().toString());
    };
  }, []);

  async function loadUsers() {
    setError('');
    setLoading(true);
    try {
      const res = await api('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.message || 'تعذر تحميل المشتركين');
    } finally {
      setLoading(false);
    }
  }

  // Pricing functions
  async function loadPlans() {
    try {
      setPlansLoading(true);
      const res = await api('/api/plans');
      setPlans(res.data || []);
    } catch (e) {
      setPlansMessage({ type: 'error', text: 'فشل في تحميل الباقات' });
    } finally {
      setPlansLoading(false);
    }
  }

  async function updatePlan(planId, updates) {
    try {
      setPlansSaving(planId);
      await api(`/api/plans/${planId}`, {
        method: 'PUT',
        body: updates,
      });
      setPlansMessage({ type: 'success', text: 'تم التحديث بنجاح' });
      await loadPlans();
      setTimeout(() => setPlansMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setPlansMessage({ type: 'error', text: e.message || 'فشل في التحديث' });
    } finally {
      setPlansSaving(null);
    }
  }

  function handlePriceChange(planId, newPrice) {
    const priceCents = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(priceCents) || priceCents < 0) return;

    setPlans(
      plans.map((p) =>
        p.plan_id === planId ? { ...p, price_cents: priceCents } : p
      )
    );
  }

  function handleSavePlan(plan) {
    updatePlan(plan.plan_id, {
      price_cents: plan.price_cents,
      name: plan.name,
      description: plan.description,
    });
  }

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadUsers();
  }, [user, isAdmin]);

  // Load plans when pricing tab is active
  useEffect(() => {
    if (activeTab === 'pricing' && plans.length === 0) {
      loadPlans();
    }
  }, [activeTab]);

  function setRowBusy(userId, busy) {
    setRowLoading((prev) => ({ ...prev, [userId]: !!busy }));
  }

  async function activate(userId) {
    setRowBusy(userId, true);
    try {
      const res = await api('/api/admin/subscriptions/activate', {
        method: 'POST',
        body: { userId },
      });
      const sub = res?.data?.subscription || null;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const endAt = sub?.end_at || null;
          const remainingDays = computeRemainingDays(endAt);
          return { ...u, subscriptionStatus: 'active', endAt, remainingDays };
        })
      );
    } catch (e) {
      setRowMsg((prev) => ({
        ...prev,
        [userId]: 'تعذر تنفيذ العملية، حاول مرة أخرى.',
      }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  async function deactivate(userId) {
    setRowBusy(userId, true);
    try {
      const res = await api('/api/admin/subscriptions/deactivate', {
        method: 'POST',
        body: { userId },
      });
      const sub = res?.data?.subscription || null;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const endAt = sub?.end_at || null;
          const remainingDays = computeRemainingDays(endAt);
          return { ...u, subscriptionStatus: 'expired', endAt, remainingDays };
        })
      );
    } catch (e) {
      setRowMsg((prev) => ({
        ...prev,
        [userId]: 'تعذر تنفيذ العملية، حاول مرة أخرى.',
      }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  async function resetPassword(userId) {
    setRowBusy(userId, true);
    try {
      const res = await api('/api/admin/users/reset-password', {
        method: 'POST',
        body: { userId },
      });
      const pwd = res?.newPassword || res?.data?.newPassword;
      if (pwd) {
        const msg = `تم إنشاء كلمة مرور جديدة لهذا المستخدم: ${pwd} (قم بمشاركتها معه يدويًا).`;
        setRowMsg((prev) => ({ ...prev, [userId]: msg }));
        setTimeout(() => {
          setRowMsg((prev) => ({ ...prev, [userId]: '' }));
        }, 60000);
      } else {
        setRowMsg((prev) => ({
          ...prev,
          [userId]: 'تعذر تنفيذ العملية، حاول مرة أخرى.',
        }));
      }
    } catch (e) {
      setRowMsg((prev) => ({
        ...prev,
        [userId]: 'تعذر تنفيذ العملية، حاول مرة أخرى.',
      }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  async function deleteUser(userId) {
    setRowBusy(userId, true);
    try {
      const res = await api('/api/admin/users/delete', {
        method: 'POST',
        body: { userId },
      });
      const ok = !!(res?.data?.deleted || res?.deleted);
      if (ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setRowMsg((prev) => ({
          ...prev,
          [userId]: 'تعذر حذف المستخدم، حاول مرة أخرى.',
        }));
      }
    } catch (e) {
      const msg = e?.message?.includes('Cannot delete admin')
        ? 'لا يمكن حذف حساب المشرف.'
        : 'تعذر حذف المستخدم، حاول مرة أخرى.';
      setRowMsg((prev) => ({ ...prev, [userId]: msg }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  async function sendNotification(userId) {
    setRowBusy(userId, true);
    try {
      const res = await api('/api/admin/users/send-notification', {
        method: 'POST',
        body: { userId, type: 'expiry_reminder' },
      });
      if (res?.data?.sent) {
        setRowMsg((prev) => ({
          ...prev,
          [userId]: `✅ تم إرسال التنبيه بنجاح إلى ${res.data.email}`,
        }));
        setTimeout(() => {
          setRowMsg((prev) => ({ ...prev, [userId]: '' }));
        }, 5000);
      } else {
        setRowMsg((prev) => ({
          ...prev,
          [userId]: 'تعذر إرسال التنبيه، حاول مرة أخرى.',
        }));
      }
    } catch (e) {
      const msg = e?.message?.includes('NO_SUBSCRIPTION')
        ? 'المستخدم ليس لديه اشتراك نشط.'
        : 'تعذر إرسال التنبيه، حاول مرة أخرى.';
      setRowMsg((prev) => ({ ...prev, [userId]: msg }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  async function toggleSupport(userId) {
    const isOpen = openUserSupport === userId;
    if (isOpen) {
      setOpenUserSupport(null);
      return;
    }
    if (!supportByUser[userId]) {
      try {
        const res = await api(`/api/admin/support/${userId}`);
        const list = res?.data?.requests || [];
        setSupportByUser((prev) => ({ ...prev, [userId]: list }));
      } catch (e) {}
    }
    setOpenUserSupport(userId);
  }

  async function handleCloseSupportRequest(requestId, userId) {
    setRowBusy(userId, true);
    try {
      await api(`/api/admin/support/${requestId}/close`, { method: 'PATCH' });
      setSupportByUser((prev) => {
        const list = (prev[userId] || []).filter((r) => r.id !== requestId);
        return { ...prev, [userId]: list };
      });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const remaining = (supportByUser[userId] || []).filter(
            (r) => r.id !== requestId
          ).length;
          return { ...u, hasOpenSupport: remaining > 0 };
        })
      );
    } catch (e) {
      setRowMsg((prev) => ({
        ...prev,
        [userId]: 'تعذر إغلاق الملاحظة، حاول مرة أخرى.',
      }));
    } finally {
      setRowBusy(userId, false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full bg-brand-dark-lighter/40 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden p-8 items-center justify-center">
        <div className="text-red-400 font-bold text-lg">
          هذه الصفحة للمشرف فقط
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-brand-dark-lighter/40 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`text-lg font-bold transition-colors ${
              activeTab === 'users'
                ? 'text-white border-b-2 border-brand-primary'
                : 'text-gray-400 hover:text-white'
            }`}>
            المشتركين
          </button>
          <button
            onClick={() => setActiveTab('testimonials')}
            className={`text-lg font-bold transition-colors ${
              activeTab === 'testimonials'
                ? 'text-white border-b-2 border-brand-primary'
                : 'text-gray-400 hover:text-white'
            }`}>
            التقييمات
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`text-lg font-bold transition-colors ${
              activeTab === 'pricing'
                ? 'text-white border-b-2 border-brand-primary'
                : 'text-gray-400 hover:text-white'
            }`}>
            إدارة الأسعار
          </button>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={loadUsers}
              disabled={loading}>
              تحديث
            </button>
          )}
          {activeTab === 'pricing' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={loadPlans}
              disabled={plansLoading}>
              تحديث
            </button>
          )}
          {onCancel ? (
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              رجوع
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {activeTab === 'testimonials' ? (
          <div className="p-4 h-full">
            <TestimonialsManager />
          </div>
        ) : activeTab === 'pricing' ? (
          <div className="p-4 h-full">
            {plansLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-8 h-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    إدارة الأسعار
                  </h2>
                  <p className="text-gray-400">
                    تعديل أسعار الباقات والاشتراكات
                  </p>
                </div>

                {plansMessage.text && (
                  <div
                    className={`mb-6 p-4 rounded-xl ${
                      plansMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {plansMessage.text}
                  </div>
                )}

                <div className="space-y-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.plan_id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-brand-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {plan.plan_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-brand-primary">
                          <Banknote className="w-5 h-5" />
                          <span className="text-2xl font-bold">
                            {(plan.price_cents / 100).toFixed(0)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {plan.currency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-3">
                            السعر ({plan.currency})
                          </label>

                          {/* Quick Price Buttons */}
                          <div className="flex gap-2 mb-3">
                            {[25, 50, 75, 100, 200].map((price) => (
                              <button
                                key={price}
                                onClick={() => {
                                  const newPrice = price * 100;
                                  setPlans(
                                    plans.map((p) =>
                                      p.plan_id === plan.plan_id
                                        ? { ...p, price_cents: newPrice }
                                        : p
                                    )
                                  );
                                  updatePlan(plan.plan_id, {
                                    price_cents: newPrice,
                                  });
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  plan.price_cents === price * 100
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}>
                                {price} {plan.currency}
                              </button>
                            ))}
                          </div>

                          {/* Price Input with +/- Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newPrice = Math.max(
                                  0,
                                  plan.price_cents - 500
                                );
                                setPlans(
                                  plans.map((p) =>
                                    p.plan_id === plan.plan_id
                                      ? { ...p, price_cents: newPrice }
                                      : p
                                  )
                                );
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-all">
                              −
                            </button>

                            <div className="flex-1 relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                {plan.currency}
                              </span>
                              <input
                                type="number"
                                step="5"
                                min="0"
                                value={(plan.price_cents / 100).toFixed(0)}
                                onChange={(e) =>
                                  handlePriceChange(
                                    plan.plan_id,
                                    e.target.value
                                  )
                                }
                                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold text-center focus:border-brand-primary focus:outline-none"
                              />
                            </div>

                            <button
                              onClick={() => {
                                const newPrice = plan.price_cents + 500;
                                setPlans(
                                  plans.map((p) =>
                                    p.plan_id === plan.plan_id
                                      ? { ...p, price_cents: newPrice }
                                      : p
                                  )
                                );
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-all">
                              +
                            </button>
                          </div>

                          <p className="text-xs text-gray-500 mt-2">
                            استخدم الأزرار للتغيير السريع أو اكتب السعر مباشرة
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          الوصف
                        </label>
                        <textarea
                          value={plan.description || ''}
                          onChange={(e) =>
                            setPlans(
                              plans.map((p) =>
                                p.plan_id === plan.plan_id
                                  ? { ...p, description: e.target.value }
                                  : p
                              )
                            )
                          }
                          rows={2}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-primary focus:outline-none resize-none"
                          placeholder="وصف الباقة..."
                        />
                      </div>

                      <button
                        onClick={() => handleSavePlan(plan)}
                        disabled={plansSaving === plan.plan_id}
                        className="btn btn-primary w-full md:w-auto px-6 py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {plansSaving === plan.plan_id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            حفظ التغييرات
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                جاري تحميل المشتركين...
              </div>
            ) : null}
            {error ? (
              <div className="p-4 bg-red-500/10 text-red-200 m-4 rounded">
                {error}
              </div>
            ) : null}

            {!loading && !error && (
              <div className="w-full min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_2fr] gap-4 p-3 border-b border-white/10 bg-white/5 font-semibold text-sm text-gray-200">
                  <div>الاسم</div>
                  <div>الإيميل</div>
                  <div>الجوال</div>
                  <div>حالة الاشتراك</div>
                  <div>متبقي (أيام)</div>
                  <div>إجراءات</div>
                </div>

                {/* Table Body */}
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_2fr] gap-4 p-3 border-b border-white/5 items-center hover:bg-white/5 transition-colors text-sm group">
                    <div className="text-gray-300 truncate font-medium flex items-center gap-2">
                      {u.name || '-'}
                      {/* New user or support indicator */}
                      {(() => {
                        const userDt = u.createdAt || u.created_at;
                        const supportDt = u.lastSupportAt;

                        const parseUTC = (str) => {
                          if (!str) return 0;
                          const normalized =
                            str.includes(' ') &&
                            !str.includes('T') &&
                            !str.includes('Z')
                              ? str.replace(' ', 'T') + 'Z'
                              : str;
                          return new Date(normalized).getTime();
                        };

                        const userTime = parseUTC(userDt);
                        const supportTime = parseUTC(supportDt);

                        return userTime > initialLastVisit ||
                          supportTime > initialLastVisit ? (
                          <span className="w-2 h-2 rounded-full bg-brand-secondary shadow-[0_0_8px_rgba(0,184,148,0.5)]"></span>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-gray-400 truncate text-xs font-mono">
                      {u.email}
                    </div>
                    <div className="text-gray-400 truncate">
                      {u.phone || '-'}
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          u.subscriptionStatus === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/5 text-gray-500'
                        }`}>
                        {toArabicStatus(u.subscriptionStatus)}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      {u.remainingDays ?? '-'}
                    </div>

                    <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded text-gray-300 border border-white/5"
                        onClick={() => activate(u.id)}
                        disabled={!!rowLoading[u.id]}>
                        تفعيل
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[10px] rounded text-red-300 border border-red-500/10"
                        onClick={() => deactivate(u.id)}
                        disabled={!!rowLoading[u.id]}>
                        إلغاء
                      </button>
                      <button
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] rounded text-gray-300 border border-white/5"
                        onClick={() => resetPassword(u.id)}
                        disabled={!!rowLoading[u.id]}>
                        Reset
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[10px] rounded text-red-300 border border-red-500/10"
                        onClick={() => deleteUser(u.id)}
                        disabled={!!rowLoading[u.id]}>
                        حذف
                      </button>
                      <button
                        className="px-2 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-[10px] rounded text-brand-primary border border-brand-primary/20"
                        onClick={() => sendNotification(u.id)}
                        disabled={
                          !!rowLoading[u.id] ||
                          u.subscriptionStatus !== 'active'
                        }
                        title="إرسال تنبيه انتهاء الاشتراك">
                        📧 تنبيه
                      </button>
                      <button
                        type="button"
                        className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                          u.hasOpenSupport
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                        onClick={() => toggleSupport(u.id)}
                        disabled={!!rowLoading[u.id]}
                        title="عرض الاستفسارات">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Messages / Support Sub-row */}
                    {(rowMsg[u.id] || openUserSupport === u.id) && (
                      <div className="col-span-full mt-2 bg-black/20 rounded-lg p-3 border border-white/5">
                        {rowMsg[u.id] && (
                          <div className="text-xs text-yellow-300 mb-2">
                            {rowMsg[u.id]}
                          </div>
                        )}

                        {openUserSupport === u.id && (
                          <div>
                            {(supportByUser[u.id] || []).length === 0 ? (
                              <div className="text-xs text-gray-500 italic text-center p-2">
                                لا توجد استفسارات حالية لهذا المشترك.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {(supportByUser[u.id] || []).map((req) => (
                                  <div
                                    key={req.id}
                                    className="bg-white/5 rounded p-3 border border-white/5">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                                      <span className="flex items-center gap-2">
                                        {req.email && (
                                          <span className="flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor">
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                              />
                                            </svg>{' '}
                                            {req.email}
                                          </span>
                                        )}
                                        {req.phone && (
                                          <span className="flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor">
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                              />
                                            </svg>{' '}
                                            {req.phone}
                                          </span>
                                        )}
                                        {req.is_new_user ? (
                                          <span className="mr-2 px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded">
                                            جديد
                                          </span>
                                        ) : null}
                                      </span>
                                      <span>
                                        {new Date(
                                          req.created_at
                                        ).toLocaleString('ar-SA')}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-200 leading-relaxed mb-3">
                                      {req.message}
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        className="btn btn-secondary btn-xs text-[10px]"
                                        onClick={() =>
                                          handleCloseSupportRequest(
                                            req.id,
                                            u.id
                                          )
                                        }
                                        disabled={!!rowLoading[u.id]}>
                                        إغلاق الملاحظة
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
