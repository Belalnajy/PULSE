import React, { useState } from 'react';
import HashtagsDisplay from './HashtagsDisplay';
import PlatformTips from './PlatformTips';

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function renderContent(content) {
  if (content == null)
    return <p className="text-gray-500 italic">لا يوجد محتوى</p>;
  if (typeof content === 'string')
    return (
      <div className="text-gray-200 leading-relaxed whitespace-pre-line text-sm md:text-base">
        {content}
      </div>
    );
  if (Array.isArray(content))
    return (
      <div className="text-gray-200 leading-relaxed whitespace-pre-line text-sm md:text-base">
        {content.join('\n')}
      </div>
    );
  if (isPlainObject(content)) {
    const preferred = ['Hook', 'Body', 'CTA'];
    const parts = preferred
      .filter((k) => content[k] != null)
      .map((k) => content[k]);
    const values = parts.length ? parts : Object.values(content);
    const text = values
      .map((v) =>
        typeof v === 'string'
          ? v
          : Array.isArray(v)
          ? v.join('\n')
          : JSON.stringify(v, null, 2)
      )
      .join('\n\n');
    return (
      <div className="text-gray-200 leading-relaxed whitespace-pre-line text-sm md:text-base">
        {text}
      </div>
    );
  }
  return (
    <div className="text-gray-200 leading-relaxed whitespace-pre-line text-sm md:text-base">
      {JSON.stringify(content, null, 2)}
    </div>
  );
}

function toText(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.join('\n');
  if (isPlainObject(content)) {
    return Object.entries(content)
      .map(
        ([k, v]) =>
          `${k}: ${
            typeof v === 'string'
              ? v
              : Array.isArray(v)
              ? v.join('\n')
              : JSON.stringify(v)
          }`
      )
      .join('\n');
  }
  return JSON.stringify(content);
}

function getExecutionGuide(platform) {
  const p = String(platform || '').toLowerCase();
  if (p === 'tiktok') {
    return 'استخدم هذا النص في فيديو رأسي قصير: اجعل الجملة الافتتاحية هي الـ Hook، ثم طبّق الـ Body بالصوت أو النص، وأنهِ الفيديو بجملة CTA واضحة. ضَع نصًا على الشاشة لزيادة التفاعل.';
  }
  if (p === 'instagram') {
    return 'حوّل النص إلى Reel أو منشور كروت. ضع الجملة الأولى كجذب، استخدم الـ Body في الوصف، وأضف الـ CTA في النهاية مع هاشتاقات بسيطة.';
  }
  if (p === 'snapchat') {
    return 'سناب يتطلب لقطات سريعة: ضع الـ Hook على أول لقطة، ثم اشرح الفكرة في لقطة ثانية، وأنهِ بـ CTA قصير.';
  }
  if (p === 'x') {
    return 'اجعل الـ Hook هو بداية التغريدة، اختصر الـ Body لسطر أو سطرين، واستخدم CTA في النهاية مع 1-2 هاشتاق.';
  }
  if (p === 'whatsapp') {
    return 'استخدم النص كرسالة برودكاست أو كحالة. اجعل الـ Hook في أول سطر، ثم Body مختصر، وأنهِ بـ CTA واضح.';
  }
  return 'استخدم الجملة الأولى لجذب الانتباه، ثم اشرح الفكرة بشكل مباشر، وأنهِ بجملة CTA واضحة تدعو المتابع لاتخاذ خطوة.';
}

export default function ResultsCard({ outputs }) {
  const [openGuide, setOpenGuide] = useState({});

  // Extract hashtags and platform_tips
  const hashtags = outputs?.hashtags;
  const platform_tips = outputs?.platform_tips;

  // Filter platform content entries (exclude suggestions, hashtags, platform_tips)
  const entries = !outputs
    ? []
    : Object.entries(outputs).filter(
        ([platform]) =>
          !['suggestions', 'hashtags', 'platform_tips'].includes(
            platform.toLowerCase()
          )
      );
  const empty = entries.length === 0;
  const dev = (import.meta.env.MODE || '').toLowerCase() === 'development';
  const traceId = outputs?.suggestions?.__meta?.traceId || '';

  function copyAll() {
    if (empty) return;
    const parts = entries.map(([platform, content]) => {
      return `منصة ${platform}:\n${toText(content)}`;
    });
    navigator.clipboard.writeText(parts.join('\n\n'));
  }

  return (
    <div className="h-full flex flex-col min-h-0 pl-1">
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-3 flex flex-col gap-4 pb-20">
        {dev && traceId ? (
          <div className="text-xs text-gray-600 my-2 px-1">
            {/* traceId: {traceId} */}
          </div>
        ) : null}

        {!empty && (
          <>
            {entries.map(([platform, content]) => (
              <div key={platform} className="card-glass p-5 relative group">
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    onClick={() =>
                      navigator.clipboard.writeText(toText(content))
                    }
                    title="نسخ">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  </button>
                </div>

                <h3 className="text-lg font-bold text-brand-primary mb-3">
                  {platform}
                </h3>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
                  {renderContent(content)}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="btn btn-secondary btn-sm text-xs"
                    onClick={() =>
                      navigator.clipboard.writeText(toText(content))
                    }>
                    نسخ المحتوى
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-xs text-gray-400 hover:text-brand-primary"
                    onClick={() =>
                      setOpenGuide((prev) => ({
                        ...prev,
                        [platform]: !prev[platform],
                      }))
                    }>
                    {openGuide[platform] ? 'إخفاء الدليل' : '  طريفة التنفيذ'}
                  </button>
                </div>

                {openGuide[platform] && (
                  <div className="mt-4 pt-3 border-t border-white/10 animate-fade-in-up">
                    <div className="text-xs font-semibold text-gray-300 mb-1">
                      طريقة التنفيذ على {platform}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {content.ExecutionPlan || getExecutionGuide(platform)}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Hashtags Section */}
            {hashtags && (
              <div className="card-glass p-5">
                <HashtagsDisplay hashtags={hashtags} />
              </div>
            )}

            {/* Platform Tips Section */}
            {platform_tips && (
              <div className="card-glass p-5">
                <PlatformTips platform_tips={platform_tips} />
              </div>
            )}

            <div className="mt-4 sticky bottom-0 bg-brand-dark/80 backdrop-blur-md p-4 border-t border-white/10 -mx-2 rounded-t-xl z-10 flex justify-center">
              <button
                className="btn btn-primary w-full shadow-lg"
                onClick={copyAll}>
                نسخ كامل المحتوى
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
