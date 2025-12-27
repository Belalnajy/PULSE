import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(e) {
    if (e) e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setMessage(res.message || 'تم إرسال رمز التحقق لبريدك الإلكتروني');
      setCooldown(60);
    } catch (err) {
      if (err.code === 'COOLDOWN') {
        setCooldown(err.secondsLeft || 60);
      }
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
          نسيت كلمة المرور؟
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          أدخل بريدك الإلكتروني وسنرسل لك رمزاً لتغيير كلمة المرور
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
              placeholder="example@email.com"
              className="input-base"
              disabled={cooldown > 0 && !loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-200 text-sm rounded-lg text-center">
              <p className="font-bold mb-1">{message}</p>
              <p className="text-xs opacity-80">
                يرجى التحقق من ملف Spam إذا لم تجده
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              className={`btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20 ${
                loading || cooldown > 0 ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              type="submit"
              disabled={loading || cooldown > 0}>
              {loading ? (
                'جاري الإرسال...'
              ) : cooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  إعادة الإرسال خلال ({cooldown}ث)
                </span>
              ) : (
                'إرسال رمز التحقق'
              )}
            </button>

            {(message || error) && !loading && (
              <button
                type="button"
                onClick={() => {
                  const url = new URL(
                    window.location.origin + '/reset-password'
                  );
                  url.searchParams.set('email', email);
                  window.location.href = url.toString();
                }}
                className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                إدخال الرمز الآن
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          تذكرت كلمة المرور؟{' '}
          <a
            href="/login"
            className="text-brand-primary hover:text-brand-secondary transition-colors underline decoration-brand-primary/30 underline-offset-4">
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}
