import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

export default function VerifyOtp() {
  const params = new URLSearchParams(window.location.search);
  const initialEmail = params.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    setInfo('تم إرسال رمز التحقق لبريدك الإلكتروني');
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  function startTimer() {
    clearInterval(timerRef.current);
    setTimeLeft(600);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function startResendCooldown() {
    setResendCooldown(60);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  async function onVerify(e) {
    if (e) e.preventDefault();
    if (code.length !== 6) return;
    setError('');
    setInfo('');
    try {
      const res = await api('/api/auth/verify-otp', {
        method: 'POST',
        body: { email, code },
      });
      if (res.data?.token) {
        localStorage.setItem('auth_token', res.data.token);
        window.location.href = '/app';
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function onResend(e) {
    e.preventDefault();
    if (resendCooldown > 0) return;
    setError('');
    setInfo('');
    try {
      await api('/api/auth/request-otp', { method: 'POST', body: { email } });
      setInfo('تم إرسال رمز جديد');
      startTimer();
      startResendCooldown();
    } catch (err) {
      if (err.secondsLeft) {
        setResendCooldown(err.secondsLeft);
        startResendCooldown();
      }
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      <div className="card-glass p-8 animate-fade-in-up border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full" />
            <img
              src="/Pulse-logo.png"
              alt="Pulse"
              className="w-20 h-20 rounded-full shadow-2xl relative z-10 border-2 border-brand-primary/30"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
          تفعيل الحساب
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          الرجاء إدخال الرمز المكون من 6 أرقام المرسل إلى <br />
          <span className="text-brand-primary font-medium">{email}</span>
        </p>

        <form onSubmit={onVerify} className="flex flex-col gap-6">
          <div className="relative">
            <label className="block text-xs text-gray-400 mb-2 mr-1">
              رمز التحقق
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setCode(val);
                if (val.length === 6) {
                  // Auto verify if needed, but manual is safer
                }
              }}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
              className="input-base text-center tracking-[1em] text-2xl font-mono py-4 focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 px-1">
            <span>صلاحية الرمز: {formatTime(timeLeft)}</span>
            {timeLeft === 0 && (
              <span className="text-red-400">انتهت صلاحية الرمز</span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
          {info && (
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm rounded-lg flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {info}
            </div>
          )}

          <button
            className={`btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-brand-primary/25 ${
              code.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={code.length !== 6}>
            تحقق من الرمز
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-gray-500 mb-4">لم يصلك الرمز؟</p>
          <button
            className={`btn btn-secondary btn-sm px-6 py-2 ${
              resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={onResend}
            disabled={resendCooldown > 0}>
            {resendCooldown > 0
              ? `إعادة الإرسال خلال ${resendCooldown} ثانية`
              : 'إعادة إرسال الرمز'}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          <a
            href="/login"
            className="text-brand-primary hover:text-brand-secondary transition-colors underline decoration-brand-primary/30 underline-offset-4">
            العودة لتسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}
