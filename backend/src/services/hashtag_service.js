const { logger } = require('../utils/logger');

/**
 * Hashtag Research Service
 * Provides trending hashtag discovery, categorization, and platform-specific recommendations
 */

// Platform-specific hashtag data
const PLATFORM_HASHTAGS = {
  TikTok: {
    general: ['#fyp', '#foryou', '#viral', '#trending', '#arabtiktok', '#arab'],
    arabic: ['#اكسبلور', '#فوريو', '#ترند', '#تيكتوك', '#عربي'],
  },
  Instagram: {
    general: [
      '#instagood',
      '#photooftheday',
      '#explorepage',
      '#viral',
      '#trending',
    ],
    arabic: ['#انستقرام', '#اكسبلور', '#ريلز', '#لايك', '#فولو', '#تصوير'],
  },
  X: {
    general: ['#trending', '#viral', '#news'],
    arabic: ['#عاجل', '#أخبار', '#ترند'],
  },
  Snapchat: {
    general: ['#snapchat', '#snap', '#story'],
    arabic: ['#سناب', '#سنابات', '#قصة'],
  },
  WhatsApp: {
    general: ['#whatsapp', '#message'],
    arabic: ['#واتساب', '#رسالة'],
  },
};

// Industry-specific hashtags (Arabic marketing focus)
const INDUSTRY_HASHTAGS = {
  marketing: {
    arabic: [
      '#تسويق',
      '#تسويق_الكتروني',
      '#اعلانات',
      '#سوشيال_ميديا',
      '#محتوى',
    ],
    english: [
      '#marketing',
      '#digitalmarketing',
      '#socialmedia',
      '#contentmarketing',
      '#ads',
    ],
  },
  ecommerce: {
    arabic: ['#تسوق', '#تسوق_اونلاين', '#عروض', '#تخفيضات', '#منتجات'],
    english: ['#ecommerce', '#shopping', '#onlineshopping', '#deals', '#sale'],
  },
  beauty: {
    arabic: ['#جمال', '#عناية', '#مكياج', '#بشرة', '#تجميل'],
    english: ['#beauty', '#skincare', '#makeup', '#cosmetics', '#beautycare'],
  },
  food: {
    arabic: ['#طبخ', '#وصفات', '#طعام', '#مطبخ', '#اكل'],
    english: ['#food', '#cooking', '#recipes', '#foodie', '#yummy'],
  },
  fashion: {
    arabic: ['#موضة', '#أزياء', '#ستايل', '#ملابس', '#فاشن'],
    english: ['#fashion', '#style', '#ootd', '#fashionista', '#clothing'],
  },
  tech: {
    arabic: ['#تقنية', '#تكنولوجيا', '#برمجة', '#ذكاء_اصطناعي', '#تطبيقات'],
    english: ['#tech', '#technology', '#ai', '#innovation', '#digital'],
  },
  fitness: {
    arabic: ['#رياضة', '#لياقة', '#صحة', '#تمارين', '#فتنس'],
    english: ['#fitness', '#workout', '#health', '#gym', '#exercise'],
  },
  travel: {
    arabic: ['#سفر', '#سياحة', '#رحلات', '#مغامرات', '#استكشاف'],
    english: ['#travel', '#tourism', '#adventure', '#explore', '#wanderlust'],
  },
};

// Regional hashtags (Middle East focus)
const REGIONAL_HASHTAGS = {
  arabic: [
    '#مصر',
    '#القاهرة',
    '#إسكندرية',
    '#الدلتا',
    '#الصعيد',
    '#السعودية',
    '#الإمارات',
    '#الكويت',
    '#الأردن',
  ],
  english: [
    '#Egypt',
    '#Cairo',
    '#Alexandria',
    '#UAE',
    '#Dubai',
    '#SaudiArabia',
  ],
};

// Trending seasonal hashtags (December 2024)
const SEASONAL_HASHTAGS = {
  arabic: ['#شتاء', '#ديسمبر', '#نهاية_السنة', '#عروض_الشتاء', '#سهرة_تايم'],
  english: ['#winter2024', '#december', '#yearend', '#wintersale', '#holidays'],
};

