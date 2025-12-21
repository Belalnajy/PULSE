import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ClosedNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.email === 'Alva@admin.com';

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError('');
      setLoading(true);
      try {
        const res = await api('/api/admin/support-closed');
        if (!mounted) return;
        setNotes(res?.data?.requests || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'تعذر تحميل الملاحظات المغلقة');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (isAdmin) load();
    else setLoading(false);
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  async function reload() {
    setRefreshing(true);
    try {
      const res = await api('/api/admin/support-closed');
      setNotes(res?.data?.requests || []);
    } catch (e) {
      setError(e.message || 'تعذر تحميل الملاحظات المغلقة');
    } finally {
      setRefreshing(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="card-glass p-8 text-center max-w-md animate-scale-in">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold mb-2">وصول محدود</h3>
          <p className="text-gray-400">هذه الصفحة مخصصة لمديري النظام فقط.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-brand-dark-lighter to-brand-dark p-8 border border-white/5 shadow-depth">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              أرشيف الملاحظات
            </h1>
            <p className="text-gray-400 max-w-md">
              هنا تجد جميع طلبات الدعم والملاحظات التي تم إغلاقها مسبقاً للرجوع
              إليها في أي وقت.
            </p>
          </div>
          <button
            className={`btn btn-primary gap-2 h-12 px-6 rounded-2xl ${
              refreshing ? 'opacity-70' : ''
            }`}
            onClick={reload}
            disabled={loading || refreshing}>
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Summary (Optional Visual Glue) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-glass p-6 border-l-4 border-l-brand-primary">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            إجمالي الملاحظات
          </div>
          <div className="text-2xl font-display font-bold text-white">
            {notes.length}
          </div>
        </div>
        <div className="card-glass p-6 border-l-4 border-l-brand-secondary">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            مستخدمين جدد
          </div>
          <div className="text-2xl font-display font-bold text-white">
            {notes.filter((n) => n.is_new_user).length}
          </div>
        </div>
        <div className="card-glass p-6 border-l-4 border-l-purple-500">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            آخر تحديث
          </div>
          <div className="text-sm font-medium text-white/80">
            {new Date().toLocaleDateString('ar-EG', {
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">جاري تحضير الأرشيف...</p>
          </div>
        ) : error ? (
          <div className="card-glass p-10 text-center border-red-500/20">
            <p className="text-red-400 mb-4">{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={reload}>
              محاولة مرة أخرى
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="card-glass p-20 text-center border-dashed border-white/10 bg-transparent">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              لا توجد ملاحظات مغلقة
            </h3>
            <p className="text-gray-400">
              سيتم عرض المحادثات المنتهية هنا تلقائياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {notes.map((n, idx) => (
              <div
                key={n.id}
                className="card-glass-premium p-6 group hover:translate-y-[-4px] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex flex-col gap-4">
                  {/* Note Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-glow border border-white/10 overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                        {n.email?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="text-white font-bold truncate max-w-[180px]">
                          {n.email || 'مستخدم غير معروف'}
                        </div>
                        <div className="text-xs text-brand-primary flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></span>
                          {n.is_new_user ? 'مستخدم جديد' : 'مشترك مفعل'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 bg-white/5 py-1 px-3 rounded-full border border-white/5">
                      {new Date(n.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-brand-primary/20 to-transparent blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-linear-to-b from-brand-secondary to-transparent rounded-full opacity-50"></div>
                    <p className="text-gray-300 text-sm leading-relaxed pl-4 line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                      {n.message}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 opacity-60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {n.phone || '-'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                      <span className="p-1.5 bg-brand-secondary/10 rounded-lg text-brand-secondary">
                        تمت المراجعة
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
