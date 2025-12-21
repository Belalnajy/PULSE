import React, { useState } from 'react';
import { api } from '../api/client';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: { displayName, email, phone, password },
      });
      if (res.data.verificationRequired) {
        const url = new URL(window.location.origin + '/verify-otp');
        url.searchParams.set('email', email);
        window.location.href = url.toString();
      } else if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
        window.location.href = '/app';
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      <div className="card-glass p-8 animate-fade-in-up">
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
              className="w-16 h-16 rounded-full shadow-lg relative z-10 animate-pulse-soft border-2 border-[#38bdf8]/60"
            />

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-brand-secondary/20 to-brand-primary/20 rounded-full blur-md z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-center mb-6 bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
          إنشاء حساب
        </h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 mr-1">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ادخل اسمك أو اسم العرض"
              required
              className="input-base"
            />
          </div>

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
              رقم الجوال
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20 mt-2"
            type="submit">
            تسجيل
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          لديك حساب؟{' '}
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
