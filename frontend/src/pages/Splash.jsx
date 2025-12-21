import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token');
  useEffect(() => {
    if (token) {
      navigate('/app', { replace: true });
      return;
    }
    const t = setTimeout(() => {
      localStorage.setItem('seen_splash', '1');
      navigate('/welcome', { replace: true });
    }, 2200);
    return () => clearTimeout(t);
  }, [token, navigate]);

  if (token) return <Navigate to="/app" replace />;
  return (
    <div className="flex items-center justify-center h-screen bg-brand-dark overflow-hidden relative">
      <div className="absolute inset-0 bg-brand-dark">
        <div className="absolute top-[30%] left-[20%] w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] animate-pulse-slow"></div>
        <div className="absolute bottom-[30%] right-[20%] w-64 h-64 bg-brand-secondary/10 rounded-full blur-[80px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="flex flex-col items-center gap-4 relative z-10 animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-primary/20 rounded-3xl blur-xl animate-pulse"></div>
          <img
            src="/Pulse-logo.png"
            alt="Pulse"
            className="w-24 h-24 rounded-3xl shadow-2xl relative z-10"
          />
        </div>
        <div className="text-xl font-display font-medium text-gray-300 tracking-wide mt-4">
          AI Marketing Assistant
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-widest">
          by Alva
        </div>
      </div>
    </div>
  );
}
