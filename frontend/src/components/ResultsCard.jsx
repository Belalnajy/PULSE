import React from 'react';
import { Sparkles, Zap, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { FaTiktok, FaInstagram, FaSnapchat, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

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

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Pulsing Logo */}
      <div className="relative mb-8 group cursor-default">
        <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping-subtle"></div>
        <div className="absolute inset-0 bg-brand-secondary/20 rounded-full animate-ping-subtle delay-700"></div>
        <img
          src="/Pulse-logo.png"
          alt="Pulse"
          className="w-24 h-24 rounded-full shadow-glow relative z-10 group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <h3 className="text-2xl font-display font-bold text-white mb-2 relative z-10">
        جاهز للإبداع؟
      </h3>
      <p className="text-gray-400 max-w-sm mb-8 relative z-10 leading-relaxed">
        املأ البيانات على اليمين ودع Pulse يحول أفكارك إلى محتوى احترافي في
        ثوانٍ.
      </p>

      {/* Quick Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg relative z-10">
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 mx-auto">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-gray-200 mb-1">
            1. حدد هدفك
          </div>
          <div className="text-xs text-gray-500">بيع بناء ثقه او تعريف ؟</div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3 mx-auto">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-gray-200 mb-1">
            2. أضف تفاصيلك
          </div>
          <div className="text-xs text-gray-500">اسم المنتج وأهم مميزاته</div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-brand-secondary/20 flex items-center justify-center text-brand-secondary mb-3 mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-gray-200 mb-1">3. انشاء!</div>
          <div className="text-xs text-gray-500">خلي PULSE يبهرك</div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 bg-black/20 px-4 py-2 rounded-full border border-white/5">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <span>نصيحة: كلما كانت التفاصيل أدق، كانت النتائج أفضل!</span>
      </div>
    </div>
  );
}

const ResultsCard = React.forwardRef(
  ({ outputs, onRegenerate, onRefine, regeneratingPlatform }, ref) => {
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

    const [comments, setComments] = React.useState({});

    function handleCommentChange(platform, val) {
      setComments((prev) => ({ ...prev, [platform]: val }));
    }

    function copyAll() {
      if (empty) return;
      const parts = entries.map(([platform, content]) => {
        return `منصة ${platform}:\n${toText(content)}`;
      });
      navigator.clipboard.writeText(parts.join('\n\n'));
    }

    return (
      <div className="h-full flex flex-col min-h-0 pl-1" ref={ref}>
        <div className="flex-1 scrollbar-thin pr-3 flex flex-col gap-4 pb-20">
          {dev && traceId ? (
            <div className="text-xs text-gray-600 my-2 px-1">
              {/* traceId: {traceId} */}
            </div>
          ) : null}

          {empty ? (
            <EmptyState />
          ) : (
            <>
              {entries.map(([platform, content]) => (
                <div key={platform} className="card-glass p-5 relative group">
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
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

                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                      {getPlatformIcon(platform)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{platform}</h3>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4 relative min-h-[160px]">
                    {regeneratingPlatform === platform && (
                      <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-lg animate-fade-in px-4">
                        <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                          {/* Mini Orbits */}
                          <div className="absolute inset-0 rounded-full border border-brand-primary/10"></div>
                          <div
                            className="absolute inset-0 rounded-full border border-transparent border-t-brand-primary border-l-brand-secondary"
                            style={{
                              animation:
                                'spin 1.5s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite',
                            }}></div>
                          <div
                            className="absolute -inset-2 rounded-full border border-transparent border-b-brand-primary opacity-20"
                            style={{
                              animation: 'spin 3s linear infinite reverse',
                            }}></div>

                          <img
                            src="/Pulse-logo.png"
                            alt="Pulse"
                            className="w-10 h-10 rounded-full z-10 shadow-glow animate-pulse-soft"
                          />
                        </div>
                        <div className="text-center w-full max-w-[120px]">
                          <div className="text-sm font-display font-bold text-gradient animate-pulse mb-1">
                            جارٍ التحديث...
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-linear-to-r from-brand-secondary to-brand-primary"
                              style={{
                                animation:
                                  'progressFill 2.5s ease-in-out infinite',
                              }}></div>
                          </div>

                          <div className="text-[10px] text-gray-500">
                            نطوّر المحتوى بناءً على رأيك
                          </div>
                        </div>
                      </div>
                    )}
                    {renderContent(content)}
                  </div>

                  {/* Refinement Area */}
                  <div className="mt-2 mb-4 bg-white/5 rounded-xl border border-white/5 p-3 group-hover:border-brand-primary/20 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-brand-secondary" />
                      هل تريد تعديل شيئاً؟ ضِف كومنتك هنا
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="مثلاً: خليه أكثر حماساً، أو ركز على السعر..."
                        className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-hidden focus:border-brand-primary/50 transition-all"
                        value={comments[platform] || ''}
                        onChange={(e) =>
                          handleCommentChange(platform, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && comments[platform]?.trim()) {
                            onRefine?.(platform, comments[platform]);
                            setComments((prev) => ({
                              ...prev,
                              [platform]: '',
                            }));
                          }
                        }}
                      />
                      <button
                        className="btn btn-primary btn-sm px-4 min-w-[80px] text-[10px]"
                        onClick={() => {
                          if (comments[platform]?.trim()) {
                            onRefine?.(platform, comments[platform]);
                            setComments((prev) => ({
                              ...prev,
                              [platform]: '',
                            }));
                          }
                        }}
                        disabled={
                          !comments[platform]?.trim() || !!regeneratingPlatform
                        }>
                        تعديل
                      </button>
                    </div>
                    {/* UI Hint */}
                    <div className="mt-2 text-[9px] text-gray-500 flex items-center gap-1.5 px-1">
                      <Lightbulb className="w-3 h-3 text-yellow-500/50" />
                      <span>
                        تلميح: جرب "خليه أقصر"، "ركز على المميزات"، أو "غيّر
                        الأسلوب لمرح"
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      className="btn btn-secondary btn-sm text-xs"
                      onClick={() =>
                        navigator.clipboard.writeText(toText(content))
                      }>
                      نسخ المحتوى
                    </button>
                    {onRegenerate && (
                      <button
                        className="btn btn-ghost btn-sm text-xs text-brand-primary hover:bg-brand-primary/10 gap-2"
                        onClick={() => onRegenerate(platform)}
                        disabled={!!regeneratingPlatform}>
                        {regeneratingPlatform === platform ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        توليد نسخة بديلة
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 animate-fade-in-up">
                    <div className="text-xs font-semibold text-gray-300 mb-1">
                      طريقة التنفيذ على {platform}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {content.ExecutionPlan || getExecutionGuide(platform)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-4 bottom-0 bg-brand-dark/80 backdrop-blur-md p-4 border-t border-white/10 -mx-5 rounded-t-xl z-10 flex justify-center">
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
);

export default ResultsCard;
