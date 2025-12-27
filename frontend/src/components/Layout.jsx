import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SupportRequestModal from './SupportRequestModal';
import TrialStatusModal from './TrialStatusModal';

function daysRemaining(expires_at) {
  if (!expires_at) return null;
  const diffMs = new Date(expires_at).getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export default function Layout({ left, right }) {
  const {
    user,
    subscription,
    trialDaily,
    trialModalOpen,
    setTrialModalOpen,
    logout,
  } = useAuth();
  const remaining = useMemo(
    () => daysRemaining(subscription?.end_at),
    [subscription]
  );
  const isActive =
    subscription && subscription.status === 'active' && (remaining ?? 0) > 0;
  const isAdmin =
    !!user?.is_admin || (user?.email || '').toLowerCase() === 'alva@admin.com';
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isActive && trialDaily) {
      const shown = sessionStorage.getItem('trial_notified');
      if (!shown) {
        setTrialModalOpen(true);
        sessionStorage.setItem('trial_notified', 'true');
      }
    }
  }, [isAdmin, isActive, trialDaily, setTrialModalOpen]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent">
      {/* Topbar */}
      <div className="shrink-0 flex justify-between items-center h-16 px-4 md:px-6 bg-brand-dark-lighter/60 border-b border-white/5 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-400 hover:text-white p-1"
            onClick={() => setMobileMenuOpen(true)}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <img
            src="/alva-logo.png"
            alt="Alva"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-sm ring-2 ring-[#38bdf8]/60"
          />

          <div className="flex items-center gap-2 mr-2 md:mr-4 border-r border-white/10 pr-2 md:pr-4">
            {isActive ? (
              <span className="px-2.5 py-1 rounded-full border border-brand-primary/30 text-brand-primary text-xs font-semibold bg-brand-primary/5 hidden sm:inline-block">
                باقي {remaining} يوم
              </span>
            ) : null}
            {!isAdmin && !isActive && trialDaily ? (
              <button
                onClick={() => setTrialModalOpen(true)}
                className="hidden md:inline-flex px-3 py-1 rounded-full border border-brand-primary/20 text-white text-xs font-bold bg-linear-to-r from-brand-primary/20 to-brand-secondary/20 shadow-glow cursor-pointer hover:border-brand-primary/40 transition-all">
                تحت التجربة: {trialDaily.contentLeft} محتوى ·{' '}
                {trialDaily.chatLeft} رسائل
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-sm px-3 py-1.5 text-xs shadow-none hidden sm:inline-flex"
              onClick={() => setSupportOpen(true)}>
              مساعدة؟
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-300 hidden sm:block">
            {user?.display_name || user?.email}
          </span>
          <button
            className="btn btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 whitespace-nowrap"
            onClick={logout}>
            خروج
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="w-72 bg-brand-dark-lighter/40 border-l border-white/5 flex flex-col p-5 z-30 hidden md:flex backdrop-blur-sm">
          {left}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            <aside className="relative w-72 bg-brand-dark border-r border-white/10 flex flex-col p-5 h-full animate-slide-in-left overflow-y-auto">
              <button
                className="absolute top-4 left-4 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="mt-8">
                {React.cloneElement(left, {
                  onCloseMobile: () => setMobileMenuOpen(false),
                })}
              </div>
            </aside>
            <div
              className="flex-1 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Dynamic Right Content */}
        <section className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col scrollbar-thin">
          {right}
        </section>
      </div>

      <SupportRequestModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        prefillEmail={user?.email || ''}
        hideNewUser={true}
      />
      <TrialStatusModal
        open={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
      />
    </div>
  );
}
