import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Banknote, Save, Loader } from 'lucide-react';

export default function PricingManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const res = await api('/api/plans');
      setPlans(res.data || []);
    } catch (e) {
      setMessage({ type: 'error', text: 'فشل في تحميل الباقات' });
    } finally {
      setLoading(false);
    }
  }

  async function updatePlan(planId, updates) {
    try {
      setSaving(planId);
      await api(`/api/plans/${planId}`, {
        method: 'PUT',
        body: updates,
      });
      setMessage({ type: 'success', text: 'تم التحديث بنجاح' });
      await loadPlans();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'فشل في التحديث' });
    } finally {
      setSaving(null);
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

  function handleSave(plan) {
    updatePlan(plan.plan_id, {
      price_cents: plan.price_cents,
      name: plan.name,
      description: plan.description,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">إدارة الأسعار</h1>
          <p className="text-gray-400">تعديل أسعار الباقات والاشتراكات</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
            {message.text}
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
                  <p className="text-sm text-gray-400">{plan.plan_id}</p>
                </div>
                <div className="flex items-center gap-2 text-brand-primary">
                  <Banknote className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {(plan.price_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-400">{plan.currency}</span>
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
                          updatePlan(plan.plan_id, { price_cents: newPrice });
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
                        const newPrice = Math.max(0, plan.price_cents - 500);
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
                          handlePriceChange(plan.plan_id, e.target.value)
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
                onClick={() => handleSave(plan)}
                disabled={saving === plan.plan_id}
                className="btn btn-primary w-full md:w-auto px-6 py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving === plan.plan_id ? (
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
    </div>
  );
}
