import React, { useState } from 'react';
import { FaTiktok, FaInstagram, FaSnapchat, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function getPlatformIcon(platform) {
  const p = String(platform || '').toLowerCase();
  switch (p) {
    case 'tiktok':
      return <FaTiktok className="w-4 h-4" />;
    case 'instagram':
      return <FaInstagram className="w-4 h-4 text-[#E4405F]" />;
    case 'x':
      return <FaXTwitter className="w-4 h-4" />;
    case 'snapchat':
      return <FaSnapchat className="w-4 h-4 text-[#FFFC00]" />;
    case 'whatsapp':
      return <FaWhatsapp className="w-4 h-4 text-[#25D366]" />;
    default:
      return null;
  }
}

export default function HashtagsDisplay({ hashtags }) {
  const [copied, setCopied] = useState(false);

  if (!hashtags) return null;

  const {
    high_volume = [],
    medium_volume = [],
    niche = [],
    trending = [],
    branded = [],
    platform_optimized = {},
    _meta = {},
  } = hashtags;

  const allHashtags = [
    ...high_volume,
    ...medium_volume,
    ...niche,
    ...trending,
    ...branded,
  ].filter(Boolean);

  const copyAllHashtags = () => {
    const text = allHashtags.join(' ');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCategory = (tags) => {
    const text = tags.join(' ');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-brand-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          الهاشتاقات المقترحة
        </h3>
        <button
          onClick={copyAllHashtags}
          className="btn btn-sm btn-ghost border border-white/10 hover:border-brand-primary/50 flex items-center gap-2">
          {copied ? (
            <>
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-400">تم النسخ!</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>نسخ الكل</span>
            </>
          )}
        </button>
      </div>

      {/* Hashtag Categories */}
      <div className="space-y-3">
        {/* High Volume */}
        {high_volume.length > 0 && (
          <HashtagCategory
            icon="🔥"
            title="هاشتاقات عالية الانتشار"
            subtitle="High Volume (1M+ posts)"
            tags={high_volume}
            color="text-red-400"
            bgColor="bg-red-500/10"
            borderColor="border-red-500/20"
            onCopy={() => copyCategory(high_volume)}
          />
        )}

        {/* Medium Volume */}
        {medium_volume.length > 0 && (
          <HashtagCategory
            icon="🎯"
            title="هاشتاقات متوسطة"
            subtitle="Medium Volume (100K-1M posts)"
            tags={medium_volume}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
            onCopy={() => copyCategory(medium_volume)}
          />
        )}

        {/* Niche */}
        {niche.length > 0 && (
          <HashtagCategory
            icon="💎"
            title="هاشتاقات متخصصة"
            subtitle="Niche (10K-100K posts)"
            tags={niche}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
            borderColor="border-purple-500/20"
            onCopy={() => copyCategory(niche)}
          />
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <HashtagCategory
            icon="✨"
            title="هاشتاقات ترندية حالية"
            subtitle="Current Trends"
            tags={trending}
            color="text-yellow-400"
            bgColor="bg-yellow-500/10"
            borderColor="border-yellow-500/20"
            onCopy={() => copyCategory(trending)}
          />
        )}

        {/* Branded */}
        {branded.length > 0 && (
          <HashtagCategory
            icon="🏷️"
            title="هاشتاق البراند"
            subtitle="Branded Hashtag"
            tags={branded}
            color="text-green-400"
            bgColor="bg-green-500/10"
            borderColor="border-green-500/20"
            onCopy={() => copyCategory(branded)}
            note="استبدل باسم براندك الخاص"
          />
        )}
      </div>

      {/* Platform Optimized Sets */}
      {Object.keys(platform_optimized).length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            هاشتاقات محسّنة لكل منصة
          </h4>
          <div className="space-y-2">
            {Object.entries(platform_optimized).map(([platform, tags]) => (
              <PlatformHashtagSet
                key={platform}
                platform={platform}
                tags={tags}
                onCopy={() => copyCategory(tags)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HashtagCategory({
  icon,
  title,
  subtitle,
  tags,
  color,
  bgColor,
  borderColor,
  onCopy,
  note,
}) {
  return (
    <div
      className={`card-glass p-4 border ${borderColor} ${bgColor} rounded-xl`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h4 className={`text-sm font-semibold ${color}`}>{title}</h4>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors cursor-default">
            {tag}
          </span>
        ))}
      </div>
      {note && <p className="text-xs text-gray-500 mt-2 italic">💡 {note}</p>}
    </div>
  );
}

function PlatformHashtagSet({ platform, tags, onCopy }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center p-1 rounded-md bg-white/5">
            {getPlatformIcon(platform)}
          </div>
          <span className="text-sm font-medium text-white">{platform}</span>
          <span className="text-xs text-gray-500">
            ({tags.length} هاشتاقات)
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 5).map((tag, idx) => (
            <span key={idx} className="text-xs text-gray-400">
              {tag}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="text-xs text-gray-500">
              +{tags.length - 5} المزيد
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onCopy}
        className="text-xs text-gray-400 hover:text-brand-primary transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  );
}
