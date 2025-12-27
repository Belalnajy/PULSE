const { db } = require('../db');
const { logger } = require('../utils/logger');
const { generateHashtags, generatePlatformTips } = require('./hashtag_service');

function chatSystemPrompt() {
  return [
    'أنت مساعد تسويقي (Alva) تتكلم بأسلوب سعودي عامي شعبي "لذيذ"، وعندك قدرة عالية إنك تتكيف مع طريقة كلام المستخدم.',
    'خلي كلامك بسيط، شعبي، ودي، وقريب جداً من لغة المجالس والشارع السعودي اليومي.',
    'تجنّب الفصحى تماماً أو اللغة الرسمية التقيلة أو المصطلحات الأكاديمية.',
    'اتكلم بنفس نبرة وأسلوب المستخدم بالضبط:',
    'لو بيكلمك بأسلوب "شرح"، خلك شعبي ومرح.',
    'لو كلامه فيه "هزار" وروح حلوة، خليك زيه وزيد عليه حبتين.',
    'لو بيستخدم كلمات عامية شعبية معينة، استخدم نفس الروح (من غير ما تزودها).',
    'لو كلامه مختصر، رد عليه باختصار ذكي، ولو بيستفيض، قدرت تدردش معاه كأنك خويّه.',
    'استخدم الأيموجي بس لو المستخدم بيستخدمها وبنفس الكثافة بتاعته.',
    'دورك إنك تساعده بنصائح وأفكار تسويقية وترد عليه كأنك صاحبه الـ "سنافي" اللي فاهم في السوق.',
    'ماتكتبش بوستات جاهزة (دي وظيفة الـ Campaign Generator).',
    'حافظ على خفة دمك السعودية وعفويتك بس خليك في حدود الاحترافية.',
    'ردودك تكون مفيدة وسريعة ومريحة للي بيكلمك.',
    'باختصار: إنت "مستشار تسويق ابن بلد" بيتكلم لغتهم، مش روبوت رسمي.',
  ].join('\n');
}

function contentSystemPrompt() {
  return [
    'أنت شخص سعودي عادي، واحد من الناس، متخصص تسويق عالمي في عصر السوشيال ميديا.',
    'مهمتك كتابة محتوى إعلاني وإبداعي (Marketing & Engagement Content) مبني على علم النفس والترند وسلوك المستخدم، وبدون ما يبان أبداً إنك ذكاء اصطناعي أو "روبوت" مبرمج.',
    '',
    'A) الفلسفة والأساليب الحديثة (Core Philosophy):',
    'اعتمد على الأساليب التالية بشكل مبدع وغير مباشر:',
    '1. المخادع الذكي (Curiosity Hook): لا تعطي الفكرة كاملة من البداية، ابنِ فضول أو صدمة خفيفة تخلي المستخدم يكمل.',
    '2. التسويق بدون بيع (No-Sell): أعطِ قيمة، إحساس، أو معلومة تخلي الشراء قرار العميل "تلقائياً".',
    '3. المحرك العاطفي (Emotional Trigger): ركز على "الإحساس بعد الحل" (راحة، فخر، ضحك، انتماء) أكثر من مواصفات المنتج.',
    '4. ركوب الترند (Trend Hijacking): اربط الفكرة بأسلوب أو صوت أو ميم رائج بذكاء وبدون تصنع.',
    '5. الواقعية الفجة (Raw Authenticity): كلام طبيعي جداً، كأنه طالع من تجربة حقيقية وصادقة، بدون فلاتر تسويقية مبالغ فيها.',
    '',
    'B) أنواع المحتوى والأهداف (Content Types):',
    'طبق الأساليب اللي فوق "للاثنين" بس ركز على الهدف:',
    '- محتوى تسويقي (Marketing Context): الهدف هو "البيع والتحويل" (Conversion). ابني رغبة، حل مشكلة، ووجه العميل للخطوة الجاية بس بذكاء وبدون إلحاح إعلاني قديم.',
    '- محتوى تفاعلي (Interactive Context): الهدف هو "بناء علاقة وتفاعل" (Engagement). اسأل، استفز فكر، ابدأ نقاش، وخل الناس تحس إنها جزء من السالفة.',
    '',
    'C) استراتيجية كل منصة (Strategic Angles):',
    '- TikTok: "خطاف" بصري ولفظي جبار (Scroll-Stopping). ابدأ بـ POV أو سؤال يضرب في الصميم. سريع، شبابي، وخفيف دم.',
    '- Instagram: "عالم الأحلام والرغبات". كلام شيك، دافئ، يحكي قصة قصيرة تخاطب الطموح والنمط الحياتي.',
    '- X: منصة المعلومات والآراء القوية. "Value Bomb" أو حقيقة تخالف الشائع بلهجة "بيضاء" تميل للشعبي.',
    '- Snapchat: عفوية "اللحظة". كأنك تصور سناب وترسله لخويك بشكل شخصي جداً.',
    '- WhatsApp: رسالة دافئة تحسس العميل إنه "مختار" ومميز، وتدعوه لدردشة ودية.',
    '',
    'C) قواعد "نبرة Alva" (The Human Tone):',
    '- التزم بالعامية السعودية "الشهباء" الشعبية الذكية. جمل قصيرة، غير مرتبة زيادة، كأنك قاعد في ديوانية أو قهوة.',
    '- ممنوع الكليشيهات: (اكتشف، حصري، الأفضل، أسرع، لا تفوت الفرصة). استبدلها بكلمات الناس العادية.',
    '- المحتوى لازم يبان كأنه تجربة أو رأي شخصي حقيقي، مو إعلان مدفوع.',
    '- تجنب الفصحى تماماً، وتجنب شرح "ليش الكلام حلو" أو تبرير أفعالك.',
    '',
    'الإخراج النهائي:',
    '- نفس الصيغة دايماً: { "Platform": { "Hook": "...", "Body": ["..."], "CTA": "...", "ExecutionPlan": "أربع خطوات عملية وواقعية لتنفيذ هذا المحتوى بلهجة سعودية شعبية بسيطة وعفوية" } } فقط.',
  ].join('\n');
}

