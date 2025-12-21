import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatWidget from './ChatWidget';
import { api } from '../api/client';
import SubscriptionPrompt from './SubscriptionPrompt';

function daysRemaining(expires_at) {
  if (!expires_at) return null;
  const diffMs = new Date(expires_at).getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export default function RightSidebar({
  onNavigate,
  currentView,
  chatOpen,
  setChatOpen,
}) {
  const { user, subscription, loadMe } = useAuth();
  const [notice, setNotice] = useState('');
  const [adminAttention, setAdminAttention] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  // Derive selection from props if available, else local (compat)
  const activeKey = currentView || 'dashboard';

  const remaining = useMemo(
    () => daysRemaining(subscription?.end_at),
    [subscription]
  );
  const isActive =
    subscription && subscription.status === 'active' && (remaining ?? 0) > 0;
  const isAdmin = user?.is_admin || user?.email === 'Alva@admin.com';

  useEffect(() => {
    let mounted = true;
    async function loadAdminIndicators() {
      try {
        if (isAdmin) {
          const res = await api('/api/admin/users');
          const list = res?.data?.users || [];
          const lastVisit = parseInt(
            localStorage.getItem('lastAdminVisit') || '0',
            10
          );

          // Show dot if any user was created after our last visit OR has a new support request
          const hasNewActivity = list.some((u) => {
            const userDt = u.createdAt || u.created_at;
            const supportDt = u.lastSupportAt;

            const parseUTC = (str) => {
              if (!str) return 0;
              // If it's YYYY-MM-DD HH:MM:SS, append Z
              const normalized =
                str.includes(' ') && !str.includes('T') && !str.includes('Z')
                  ? str.replace(' ', 'T') + 'Z'
                  : str;
              return new Date(normalized).getTime();
            };

            const userTime = parseUTC(userDt);
            const supportTime = parseUTC(supportDt);

            return userTime > lastVisit || supportTime > lastVisit;
          });

          if (mounted) setAdminAttention(hasNewActivity);
        } else {
          if (mounted) setAdminAttention(false);
        }
      } catch (e) {
        if (mounted) setAdminAttention(false);
      }
    }

    loadAdminIndicators();
    const interval = setInterval(loadAdminIndicators, 60000); // Check every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  const navItems = [
    {
      key: 'landing',
      label: 'الرئيسية (Landing)',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
      action: () => (window.location.href = '/welcome'),
    },
    {
      key: 'dashboard',
      label: 'اللوحة',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      key: 'builder',
      label: 'المنشئ الذكي',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      key: 'chat',
      label: 'محادثة Alva',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      action: () => setChatOpen((prev) => !prev),
    },
    {
      key: 'website',
      label: 'Alva Store',

      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      description: 'لو تبغى شروحات تسهل عليك تجارتك، نورنا في متجر Alva',
      action: () => window.open('https://alvaknowladge.com', '_blank'),
    },
    {
      key: 'profile',
      label: 'حسابي',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    navItems.push({
      key: 'admin',
      label: 'لوحة المشرف',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      action: () => {
        setAdminAttention(false);
        onNavigate?.('admin');
      },
      notify: adminAttention,
    });
    navItems.push({
      key: 'closed-notes',
      label: 'الملاحظات',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    });
    navItems.push({
      key: 'pricing',
      label: 'إدارة الأسعار',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      action: () => (window.location.href = '/admin/pricing'),
    });
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Brand Header */}
      <div className="px-2">
        <div className="flex items-center gap-2.5 mb-2">
          <img
            src="/Pulse-logo.png"
            alt="Pulse"
            className="w-9 h-9 rounded-full shadow-sm ring-2 ring-brand-primary/60"
          />
          <span className="font-display font-bold text-lg bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
        <div className="text-xs text-gray-500 font-medium opacity-80">
          اساعدك تنشئ محتواك التسويقي بأفضل طريقة
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isSelected = activeKey === item.key && !item.action;
          const isChatActive = item.key === 'chat' && chatOpen;

          return (
            <button
              key={item.key}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-transparent w-full text-right transition-all duration-200 group
                ${
                  isSelected || isChatActive
                    ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:-translate-x-1'
                }
              `}
              onClick={() => {
                if (item.action) item.action();
                else onNavigate?.(item.key);
              }}>
              <span className="text-lg w-5 text-center flex items-center justify-center">
                {item.icon}
              </span>
              <div className="flex flex-col text-right leading-tight">
                <span className="text-sm font-medium">{item.label}</span>
                {item.description && (
                  <span className="text-[10px] text-gray-500 opacity-80 group-hover:text-gray-300 transition-colors mt-0.5">
                    {item.description}
                  </span>
                )}
              </div>
              {item.notify && (
                <span className="w-2 h-2 bg-red-500 rounded-full mr-auto shadow-md shadow-red-500/50"></span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1"></div>

      {/* Subscription Card (Mini) */}
      {!isAdmin && !isActive && (
        <div className="p-4 bg-black/20 border border-white/5 rounded-xl mb-5 backdrop-blur-sm">
          <p className="text-xs text-gray-400 mb-3">أنت في النسخة التجريبية</p>
          <button
            className="btn btn-primary btn-sm w-full"
            onClick={() => setSubOpen(true)}>
            ترقية حسابك
          </button>
        </div>
      )}

      {/* Chat Widget always mounted but hidden/shown internally or by state */}
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
      <SubscriptionPrompt open={subOpen} onClose={() => setSubOpen(false)} />
    </div>
  );
}
