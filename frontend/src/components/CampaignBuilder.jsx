import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { api, API } from '../api/client';
import SubscriptionPrompt from './SubscriptionPrompt';
import { useAuth } from '../context/AuthContext';
import { FaTiktok, FaInstagram, FaSnapchat, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

function getPlatformIcon(platform) {
  const p = String(platform || '').toLowerCase();
  switch (p) {
    case 'tiktok':
      return <FaTiktok className="w-3 h-3" />;
    case 'instagram':
      return <FaInstagram className="w-3 h-3 text-[#E4405F]" />;
    case 'x':
      return <FaXTwitter className="w-3 h-3" />;
    case 'snapchat':
      return <FaSnapchat className="w-3 h-3 text-[#FFFC00]" />;
    case 'whatsapp':
      return <FaWhatsapp className="w-3 h-3 text-[#25D366]" />;
    default:
      return null;
  }
}

const platformsList = ['TikTok', 'Instagram', 'X', 'Snapchat', 'WhatsApp'];
const ageGroupOptions = ['18-25', '25-30', '30-35', '40+'];

const CampaignBuilder = forwardRef(
  ({ onGenerated, onGenerating, hasResults, onResetOutputs, outputs }, ref) => {
    const [idea, setIdea] = useState('');
    const [contentGoal, setContentGoal] = useState('sell');
    const [contentCategory, setContentCategory] = useState('marketing');
    const [tone, setTone] = useState('friendly');
    const [platforms, setPlatforms] = useState([]);
    const [ageGroups, setAgeGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [limitOpen, setLimitOpen] = useState(false);
    const [fairWarn, setFairWarn] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [lastGeneratedInputs, setLastGeneratedInputs] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
    const genAbortRef = useRef(null);
    const varAbortRef = useRef(null);
    const genReqIdRef = useRef(0);
    const varReqIdRef = useRef(0);
    const outputsRef = useRef(outputs);
    useEffect(() => {
      outputsRef.current = outputs;
    }, [outputs]);
    const [variationIteration, setVariationIteration] = useState(0);
    const {
      entitlements,
      loadEntitlements,
      refreshTrialData,
      user,
      setTrialModalOpen,
    } = useAuth();
    const isAdmin =
      !!entitlements?.is_admin ||
      (user?.email || '').toLowerCase() === 'alva@admin.com';
    const isActive = !!entitlements?.has_active_subscription;

    function togglePlatform(p) {
      setPlatforms((prev) =>
        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
      );
    }

    function selectAllPlatforms() {
      if (platforms.length === platformsList.length) {
        setPlatforms([]);
      } else {
        setPlatforms([...platformsList]);
      }
    }

    function toggleAgeGroup(g) {
      setAgeGroups((prev) =>
        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
      );
    }

    function arraysEqual(a = [], b = []) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }

    const inputsChangedSinceLastGen = useMemo(() => {
      if (!hasResults || !lastGeneratedInputs) return false;
      if (idea !== lastGeneratedInputs.idea) return true;
      if (contentGoal !== lastGeneratedInputs.contentGoal) return true;
      if (tone !== lastGeneratedInputs.tone) return true;
      if (!arraysEqual(platforms, lastGeneratedInputs.platforms)) return true;
      if (!arraysEqual(ageGroups, lastGeneratedInputs.ageGroups)) return true;
      return false;
    }, [
      hasResults,
      lastGeneratedInputs,
      idea,
      contentGoal,
      tone,
      platforms,
      ageGroups,
    ]);

    async function generateInternal(variationMode = false) {
      if (!isValid) return;
      setError('');
      setErrors({});
      const v = {
        idea: !!idea.trim(),
        contentGoal: !!contentGoal,
        platforms: platforms.length > 0,
      };
      if (!v.idea || !v.contentGoal || !v.platforms) {
        setErrors({
          idea: !v.idea,
          contentGoal: !v.contentGoal,
          platforms: !v.platforms,
        });
        setError('الرجاء تعبئة جميع الحقول الإلزامية قبل إنشاء الحملة.');
        return;
      }
      if (entitlements?.requires_renewal_block && !isAdmin) {
        setLimitOpen(true);
        return;
      }
      const remaining = Number(
        entitlements?.daily_usage?.content_remaining_today || 0
      );
      const canTrial = !!entitlements?.can_use_trial_today;
      if (!isActive && !isAdmin && canTrial && remaining <= 0) {
        setLimitOpen(true);
        return;
      }
      if (cooldownUntil && Date.now() < cooldownUntil) {
        setError('سياسة الاستخدام العادل: حاول بعد دقيقة');
        return;
      }
      const isVar = !!variationMode;
      if (isVar && isGeneratingVariation) return;
      if (!isVar && isGenerating) return;
      const abortRef = isVar ? varAbortRef : genAbortRef;
      const setBusy = isVar ? setIsGeneratingVariation : setIsGenerating;
      const reqIdRef = isVar ? varReqIdRef : genReqIdRef;
      try {
        abortRef.current?.abort();
      } catch {}
      abortRef.current = new AbortController();
      reqIdRef.current += 1;
      const currentReqId = reqIdRef.current;
      const clientRequestId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const payload = {
        idea,
        contentGoal,
        contentCategory,
        tone,
        platforms,
        ageGroups,
        variationMode,
      };
      if (isVar) {
        const nextIter = variationIteration + 1;
        setVariationIteration(nextIter);
        payload.variationIteration = nextIter;
        payload.clientRequestId = clientRequestId;
      }
      setBusy(true);
      onGenerating?.(true);
      try {
        const res = await fetch(`${API}/api/campaigns/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('auth_token')
              ? {
                  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                }
              : {}),
          },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          const msg = data?.error?.message || `HTTP ${res.status}`;
          const err = new Error(msg);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        if (currentReqId !== reqIdRef.current) return; // outdated response
        const out = data?.data?.outputs || {};
        const normalized = Object.fromEntries(
          Object.entries(out).map(([p, c]) => [
            p,
            c && typeof c === 'object' && !Array.isArray(c) ? { ...c } : c,
          ])
        );
        const prev = outputsRef.current || {};
        const platforms = Object.keys(normalized || {});
        const allSame = platforms.every((p) =>
          String(p).toLowerCase() === 'suggestions'
            ? true
            : (prev?.[p]?.CTA || '') === (normalized?.[p]?.CTA || '')
        );
        try {
          if ((import.meta.env.MODE || '').toLowerCase() === 'development') {
            console.log(`GENERATION_RESPONSE variation=${!!variationMode}`);
          }
        } catch {}
        outputsRef.current = {};
        onGenerated?.(normalized);
        if (allSame) {
          setError(
            'طلعت نفس الصياغة هالمرة — جرّب مرة ثانية وراح نعطيك نسخة مختلفة 👌'
          );
          setTimeout(() => setError(''), 4000);
        }
        setLastGeneratedInputs({
          idea,
          contentGoal,
          contentCategory,
          tone,
          platforms: [...platforms],
          ageGroups: [...ageGroups],
        });
        loadEntitlements?.();
        refreshTrialData?.();
        if (!isActive && !isAdmin) {
          setTrialModalOpen?.(true);
        }
        if (data?.data?.fair_usage_warning) {
          setFairWarn(true);
          setTimeout(() => setFairWarn(false), 5000);
        }
      } catch (err) {
        if (err?.name === 'AbortError') {
          // silent on abort
        } else {
          const msg = err?.message || '';
          if (
            msg.includes('SUBSCRIPTION_REQUIRED') ||
            msg.includes('اشتراك') ||
            msg.includes('حد التجربة') ||
            msg.includes('TRIAL_LIMIT_REACHED')
          ) {
            setLimitOpen(true);
          } else if (
            msg.includes('FAIR_USAGE_THROTTLED') ||
            msg.includes('الاستخدام العادل') ||
            err?.data?.error?.code === 'FAIR_USAGE_THROTTLED'
          ) {
            setError(
              'سياسة الاستخدام العادل: تم إيقاف الإنشاء مؤقتًا، حاول بعد دقيقة'
            );
            setCooldownUntil(Date.now() + 60000);
          } else {
            setError('حدث خطأ أثناء إنشاء الحملة، حاول مرة أخرى.');
          }
        }
      } finally {
        setBusy(false);
        onGenerating?.(false);
      }
    }

    async function generate() {
      return generateInternal(false);
    }

    async function generateVariation() {
      return generateInternal(true);
    }

    function resetAll() {
      onResetOutputs?.();
      setIdea('');
      setContentGoal('sell');
      setContentCategory('marketing');
      setTone('friendly');
      setPlatforms([]);
      setAgeGroups([]);
      setError('');
      setErrors({});
      setFairWarn(false);
      setCooldownUntil(0);
      setLastGeneratedInputs(null);
      setIsGenerating(false);
      setIsGeneratingVariation(false);
      try {
        genAbortRef.current?.abort();
      } catch {}
      try {
        varAbortRef.current?.abort();
      } catch {}
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }

    useImperativeHandle(ref, () => ({
      regeneratePlatform: async (platform) => {
        if (!platform) return;

        const v = {
          idea: !!idea.trim(),
          contentGoal: !!contentGoal,
        };
        if (!v.idea || !v.contentGoal) {
          setError('البيانات غير مكتملة لإعادة التوليد.');
          return;
        }

        if (entitlements?.requires_renewal_block && !isAdmin) {
          setLimitOpen(true);
          return;
        }
        const remaining = Number(
          entitlements?.daily_usage?.content_remaining_today || 0
        );
        const canTrial = !!entitlements?.can_use_trial_today;
        if (!isActive && !isAdmin && canTrial && remaining <= 0) {
          setLimitOpen(true);
          return;
        }

        const payload = {
          idea,
          contentGoal,
          contentCategory,
          tone,
          platforms: [platform],
          ageGroups,
          variationMode: true,
          variationIteration: variationIteration + 1,
          clientRequestId: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        };

        setVariationIteration((prev) => prev + 1);

        try {
          const res = await fetch(`${API}/api/campaigns/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('auth_token')
                ? {
                    Authorization: `Bearer ${localStorage.getItem(
                      'auth_token'
                    )}`,
                  }
                : {}),
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.success === false) {
            throw new Error(data?.error?.message || 'Failed');
          }

          const out = data?.data?.outputs || {};
          const newPlatformContent = out[platform];
          if (newPlatformContent) {
            const merged = {
              ...outputsRef.current,
              [platform]: newPlatformContent,
            };
            outputsRef.current = merged;
            onGenerated?.(merged);

            loadEntitlements?.();
            refreshTrialData?.();
          }
        } catch (err) {
          console.error('Regeneration failed', err);
          setError('فشل إعادة التوليد، حاول مرة أخرى.');
          setTimeout(() => setError(''), 3000);
          throw err;
        }
      },
      refinePlatform: async (platform, userComment) => {
        if (!platform || !userComment) return;

        const v = {
          idea: !!idea.trim(),
          contentGoal: !!contentGoal,
        };
        if (!v.idea || !v.contentGoal) {
          setError('البيانات غير مكتملة للتعديل.');
          return;
        }

        if (entitlements?.requires_renewal_block && !isAdmin) {
          setLimitOpen(true);
          return;
        }
        const remaining = Number(
          entitlements?.daily_usage?.content_remaining_today || 0
        );
        const canTrial = !!entitlements?.can_use_trial_today;
        if (!isActive && !isAdmin && canTrial && remaining <= 0) {
          setLimitOpen(true);
          return;
        }

        const clientRequestId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const payload = {
          idea,
          contentGoal,
          contentCategory,
          tone,
          platforms: [platform],
          ageGroups,
          userComment,
          targetPlatform: platform,
          variationMode: true,
          variationIteration: variationIteration + 1,
          clientRequestId,
        };

        setVariationIteration((prev) => prev + 1);

        try {
          const res = await fetch(`${API}/api/campaigns/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('auth_token')
                ? {
                    Authorization: `Bearer ${localStorage.getItem(
                      'auth_token'
                    )}`,
                  }
                : {}),
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.success === false) {
            throw new Error(data?.error?.message || 'Failed');
          }

          const out = data?.data?.outputs || {};
          const newPlatformContent = out[platform];
          if (newPlatformContent) {
            const merged = {
              ...outputsRef.current,
              [platform]: newPlatformContent,
            };
            outputsRef.current = merged;
            onGenerated?.(merged);

            loadEntitlements?.();
            refreshTrialData?.();
          }
        } catch (err) {
          console.error('Refinement failed', err);
          setError('فشل تعديل المحتوى، حاول مرة أخرى.');
          setTimeout(() => setError(''), 3000);
          throw err;
        }
      },
    }));

    const isValid = useMemo(() => {
      return (
        idea.trim().length > 0 && platforms.length > 0 && ageGroups.length > 0
      );
    }, [idea, platforms, ageGroups]);

    return (
      <div className="card-glass h-[900px] md:h-[790px] flex flex-col p-5 mt-8 overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-lg font-display font-bold text-white">
            {contentCategory === 'interactive'
              ? 'المحتوي التفاعلي'
              : 'المحتوي التسويقي'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 pl-1">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">
                معلومات أساسية
              </h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  نوع المحتوى
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContentCategory('marketing')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      contentCategory === 'marketing'
                        ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                        : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                    }`}>
                    تسويقي
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentCategory('interactive')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      contentCategory === 'interactive'
                        ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                        : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                    }`}>
                    تفاعلي
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  فكرة المحتوى
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  className={`input-base resize-none ${
                    errors.idea ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                  placeholder="اكتب باختصار فكرة أو موضوع المحتوى"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  الهدف التسويقي
                </label>
                <select
                  value={contentGoal}
                  onChange={(e) => setContentGoal(e.target.value)}
                  className={`input-base ${
                    errors.contentGoal
                      ? 'border-red-500/50 focus:border-red-500'
                      : ''
                  }`}>
                  <option value="sell">بيع المنتج</option>
                  <option value="traffic">زيادة عدد الزيارات</option>
                  <option value="trust">بناء ثقة العميل</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">المنصات</h3>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-gray-400">
                  المنصات المستهدفة
                </label>
                <button
                  type="button"
                  onClick={selectAllPlatforms}
                  className="text-[10px] font-bold text-brand-primary hover:text-brand-primary-light transition-colors uppercase tracking-wider">
                  {platforms.length === platformsList.length
                    ? 'إلغاء الكل'
                    : 'تحديد الكل'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {platformsList.map((p) => (
                  <button
                    key={p}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 border flex items-center gap-2 ${
                      platforms.includes(p)
                        ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40 font-medium'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => togglePlatform(p)}>
                    <span>{getPlatformIcon(p)}</span>
                    {p}
                  </button>
                ))}
              </div>
              {errors.platforms && (
                <div className="text-xs text-red-400 mt-1">
                  اختر منصة واحدة على الأقل
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">
                الجمهور المستهدف
              </h3>
              <label className="block text-xs text-gray-400 mb-1.5">
                الفئة العمرية
              </label>
              <div className="flex flex-wrap gap-2">
                {ageGroupOptions.map((g) => (
                  <button
                    key={g}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 border ${
                      ageGroups.includes(g)
                        ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40 font-medium'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => toggleAgeGroup(g)}>
                    {g}
                  </button>
                ))}
              </div>
              {errors.ageGroups && (
                <div className="text-xs text-red-400 mt-1">
                  اختر فئة عمرية واحدة على الأقل
                </div>
              )}
            </div>

            <div className="space-y-3 pb-4">
              <h3 className="text-sm font-semibold text-gray-300">
                ملاحظات إضافية
              </h3>
              <label className="block text-xs text-gray-400 mb-1.5">
                أسلوب الكتابة
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-base">
                <option value="friendly">ودّي</option>
                <option value="professional">مهني</option>
                <option value="bold">جريء</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 shrink-0">
          {!hasResults ? (
            <button
              className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20"
              onClick={generate}
              disabled={isGenerating || !isValid}>
              {isGenerating ? 'جارٍ التوليد…' : 'إنشاء'}
            </button>
          ) : inputsChangedSinceLastGen ? (
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20"
                onClick={generate}
                disabled={isGenerating || !isValid}>
                {isGenerating ? 'جارٍ التوليد…' : 'إنشاء'}
              </button>
              <button
                className="btn btn-secondary w-full"
                onClick={resetAll}
                disabled={isGenerating || isGeneratingVariation}>
                محتوى جديد
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-primary/20"
                onClick={generateVariation}
                disabled={isGeneratingVariation || !isValid}>
                {isGeneratingVariation ? 'جارٍ التوليد…' : 'إنشاء نسخة بديلة'}
              </button>
              <button
                className="btn btn-secondary w-full"
                onClick={resetAll}
                disabled={isGenerating || isGeneratingVariation}>
                محتوى جديد
              </button>
            </div>
          )}
        </div>

        <SubscriptionPrompt
          open={limitOpen}
          onClose={() => setLimitOpen(false)}
          strict={!!entitlements?.requires_renewal_block && !isAdmin}
        />
        {fairWarn && (
          <div className="mt-2 text-xs text-yellow-400 text-center">
            تنبيه استخدام: خفف الاستخدام اليوم لراحة النظام
          </div>
        )}
      </div>
    );
  }
);

export default CampaignBuilder;