let cachedSystemPrompt = null;
function getSystemPrompt() {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  const fs = require('fs');
  const path = require('path');
  const rulesPath = path.join(
    __dirname,
    '../../../documentation/CAMPAIGN_GENERATOR_RULES.md'
  );
  try {
    const content = fs.readFileSync(rulesPath, 'utf8');
    const match = content.match(
      /## Paste[\u2011\u2010\u2013\u2014\-]Ready System Prompt \(Full\)\n+```[\s\S]+?```/
    );
    if (match) {
      const block = match[0];
      const inner = block
        .replace(/^.*```/s, '')
        .replace(/```.*$/s, '')
        .trim();
      cachedSystemPrompt = inner;
    } else {
      cachedSystemPrompt = contentSystemPrompt();
    }
  } catch {
    cachedSystemPrompt = contentSystemPrompt();
  }
  return cachedSystemPrompt;
}

function getGlobalKey() {
  const key = process.env.ADMIN_OPENAI_KEY;
  if (!key) {
    const err = new Error(
      'المفتاح العام غير مضبوط من قبل المشرف (ADMIN_OPENAI_KEY).'
    );
    err.code = 'OPENAI_KEY_MISSING';
    err.status = 500;
    throw err;
  }
  return key;
}

async function callOpenAI(
  apiKey,
  messages,
  json,
  model = 'gpt-4o-mini',
  temperature = 0.7
) {
  const body = { model, messages, temperature };
  if (json) body.response_format = { type: 'json_object' };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errBody = null;
    try {
      errBody = await res.json();
    } catch {}
    const e = new Error(errBody?.error?.message || `OpenAI HTTP ${res.status}`);
    e.status = res.status;
    e.openai = errBody?.error;
    throw e;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function buildCampaignInstruction(inputs) {
  const goalMap = {
    sell: 'بيع المنتج',
    traffic: 'زيادة عدد الزيارات',
    trust: 'بناء ثقة العميل',
  };
  const toneMap = {
    friendly: 'ودي وشعبي',
    professional: 'مهني بلمسة سعودية',
    bold: 'جريء وشهم',
  };
  const base = [
    'A) توليد المحتوى (Hook + Body) لكل منصة مختارة:',
    `- الفكرة: ${inputs.idea}`,
    `- التصنيف: ${
      inputs.contentCategory === 'interactive'
        ? 'محتوى تفاعلي (Engagement)'
        : 'محتوى تسويقي (Marketing/Sales)'
    }`,
    `- الهدف: ${goalMap[inputs.contentGoal] || inputs.contentGoal}`,
    `- المنصات: ${(inputs.platforms || []).join(', ')}`,
    `- النبرة: ${toneMap[inputs.tone] || inputs.tone}`,
    `- الجمهور: ${inputs.audience || 'جمهور سعودي شعبوي وعفوي'}`,
    `- الفئات العمرية: ${
      inputs.ageGroups && inputs.ageGroups.length > 0
        ? inputs.ageGroups.join(', ')
        : 'الشباب وعامة الناس'
    }`,
    '- اعتبر كل منصة حملة إعلانية منفصلة "Micro-Campaign" بزاوية بصرية ولفظية مختلفة.',
    inputs.contentCategory === 'interactive'
      ? '- ركز على التفاعل: اسأل أسئلة شعبية، اطلب رأيهم بعفوية، استخدم أسلوب المسابقات أو الاستطلاعات، خلي الهدف هو فتح كلام "مجالس" مع الجمهور مش بس البيع.'
      : '- ركز على البيع والتأثير: وضح القيمة المضافة بأسلوب مقنع وودود، حفز العميل على الشراء أو اتخاذ خطوة، استخدم أسلوب الإقناع المباشر "من القلب للقلب".',
    '- امنع تماماً أي تكرار أو تشابه في بنية الجمل بين المنصات؛ لازم كل نص يكون ليه "نفس" وشخصية مستقلة وشعبية.',
    '- استخدم لهجة عامية سعودية شعبية (Native Sha\'abi Ammiya) ذكية، واقعية جداً، وقوية في الإقناع، نفس روح "ألفا" العامية الشعبية.',
    '',
    'B) الـ CTA:',
    inputs.contentCategory === 'interactive'
      ? '- ولّد CTA يحفز على المشاركة أو التعليق (مثلاً: عطنا رأيك في الكومنتات، جربتها قبل؟، وش رايك يا بطل؟).'
      : '- ولّد CTA تلقائيًا مناسب للمنصة والهدف، قصير وحاد (Sharp) وبلهجة شعبية.',
  ];
  if (inputs && inputs.variationMode) {
    base.unshift(
      'هذه نسخة بديلة لنفس الفكرة: غيّر الصياغة والزاوية وتدفّق النص بالكامل مع الحفاظ على الهدف والنبرة والجمهور والمنصات، وامنع أي تكرار للجمل أو البُنى السابقة، وحافظ على الروح الشعبية.'
    );
    if (Number.isFinite(inputs.variationIteration)) {
      base.unshift(
        `إعادة توليد النسخة البديلة رقم #${inputs.variationIteration} — اصنع نسخة مختلفة بوضوح عن السابق، وامنع أي تكرار لفظي أو بنيوي، وخلك أكثر عفوية.`
      );
    }
    if (inputs.clientRequestId) {
      base.push(`معرّف الطلب: ${inputs.clientRequestId}`);
    }
  }
  base.push(
    'أخرج JSON لكل منصة فقط بشكل {"Hook":"...","Body":["..."],"CTA":"...","ExecutionPlan":"خطة تنفيذ واقعية بالعامية السعودية الشعبية (نفس روح ألفا الشعبية)"} بدون مفاتيح إضافية.'
  );
  return base.join('\n');
}

const { incContentDaily } = require('./subscription');

function autoCTA(goal, tone, category, platform = '') {
  const isInteractive = category === 'interactive';
  const g = String(goal || '').toLowerCase();
  const t = String(tone || '').toLowerCase();
  const pl = String(platform || '').toLowerCase();

  if (isInteractive) {
    if (pl === 'tiktok') return 'اكتبلنا كومنت برأيك؟';
    if (pl === 'instagram') return 'شاركنا في التعليقات أو ابعتلنا DM';
    if (pl === 'x') return 'إيه رأيك؟ رتويت وقولنا';
    if (pl === 'snapchat') return 'صور الشاشة وقولنا رأيك؟';
    if (pl === 'whatsapp') return 'مستنيين ردك هنا في الشات';

    if (t === 'bold') return 'قولنا رأيك بصراحة؟';
    if (t === 'friendly') return 'شاركنا تجربتك في التعليقات';
    return 'محتاجين نسمع رأيك';
  }

  if (g === 'sell') {
    if (t === 'bold') return 'اطلبه دلوقتي';
    if (t === 'friendly') return 'اطلب دلوقتي وحس بالفرق';
    return 'اطلب دلوقتي';
  }
  if (g === 'traffic') {
    if (t === 'bold') return 'شوف التفاصيل دلوقتي';
    if (t === 'professional') return 'تعرف على المزيد في موقعنا';
    return 'ادخل على اللينك وشوف التفاصيل';
  }
  if (g === 'trust') {
    if (t === 'bold') return 'خليك معانا وتواصل دلوقتي';
    if (t === 'professional') return 'تواصل مع فريقنا المختص';
    return 'تواصل معانا وقولنا رأيك';
  }
  return 'تواصل معانا';
}

function buildDevOutputs(inputs, requestNonce) {
  const platforms = Array.isArray(inputs.platforms) ? inputs.platforms : [];
  const outputs = {};
  const toneLabel =
    { friendly: 'ودّي', professional: 'مهني', bold: 'جريء' }[inputs.tone] ||
    'طبيعي';
  const categoryLabel =
    inputs.contentCategory === 'interactive' ? 'تفاعلي' : 'تسويقي';
  const idea = String(inputs.idea || '').trim();
  const shortIdea = idea.length ? idea.slice(0, 120) : 'خدمة/منتج يهمك';
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return h >>> 0;
  }
  const varSeedBase = `${inputs.variationMode ? 1 : 0}-${
    inputs.variationIteration || 0
  }-${inputs.clientRequestId || requestNonce || ''}-${shortIdea}`;
  function stylize(text, shift) {
    const s = String(text || '');
    const maps = [
      { from: /سريع(ًا)?/g, to: 'بسرعة' },
      { from: /واضح(ة)?/g, to: 'مباشر' },
      { from: /مختصر(ة)?/g, to: 'قصير' },
      { from: /التجربة/g, to: 'تجربة الاستخدام' },
      { from: /تفاصيل/g, to: 'المزيد من التفاصيل' },
    ];
    const maps2 = [
      { from: /سريع(ًا)?/g, to: 'فوري' },
      { from: /واضح(ة)?/g, to: 'دقيق' },
      { from: /مختصر(ة)?/g, to: 'موجز' },
      { from: /التجربة/g, to: 'التجربة كلها' },
      { from: /تفاصيل/g, to: 'معلومات' },
    ];
    const packs = [maps, maps2, [], [{ from: /اليوم/g, to: '' }]];
    let out = s;
    const pack = packs[shift % packs.length];
    for (const m of pack) {
      if (m && m.from && m.to) out = out.replace(m.from, m.to);
    }
    return out;
  }
  function makeHook(p, goal, idx) {
    const pl = String(p).toLowerCase();
    const baseAsk = shortIdea.replace(/\.$/, '');
    const hooks = {
      tiktok: [
        `تحتاج ${baseAsk}؟ الحل عندنا!`,
        `قصة قصيرة: كيف ${baseAsk} تغيّر يومك`,
        `خلّك معنا: ${baseAsk} يسهّلها`,
      ],
      instagram: [
        `${baseAsk} اللي يخلي التجربة أجمل`,
        `تفاصيل صغيرة تخلي ${baseAsk} أحلى`,
        `لمسة مرتبة لـ ${baseAsk}`,
      ],
      x: [
        `فائدة سريعة: ${baseAsk}`,
        `رأي مختصر حول ${baseAsk}`,
        `${baseAsk} يختصر عليك كثير`,
      ],
      snapchat: [
        `لحظة سريعة: ${baseAsk} بيوضح لك`,
        `سؤال سريع: محتاج ${baseAsk}؟`,
        `لقطة: ${baseAsk} يحلها`,
      ],
      whatsapp: [
        `عندي ليك ${baseAsk} هيفيدك جداً`,
        `بص ${baseAsk} هينجز معاك كتير`,
        `لو عايز ${baseAsk} مظبوط`,
      ],
    };
    if (hooks[pl]) {
      const arr = hooks[pl];
      return arr[idx % arr.length];
    }
    return `${baseAsk} - ${categoryLabel} بلمسة ${toneLabel}`;
  }
  function bodyForPlatform(p, idx) {
    const pl = String(p).toLowerCase();
    const value = `نقدّم لك ${shortIdea} بطريقة تخلي التجربة أسهل وأقرب لك.`;
    const trust = `كل شيء بسيط وواضح وبأمان، وخدمة تناسب احتياجك.`;
    const bodies = {
      tiktok: [
        [
          `خلك معي: ${value}`,
          `نوضح الفائدة بسرعة وبشكل مباشر.`,
          `التفاصيل في الرابط أو الوصف.`,
        ],
        [
          `وش المشكلة؟ ${shortIdea} يحلّها بسرعة.`,
          `جمل قصيرة وسريعة، تركيز على الفائدة.`,
          `شوف التفاصيل بسرعة.`,
        ],
        [
          `قصة صغيرة: ${shortIdea} يسهل حياتك.`,
          `نقاط سريعة وواضحة.`,
          `تفاصيل أكثر تحت.`,
        ],
      ],
      instagram: [
        [`${value}`, `ريْل أنيق، وصف مرتب بأسلوب ${toneLabel}.`, `${trust}`],
        [
          `لمسة جمالية تزيد من ${shortIdea}.`,
          `وصف مختصر ومعبر.`,
          `راحة وثقة في التجربة.`,
        ],
        [`صور مرتبة + كلمات نظيفة.`, `الفائدة تظهر بسلاسة.`, `${trust}`],
      ],
      x: [
        [`${value}`, `${trust}`],
        [`${shortIdea} يختصر وقتك.`, `تفاصيل قليلة ومعنى كبير.`],
        [`فائدة مباشرة بدون زيادة.`, `سطرين يكفون.`],
      ],
      snapchat: [
        [
          `${value}`,
          `لقطة أولى للفكرة، الثانية توضح الفائدة بأسلوب ${toneLabel}.`,
        ],
        [`سؤال سريع ثم جواب.`, `نقاط قصيرة واضحة.`],
        [`فكرة مختصرة مع مثال سريع.`, `CTA خفيف حسب الحاجة.`],
      ],
      whatsapp: [
        [
          `${value}`,
          `يا هلا بيك، حبيت أشاركك حاجة مميزة جداً عن ${shortIdea}.`,
          `الموضوع ده هيغير طريقتك في الشغل تماماً وهيوفر عليك وقت ومجهود كبير جداً.`,
          `إحنا درسنا المشاكل اللي بتقابل الناس في المجال ده وطلعنا بالحل الأمثل اللي يخليك مرتاح ومطمن.`,
          `لو محتاج تعرف تفاصيل أكتر عن المميزات والأسعار، أنا هبعتلك ملف كامل فيه كل اللي محتاجه. مستني ردك!`,
        ],
        [
          `بشاركك تجربة مفيدة جداً مع ${shortIdea}، فعلاً حاجة تستاهل إنك تجربها.`,
          `إحنا بنهتم بكل تفصيلة عشان نقدملك أحسن خدمة، لو عندك أي سؤال أنا موجود هرد عليك فوراً.`,
        ],
        [
          `نصيحة شخصية ليك بخصوص ${shortIdea}.`,
          `لو بتدور على جودة وسعر وبساطة، يبقى ده الاختيار الصح. مستني ردك لو حابب نبدأ.`,
        ],
      ],
    };
    if (bodies[pl]) {
      const arr = bodies[pl];
      return arr[idx % arr.length];
    }
    return [`${value}`, `${trust}`];
  }
  for (const p of platforms) {
    const seed = `${varSeedBase}-${p}`;
    const idx = hashStr(seed) % 3;
    const styleShift = hashStr(seed + '-style') % 4;
    const baseHook = makeHook(p, inputs.contentGoal, idx);
    const baseBody = bodyForPlatform(p, idx);
    outputs[p] = {
      Hook: stylize(baseHook, styleShift),
      Body: Array.isArray(baseBody)
        ? baseBody.map((line) => stylize(line, styleShift))
        : baseBody,
      CTA: autoCTA(inputs.contentGoal, inputs.tone, inputs.contentCategory, p),
      ExecutionPlan: `خطة بسيطة لـ ${p}: أول شي ابدأ بالـ Hook اللي فوق عشان تشد الانتباه، وبعدين نزل الـ Body بأسلوبك الرهيب، ولا تنسى الـ CTA بالنهاية. خلك عفوي واللقطة تكون واضحة.`,
    };
  }
  outputs.suggestions = {
    __meta: {
      mock: true,
      variation: !!inputs.variationMode,
      iteration: Number(inputs.variationIteration || 0),
    },
  };
  return outputs;
}

