import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { email, code, newPassword },
      });
      alert('تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
      window.location.href = '/login';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      <div className="card-glass p-8 animate-fade-in-up">
        <div className="flex justify-center mb-6 relative">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping-subtle" />
            <img
              src="/Pulse-logo.png"
              alt="Pulse"
              className="w-16 h-16 rounded-full shadow-lg relative z-10 animate-pulse-soft border-2 border-brand-primary/60"
            />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-center mb-2 bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
          تغيير كلمة المرور
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          أدخل الرمز المرسل وكلمة المرور الجديدة
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 mr-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 mr-1">
              رمز التحقق (6 أرقام)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              placeholder="000000"
              className="input-base text-center tracking-[1em] font-bold"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 mr-1">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="********"
              className="input-base"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            className={`btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={loading}>
            {loading ? 'جاري التغيير...' : 'تأكيد تغيير كلمة المرور'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          لم يصلك الرمز؟{' '}
          <a
            href={`/forgot-password?email=${encodeURIComponent(email)}`}
            className="text-brand-primary hover:text-brand-secondary transition-colors underline decoration-brand-primary/30 underline-offset-4 font-bold">
            إعادة إرسال الرمز
          </a>
        </p>

        <p className="mt-4 text-center text-sm text-gray-400">
          تذكرت كلمة المرور؟{' '}
          <a
            href="/login"
            className="text-gray-300 hover:text-white transition-colors">
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}
