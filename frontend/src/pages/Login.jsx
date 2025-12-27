import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import SupportRequestModal from '../components/SupportRequestModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) setEmail(remembered);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email, password, rememberMe },
      });
      if (rememberMe) localStorage.setItem('remembered_email', email);
      else localStorage.removeItem('remembered_email');
      localStorage.setItem('auth_token', res.data.token);
      window.location.href = '/app';
    } catch (err) {
      if (
        (err.message || '').includes('تفعيل') ||
        (err.message || '').includes('OTP')
      ) {
        const url = new URL(window.location.origin + '/verify-otp');
        url.searchParams.set('email', email);
        window.location.href = url.toString();
        return;
      }
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      <div
        className={`card-glass p-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
        <div className="flex justify-center mb-6 relative">
          <div className="relative group">
            {/* Ping Animations */}
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping-subtle" />
            <div className="absolute inset-0 rounded-full bg-brand-secondary/20 animate-ping-subtle delay-700" />
            <div className="absolute inset-0 rounded-full bg-brand-primary/10 animate-ping-subtle delay-1500" />

            {/* Logo Image */}
            <img
              src="/Pulse-logo.png"
              alt="Pulse"
              className="w-16 h-16 rounded-full shadow-lg relative z-10 animate-pulse-soft border-2 border-brand-primary/60"
            />

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-brand-secondary/20 to-brand-primary/20 rounded-full blur-md z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-center mb-2 bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
          الدخول إلى Pulse
        </h1>
        <div className="text-gray-400 text-center text-sm mb-8">
          خطوة واحدة نحو محتوى تسويقي أفضل
        </div>

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
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-base"
            />
            <div className="flex justify-end mt-1">
              <a
                href="/forgot-password"
                className="text-xs text-brand-primary hover:text-brand-secondary transition-colors underline decoration-brand-primary/20 underline-offset-2">
                نسيت كلمة المرور؟
              </a>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-white/5 text-brand-primary focus:ring-brand-primary/50"
            />
            <span>تذكرني (يحفظ البريد فقط)</span>
          </label>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20"
            type="submit">
            الدخول إلى Pulse
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          ليس لديك حساب؟{' '}
          <a
            href="/register"
            className="text-brand-primary hover:text-brand-secondary transition-colors underline decoration-brand-primary/30 underline-offset-4">
            إنشاء حساب
          </a>
        </p>

        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3 ">
          <a
            href="/welcome"
            className="flex items-center gap-2 btn btn-ghost btn-sm self-start text-xs group">
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            العودة للرئيسية
          </a>

          <button
            type="button"
            className="btn btn-ghost btn-sm self-start text-xs"
            onClick={() => setSupportOpen(true)}>
            مساعدة؟
          </button>

          <div className="text-center">
            <div className="text-[10px] text-gray-600 mt-1">
              خصوصيتك محفوظة دائمًا
            </div>
          </div>
        </div>
      </div>
      <SupportRequestModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}