/**
 * Search for trending hashtags using SerpAPI
 */
async function searchTrendingHashtags(idea, industry) {
  const apiKey = process.env.SEARCH_API_KEY;
  const provider = (process.env.SEARCH_API_PROVIDER || 'serpapi').toLowerCase();

  if (!apiKey || apiKey === 'your_api_key_here') {
    logger.warn(
      'SEARCH_API_KEY not configured, skipping real-time hashtag search'
    );
    return { trending: [], searched: false };
  }

  try {
    const searchQueries = [
      `trending hashtags ${industry} arabic 2024`,
      `${idea} hashtags instagram tiktok`,
      `popular arabic hashtags ${industry}`,
    ];

    const allTrendingHashtags = [];

    for (const query of searchQueries.slice(0, 2)) {
      // Limit to 2 queries to save API calls
      try {
        let url;
        if (provider === 'serpapi') {
          url = `https://serpapi.com/search.json?q=${encodeURIComponent(
            query
          )}&api_key=${apiKey}&num=10`;
        } else {
          logger.warn(
            `Unsupported search provider: ${provider}, skipping search`
          );
          continue;
        }

        const response = await fetch(url);
        if (!response.ok) {
          logger.warn(
            { status: response.status, query },
            'Search API request failed'
          );
          continue;
        }

        const data = await response.json();

        // Extract hashtags from search results
        const results = data.organic_results || [];
        for (const result of results.slice(0, 5)) {
          const text = `${result.title || ''} ${result.snippet || ''}`;
          const hashtagMatches = text.match(/#[\u0600-\u06FFa-zA-Z0-9_]+/g);
          if (hashtagMatches) {
            allTrendingHashtags.push(...hashtagMatches);
          }
        }
      } catch (error) {
        logger.error(
          { error: error.message, query },
          'Error in individual search query'
        );
      }
    }

    // Deduplicate and clean
    const uniqueHashtags = [...new Set(allTrendingHashtags)]
      .filter((tag) => tag.length > 2 && tag.length < 50)
      .slice(0, 10);

    logger.info(
      { count: uniqueHashtags.length, industry },
      'Found trending hashtags via search'
    );

    return {
      trending: uniqueHashtags,
      searched: true,
    };
  } catch (error) {
    logger.error(
      { error: error.message },
      'Error searching for trending hashtags'
    );
    return { trending: [], searched: false };
  }
}

/**
 * Detect industry/niche from content idea
 */
function detectIndustry(idea) {
  const lowerIdea = idea.toLowerCase();

  if (lowerIdea.match(/جمال|عناية|مكياج|بشرة|تجميل|beauty|skincare|makeup/))
    return 'beauty';
  if (lowerIdea.match(/طبخ|وصفات|طعام|مطبخ|اكل|food|cooking|recipe/))
    return 'food';
  if (lowerIdea.match(/موضة|أزياء|ملابس|fashion|style|clothing/))
    return 'fashion';
  if (lowerIdea.match(/تقنية|تكنولوجيا|برمجة|tech|technology|ai|app/))
    return 'tech';
  if (lowerIdea.match(/رياضة|لياقة|صحة|تمارين|fitness|workout|health|gym/))
    return 'fitness';
  if (lowerIdea.match(/سفر|سياحة|رحلات|travel|tourism|adventure/))
    return 'travel';
  if (lowerIdea.match(/تسوق|منتج|بيع|ecommerce|shopping|product|sale/))
    return 'ecommerce';

  return 'marketing'; // default
}

/**
 * Generate hashtags based on content inputs
 */
async function generateHashtags(inputs) {
  try {
    const { idea, platforms = [], contentGoal, tone } = inputs;
    const industry = detectIndustry(idea);

    // Collect hashtags from different sources
    const hashtags = {
      high_volume: [],
      medium_volume: [],
      niche: [],
      trending: [],
      branded: [],
    };

    // 1. Add platform-specific hashtags
    for (const platform of platforms) {
      const platformData = PLATFORM_HASHTAGS[platform];
      if (platformData) {
        hashtags.high_volume.push(...platformData.general.slice(0, 2));
        hashtags.medium_volume.push(...platformData.arabic.slice(0, 2));
      }
    }

    // 2. Add industry-specific hashtags
    const industryData = INDUSTRY_HASHTAGS[industry];
    if (industryData) {
      hashtags.medium_volume.push(...industryData.arabic.slice(0, 3));
      hashtags.niche.push(...industryData.english.slice(0, 3));
    }

    // 3. Add regional hashtags
    hashtags.medium_volume.push(...REGIONAL_HASHTAGS.arabic.slice(0, 2));
    hashtags.niche.push(...REGIONAL_HASHTAGS.english.slice(0, 2));

    // 4. Search for real-time trending hashtags using SerpAPI
    const searchResult = await searchTrendingHashtags(idea, industry);
    if (searchResult.searched && searchResult.trending.length > 0) {
      hashtags.trending.push(...searchResult.trending);
      logger.info(
        { count: searchResult.trending.length },
        'Added trending hashtags from SerpAPI search'
      );
    } else {
      // Fallback to seasonal hashtags if search fails or is disabled
      hashtags.trending.push(...SEASONAL_HASHTAGS.arabic.slice(0, 2));
      hashtags.trending.push(...SEASONAL_HASHTAGS.english.slice(0, 1));
    }

    // 5. Add goal-specific hashtags
    if (contentGoal === 'sell') {
      hashtags.niche.push('#عروض', '#تخفيضات', '#sale', '#deals');
    } else if (contentGoal === 'traffic') {
      hashtags.niche.push('#اكتشف', '#جديد', '#explore', '#new');
    } else if (contentGoal === 'trust') {
      hashtags.niche.push('#ثقة', '#جودة', '#quality', '#trust');
    }

    // 6. Generate branded hashtag suggestion
    hashtags.branded.push('#اسم_البراند', '#YourBrand');

    // Remove duplicates and format
    const cleanHashtags = {};
    for (const [category, tags] of Object.entries(hashtags)) {
      cleanHashtags[category] = [...new Set(tags)].filter(Boolean);
    }

    // Add metadata
    const result = {
      ...cleanHashtags,
      platform_optimized: generatePlatformOptimizedHashtags(
        platforms,
        cleanHashtags
      ),
      _meta: {
        industry,
        total_count: Object.values(cleanHashtags).flat().length,
        generated_at: new Date().toISOString(),
        search_used: searchResult.searched,
      },
    };

    logger.info(
      {
        industry,
        platforms,
        totalHashtags: result._meta.total_count,
        searchUsed: searchResult.searched,
      },
      'Generated hashtags'
    );
    return result;
  } catch (error) {
    logger.error({ error: error.message }, 'Error generating hashtags');
    return getFallbackHashtags();
  }
}

/**
 * Generate platform-optimized hashtag sets
 */
function generatePlatformOptimizedHashtags(platforms, allHashtags) {
  const optimized = {};

  for (const platform of platforms) {
    const platformLower = platform.toLowerCase();
    let count = 15; // default

    // Platform-specific hashtag count recommendations
    if (platformLower === 'instagram') count = 20;
    else if (platformLower === 'tiktok') count = 5;
    else if (platformLower === 'x') count = 3;
    else if (platformLower === 'snapchat') count = 5;
    else if (platformLower === 'whatsapp') count = 3;

    // Mix hashtags from different categories
    const selected = [
      ...allHashtags.high_volume.slice(0, 2),
      ...allHashtags.medium_volume.slice(0, Math.ceil(count * 0.3)),
      ...allHashtags.niche.slice(0, Math.ceil(count * 0.4)),
      ...allHashtags.trending.slice(0, Math.ceil(count * 0.2)),
      ...allHashtags.branded.slice(0, 1),
    ].slice(0, count);

    optimized[platform] = [...new Set(selected)];
  }

  return optimized;
}

/**
 * Fallback hashtags when service fails
 */
function getFallbackHashtags() {
  return {
    high_volume: ['#viral', '#trending', '#اكسبلور'],
    medium_volume: ['#محتوى', '#تسويق', '#marketing'],
    niche: ['#جديد', '#عروض', '#new'],
    trending: ['#2024', '#ديسمبر'],
    branded: ['#اسم_البراند'],
    platform_optimized: {},
    _meta: {
      industry: 'general',
      total_count: 11,
      fallback: true,
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Generate platform-specific marketing tips
 */
function generatePlatformTips(platforms, contentGoal, tone) {
  const tips = {};

  for (const platform of platforms) {
    const platformLower = platform.toLowerCase();

    if (platformLower === 'tiktok') {
      tips.TikTok = {
        best_time: 'أفضل وقت للنشر: 7-10 مساءً (توقيت القاهرة)',
        format: 'فيديو سريع 15-60 ثانية، Hook قوي في أول 3 ثوانٍ',
        engagement:
          'استخدم الموسيقى الترندية، أضف نصوص على الفيديو، تفاعل مع التعليقات',
        caption_length: 'وصف مختصر 100-150 حرف',
        visual: 'فيديو عمودي 9:16، إضاءة كويسة، حركة سريعة',
      };
    } else if (platformLower === 'instagram') {
      tips.Instagram = {
        best_time: 'أفضل وقت للنشر: 6-10 مساءً، أيام الخميس والجمعة',
        format:
          'Reels (15-90 ثانية) للوصول الأعلى، أو منشور Carousel للمحتوى التعليمي',
        engagement:
          'استخدم 15-20 هاشتاق، شارك في Stories، رد على الرسائل بسرعة',
        caption_length: 'وصف متوسط 150-300 حرف، أضف سؤال في النهاية',
        visual: 'صور عالية الجودة، فلاتر خفيفة، تصميم متناسق مع البروفايل',
      };
    } else if (platformLower === 'x') {
      tips.X = {
        best_time: 'أفضل وقت للنشر: 9-11 صباحاً، 6-8 مساءً',
        format: 'تغريدة مختصرة ومباشرة، أو Thread للمحتوى التفصيلي',
        engagement:
          'استخدم 1-3 هاشتاقات بس، تفاعل مع المنشنات، أعد التغريد للمحتوى القَيّم',
        caption_length: 'نص قصير 100-280 حرف، واضح ومباشر',
        visual: 'صورة أو فيديو قصير (اختياري)، نسبة 16:9 للصور',
      };
    } else if (platformLower === 'snapchat') {
      tips.Snapchat = {
        best_time: 'أفضل وقت للنشر: 7-9 مساءً، عطلة نهاية الأسبوع',
        format: 'سنابات قصيرة 10-15 ثانية، محتوى خفيف وسريع',
        engagement:
          'استخدم الفلاتر والملصقات، أضف استفتاءات، شارك محتوى من وراء الكواليس',
        caption_length: 'نص قصير جداً 50-100 حرف',
        visual: 'فيديو عمودي، إضاءة طبيعية، محتوى عفوي وحقيقي',
      };
    } else if (platformLower === 'whatsapp') {
      tips.WhatsApp = {
        best_time: 'أفضل وقت للإرسال: 10-12 صباحاً، 8-10 مساءً',
        format: 'رسالة شخصية مختصرة، أو Status للمحتوى العام',
        engagement: 'خليك قريب وشخصي، استخدم الإيموجي باعتدال، اطلب رد فعل',
        caption_length: 'رسالة قصيرة 100-200 حرف',
        visual: 'صورة أو فيديو قصير، جودة متوسطة للتحميل السريع',
      };
    }
  }

  return tips;
}

module.exports = {
  generateHashtags,
  generatePlatformTips,
  detectIndustry,
};
