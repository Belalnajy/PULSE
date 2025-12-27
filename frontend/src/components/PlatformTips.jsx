import React from 'react';
import { FaTiktok, FaInstagram, FaSnapchat, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function getPlatformIcon(platform) {
  const p = String(platform || '').toLowerCase();
  switch (p) {
    case 'tiktok':
      return <FaTiktok className="w-5 h-5" />;
    case 'instagram':
      return <FaInstagram className="w-5 h-5 text-[#E4405F]" />;
    case 'x':
      return <FaXTwitter className="w-5 h-5" />;
    case 'snapchat':
      return <FaSnapchat className="w-5 h-5 text-[#FFFC00]" />;
    case 'whatsapp':
      return <FaWhatsapp className="w-5 h-5 text-[#25D366]" />;
    default:
      return null;
  }
}

export default function PlatformTips({ platform_tips }) {
  if (!platform_tips || Object.keys(platform_tips).length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <svg
          className="w-5 h-5 text-brand-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        نصائح حسب المنصة
      </h3>

      {/* Platform Tips Grid */}
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(platform_tips).map(([platform, tips]) => (
          <PlatformTipCard key={platform} platform={platform} tips={tips} />
        ))}
      </div>
    </div>
  );
}

function PlatformTipCard({ platform, tips }) {
  const platformColors = {
    TikTok: 'from-pink-500/20 to-cyan-500/20',
    Instagram: 'from-purple-500/20 to-pink-500/20',
    X: 'from-blue-500/20 to-cyan-500/20',
    Snapchat: 'from-yellow-500/20 to-yellow-400/20',
    WhatsApp: 'from-green-500/20 to-emerald-500/20',
  };

  return (
    <div
      className={`card-glass p-5 rounded-xl border border-white/10 bg-linear-to-br ${
        platformColors[platform] || 'from-white/5 to-white/10'
      }`}>
      {/* Platform Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="p-2 rounded-lg bg-white/10 flex items-center justify-center">
          {getPlatformIcon(platform)}
        </div>
        <h4 className="text-lg font-bold text-white">{platform}</h4>
      </div>

      {/* Tips List */}
      <div className="space-y-3">
        {tips.best_time && (
          <TipItem
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            label="أفضل وقت للنشر"
            value={tips.best_time}
          />
        )}

        {tips.format && (
          <TipItem
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            }
            label="تنسيق المحتوى"
            value={tips.format}
          />
        )}

        {tips.engagement && (
          <TipItem
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            }
            label="استراتيجية التفاعل"
            value={tips.engagement}
          />
        )}

        {tips.caption_length && (
          <TipItem
            icon={
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
            }
            label="طول الوصف (caption)"
            value={tips.caption_length}
          />
        )}

        {/* {tips.visual && (
          <TipItem
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            label="المحتوى المرئي"
            value={tips.visual}
          />
        )} */}
      </div>
    </div>
  );
}

function TipItem({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-gray-200 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}