async function generateCampaignContent(user, inputs) {
  // Development fallback: if no valid ADMIN_OPENAI_KEY in dev, return mock outputs per platforms
  const dev = (process.env.NODE_ENV || '').toLowerCase() === 'development';
  const hasKey =
    !!process.env.ADMIN_OPENAI_KEY &&
    process.env.ADMIN_OPENAI_KEY !== 'sk-test';
  const forceDev = String(process.env.FORCE_DEV_FALLBACK || '') === '1';
  const pathChoice = dev && forceDev ? 'Dev Fallback' : 'OpenAI';
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.warn(
    `GENERATION_START NODE_ENV=${
      process.env.NODE_ENV || ''
    } hasKey=${hasKey} forceDev=${forceDev} PATH=${pathChoice}${
      pathChoice === 'OpenAI'
        ? ` model=gpt-4o-mini temperature=${inputs?.variationMode ? 0.9 : 0.7}`
        : ''
    }`
  );
  logger.info(
    {
      traceId,
      nodeEnv: process.env.NODE_ENV || '',
      hasKey,
      forceDev,
      path: pathChoice,
      ...(pathChoice === 'OpenAI'
        ? {
            model: 'gpt-4o-mini',
            temperature: inputs?.variationMode ? 0.9 : 0.9,
          }
        : {}),
    },
    'generateCampaignContent start'
  );
  const requestNonce = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  if (dev && forceDev) {
    logger.warn(
      {
        nodeEnv: process.env.NODE_ENV || null,
        hasKey: !!process.env.ADMIN_OPENAI_KEY,
        reason: 'development_no_key',
      },
      'Using dev fallback for campaign content'
    );
    const outputs = buildDevOutputs(inputs, requestNonce);

    // Add hashtags and platform tips to dev fallback
    const hashtags = await generateHashtags(inputs);
    const platform_tips = generatePlatformTips(
      inputs.platforms || [],
      inputs.contentGoal,
      inputs.tone
    );
    outputs.hashtags = hashtags;
    outputs.platform_tips = platform_tips;

    try {
      outputs.suggestions = outputs.suggestions || {};
      outputs.suggestions.__meta = Object.assign(
        {},
        outputs.suggestions.__meta || {},
        { traceId }
      );
    } catch {}
    await db('campaigns').insert({
      user_id: user.id,
      form_inputs_json: JSON.stringify(inputs),
      generated_outputs_json: JSON.stringify(outputs),
    });
    await incContentDaily(user.id, 1);
    return outputs;
  }
  const key = getGlobalKey();
  const platforms = Array.isArray(inputs.platforms) ? inputs.platforms : [];
  const outputs = {};
  const prevSummaries = [];
  function platformStyleNote(p, category) {
    const pl = String(p).toLowerCase();
    const isInteractive = category === 'interactive';
    if (pl === 'tiktok')
      return `أسلوب TikTok: ${
        isInteractive
          ? 'فيديو تفاعلي، سؤال في البداية، طاقة عالية.'
          : 'فيديو بيع سريع، جمل خطافة، وضوح المنتج.'
      }`;
    if (pl === 'instagram')
      return `أسلوب Instagram: ${
        isInteractive
          ? 'ستوري/بوست بيفتح نقاش، أسئلة قوية، جمالية عالية.'
          : 'وصف شيك، تركيز على الرغبة في المنتج، أناقة في العرض.'
      }`;
    if (pl === 'x')
      return `أسلوب X: ${
        isInteractive
          ? 'رأي مثير للجدل أو سؤال للنقاش، سطر واحد.'
          : 'حقيقة بيعية، اختصار مفيد، رابط مباشر.'
      }`;
    if (pl === 'snapchat')
      return `أسلوب Snapchat: ${
        isInteractive
          ? 'عفوية مطلقة، أسئلة سريعة للمتابعين.'
          : 'عرض فوري، استعجال، رسالة بيع لحظية.'
      }`;
    if (pl === 'whatsapp')
      return isInteractive
        ? 'أسلوب WhatsApp: رسالة ودية تسأل عن رأي العميل وتطلب نصيحته للاستمرار في تقديم الأفضل.'
        : 'أسلوب WhatsApp: رسالة شاملة ومفصلة جداً وطويلة جداً (25-40 سطر). تشمل (تحية شخصية + عرض القيمة المستفيض + تفاصيل تقنية/عملية + قصص نجاح + دعوة صريحة ومكررة للتواصل). يجب أن يكون الكلام بأسلوب عامي راقي ومقنع، ويبدو كأنه مكتوب خصيصاً للعميل.';
    return 'اكتب بصياغة مناسبة للمنصة بأسلوب عامي مهني.';
  }
  function platformAngle(p, category) {
    const pl = String(p).toLowerCase();
    const isInteractive = category === 'interactive';
    if (pl === 'tiktok')
      return isInteractive
        ? 'POV أو سؤال للجمهور يخليهم يكتبوا كومنت'
        : 'مشكلة ← حل سريع يخطف العين والودن';
    if (pl === 'instagram')
      return isInteractive
        ? 'قصة ناقصة لازم الجمهور يكملها أو يختار إيه المفضل'
        : 'تجربة / جمالية / فائدة عاطفية مرتبطة بالإحساس';
    if (pl === 'x')
      return isInteractive
        ? 'سؤال فكري أو "Thread" بيبدأ بسؤال محفز'
        : 'فكرة مباشرة: رأي أو فائدة مختصرة جدًا';
    if (pl === 'snapchat')
      return isInteractive
        ? 'كواليس محفزة وطلب رأي المتابعين في "Poll"'
        : 'فضول / لحظة سريعة / شعور بالفوات (FOMO)';
    if (pl === 'whatsapp')
      return isInteractive
        ? 'دردشة ودية، سؤال عن الاحتياجات، وفتح باب للمساعدة'
        : 'توصية مباشرة / حل لمشكلة / عرض حصري (رسالة طويلة جداً ومفصلة تبني علاقة وثيقة مع العميل وتجيب على كل تساؤلاته المتوقعة)';
    return 'زاوية مناسبة للمنصة تجعل الرسالة طبيعية ومقنعة';
  }
  function summarizePrev(prev) {
    if (!prev || !prev.length) return 'لا يوجد منصات سابقة.';
    const seen = new Set();
    const items = [];
    for (const s of prev) {
      const h = (s.hook || '').slice(0, 60);
      const b = (s.body || '').slice(0, 60);
      const ben = (s.benefit || '').slice(0, 60);
      const key = `${h}|${b}|${ben}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(
        `${s.platform || 'سابق'}: Hook="${h}" | Body="${b}" | Benefit="${ben}"`
      );
    }
    return items.join('\n');
  }
  async function loadPrevCampaignSummaries(userId, inputs) {
    try {
      const recent = await db('campaigns')
        .where({ user_id: userId })
        .orderBy('id', 'desc')
        .limit(8);
      const result = [];
      for (const r of recent) {
        let form = null;
        let gen = null;
        try {
          form = JSON.parse(r.form_inputs_json || '{}');
        } catch {}
        try {
          gen = JSON.parse(r.generated_outputs_json || '{}');
        } catch {}
        const sameIdea =
          !!form &&
          String(form.idea || '').trim() === String(inputs.idea || '').trim();
        const sameGoal =
          !!form &&
          String(form.contentGoal || '') === String(inputs.contentGoal || '');
        const sameTone =
          !!form && String(form.tone || '') === String(inputs.tone || '');
        if (!gen) continue;
        if (sameIdea && sameGoal && sameTone) {
          for (const [platform, obj] of Object.entries(gen)) {
            if (platform === 'suggestions') continue;
            const Hook = obj?.Hook || '';
            const Body = Array.isArray(obj?.Body)
              ? obj.Body
              : typeof obj?.Body === 'string'
              ? [obj.Body]
              : [];
            const firstBody = Body.length ? Body[0] : '';
            const benefit = firstBody || Hook || '';
            result.push({
              platform: platform,
              hook: Hook,
              body: firstBody,
              benefit,
            });
          }
        } else {
          const keys = Object.keys(gen)
            .filter((k) => k !== 'suggestions')
            .slice(0, 2);
          for (const k of keys) {
            const obj = gen[k] || {};
            const Hook = obj?.Hook || '';
            const Body = Array.isArray(obj?.Body)
              ? obj.Body
              : typeof obj?.Body === 'string'
              ? [obj.Body]
              : [];
            const firstBody = Body.length ? Body[0] : '';
            const benefit = firstBody || Hook || '';
            result.push({
              platform: 'سابق',
              hook: Hook,
              body: firstBody,
              benefit,
            });
          }
        }
      }
      return result.slice(0, 12);
    } catch {
      return [];
    }
  }
  function buildPlatformInstruction(inputs, platform, prev, serverNonce) {
    const toneMap = {
      friendly: 'ودّي وشعبي',
      professional: 'مهني بلمسة سعودية (بيضاء)',
      bold: 'جريء وشهم بأسلوب شعبي',
    };
    const nonce = `${inputs.variationMode ? 'var' : 'base'}-${
      inputs.variationIteration || 0
    }-${inputs.clientRequestId || serverNonce || 'none'}`;
    const lines = [
      `تفاصيل الفكرة: ${inputs.idea}`,
      `هدف المحتوى: ${inputs.contentGoal}`,
      `تصنيف المحتوى: ${
        inputs.contentCategory === 'interactive'
          ? 'تفاعلي (Interactive)'
          : 'تسويقي (Marketing)'
      }`,
      `نبرة المحتوى: ${toneMap[inputs.tone] || inputs.tone}`,
      `منصة المحتوى: ${platform}`,
      `زاوية المنصة: ${platformAngle(platform, inputs.contentCategory)}`,
      `ملاحظة النمط: ${platformStyleNote(platform, inputs.contentCategory)}`,
      prev && prev.length
        ? `ملخص منصات سابقة لتجنب التكرار:\n${summarizePrev(prev)}`
        : '',
      inputs.variationMode
        ? 'هذه نسخة بديلة: غيّر الزاوية والصياغة بالكامل مع الالتزام بالروح الشعبية، ممنوع إعادة أي جملة من النسخة السابقة.'
        : '',
      inputs.userComment
        ? `تعليمات إضافية من المستخدم: ${inputs.userComment}\nيرجى تعديل المحتوى بناءً على هذه الملحوظة بدقة.`
        : '',
      inputs.variationMode && Number.isFinite(inputs.variationIteration)
        ? `variationIteration: ${inputs.variationIteration}`
        : '',
      inputs.clientRequestId
        ? `clientRequestId: ${inputs.clientRequestId}`
        : '',
      `nonce: ${nonce}`,
      'ملاحظة هامة: يجب أن يكون الكلام بالعامية السعودية الشعبية القوية "الشهباء" التي تعبر عن هوية الشعبي السعودي، بعيداً عن الرسميات.',
      'أخرج JSON فقط: {"Hook":"...","Body":["..."],"CTA":"...","ExecutionPlan":"خطة تنفيذ واقعية وخطوات عملية بالعامية السعودية الشعبية (شهباء) لهذا المحتوى تشمل أسلوب التصوير والإلقاء الشعبي"}',
    ];
    return lines.filter(Boolean).join('\n');
  }
  try {
    const temp = inputs?.variationMode ? 0.9 : 0.7;
    const globalPrevSummaries = await loadPrevCampaignSummaries(
      user.id,
      inputs
    );
    const targetPlatform = inputs?.targetPlatform;
    const activePlatforms =
      targetPlatform && platforms.includes(targetPlatform)
        ? [targetPlatform]
        : platforms;

    for (const p of activePlatforms) {
      const instruction = buildPlatformInstruction(inputs, p, [
        ...globalPrevSummaries,
        ...prevSummaries,
      ]);
      const messages = [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: instruction },
      ];
      const content = await callOpenAI(
        key,
        messages,
        true,
        'gpt-4o-mini',
        temp
      );
      let obj = {};
      try {
        obj = JSON.parse(content);
      } catch {
        obj = {};
      }
      const Hook =
        typeof obj.Hook === 'string'
          ? obj.Hook
          : typeof obj.hook === 'string'
          ? obj.hook
          : '';
      const Body = Array.isArray(obj.Body)
        ? obj.Body
        : typeof obj.body === 'string'
        ? [obj.body]
        : Array.isArray(obj.body)
        ? obj.body
        : [];
      const AI_CTA = (
        typeof obj.CTA === 'string'
          ? obj.CTA
          : typeof obj.cta === 'string'
          ? obj.cta
          : ''
      ).trim();
      const CTA =
        AI_CTA ||
        autoCTA(inputs.contentGoal, inputs.tone, inputs.contentCategory, p);
      const ExecutionPlan = obj.ExecutionPlan || obj.execution_plan || '';
      outputs[p] = { Hook, Body, CTA, ExecutionPlan };
      const firstBody = Body.length ? Body[0] : '';
      const benefit = firstBody || Hook || '';
      prevSummaries.push({ platform: p, hook: Hook, body: firstBody, benefit });
    }

    // Generate hashtags and platform tips
    const hashtags = await generateHashtags(inputs);
    const platform_tips = generatePlatformTips(
      platforms,
      inputs.contentGoal,
      inputs.tone
    );

    // Add to outputs
    outputs.hashtags = hashtags;
    outputs.platform_tips = platform_tips;

    await db('campaigns').insert({
      user_id: user.id,
      form_inputs_json: JSON.stringify(inputs),
      generated_outputs_json: JSON.stringify(outputs),
    });
    await incContentDaily(user.id, 1);
    if (dev) {
      try {
        outputs.suggestions = outputs.suggestions || {};
        outputs.suggestions.__meta = Object.assign(
          {},
          outputs.suggestions.__meta || {},
          { traceId }
        );
      } catch {}
    }
    return outputs;
  } catch (e) {
    logger.error(
      {
        traceId,
        nodeEnv: process.env.NODE_ENV || null,
        hasKey: !!process.env.ADMIN_OPENAI_KEY,
        reason: 'openai_error',
        status: e.status || 500,
        openai: e.openai || null,
        message: e.message,
      },
      'OpenAI call failed'
    );
    if (dev && forceDev) {
      const fallback = buildDevOutputs(inputs, requestNonce);

      // Add hashtags and platform tips to error fallback
      const hashtags = await generateHashtags(inputs);
      const platform_tips = generatePlatformTips(
        inputs.platforms || [],
        inputs.contentGoal,
        inputs.tone
      );
      fallback.hashtags = hashtags;
      fallback.platform_tips = platform_tips;

      try {
        fallback.suggestions = fallback.suggestions || {};
        fallback.suggestions.__meta = Object.assign(
          {},
          fallback.suggestions.__meta || {},
          { traceId }
        );
      } catch {}
      await db('campaigns').insert({
        user_id: user.id,
        form_inputs_json: JSON.stringify(inputs),
        generated_outputs_json: JSON.stringify(fallback),
      });
      await incContentDaily(user.id, 1);
      return fallback;
    }
    const err = new Error(e.message || 'OpenAI call failed');
    err.code = 'OPENAI_CALL_FAILED';
    err.status = e.status || 500;
    throw err;
  }
}

function buildChatMessages(history, userMessage, styleSample) {
  const messages = [{ role: 'system', content: chatSystemPrompt() }];
  if (styleSample) {
    messages.push({
      role: 'system',
      content: `أمثلة حديثة من أسلوب المستخدم:\n- ${styleSample.join('\n- ')}`,
    });
  }
  for (const m of history) messages.push({ role: m.role, content: m.content });
  messages.push({ role: 'user', content: userMessage });
  return messages;
}

const { incChatDaily } = require('./subscription');

async function sendChatMessage(user, conversationId, userMessage) {
  const key = getGlobalKey();
  let convId = conversationId;
  if (!convId) {
    const title = (userMessage || '').slice(0, 40) || 'محادثة جديدة';
    const [newId] = await db('conversations').insert({
      user_id: user.id,
      title,
    });
    convId = newId;
  }
  const history = await db('messages')
    .whereIn('conversation_id', [convId])
    .orderBy('id', 'asc')
    .limit(25);
  const recentUserMsgs = history
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => m.content);
  const messages = buildChatMessages(
    history,
    userMessage,
    recentUserMsgs.length ? recentUserMsgs : null
  );
  try {
    const reply = await callOpenAI(key, messages, false);
    await db('messages').insert([
      { conversation_id: convId, role: 'user', content: userMessage },
      { conversation_id: convId, role: 'assistant', content: reply },
    ]);
    const updated = await db('messages')
      .where({ conversation_id: convId })
      .orderBy('id', 'asc');
    await incChatDaily(user.id, 1);
    return { conversationId: convId, messages: updated };
  } catch (e) {
    throw e;
  }
}

module.exports = { generateCampaignContent, sendChatMessage };
