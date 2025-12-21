const { db } = require('../db');

function dateKeyLocal(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isAdminByUser(user) {
  return (
    !!user?.is_admin ||
    (user?.email || '').toLowerCase() ===
      (process.env.ADMIN_EMAIL || 'alva@admin.com').toLowerCase()
  );
}

async function getLatestSubscription(userId) {
  const sub = await db('subscriptions')
    .where({ user_id: userId })
    .orderBy('id', 'desc')
    .first();
  return sub || null;
}

function isActiveSubscription(sub) {
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (!sub.end_at) return false;
  return new Date(sub.end_at).getTime() > Date.now();
}

async function getOrCreateDaily(userId) {
  const key = dateKeyLocal();
  let row = await db('usage_daily')
    .where({ user_id: userId, date_key: key })
    .first();
  if (!row) {
    try {
      const [id] = await db('usage_daily').insert({
        user_id: userId,
        date_key: key,
        chat_used: 0,
        content_used: 0,
      });
      row = await db('usage_daily').where({ id }).first();
    } catch (err) {
      // If unique constraint failed, it means another request created it.
      // We try to fetch it again.
      row = await db('usage_daily')
        .where({ user_id: userId, date_key: key })
        .first();
      if (!row) throw err; // Re-throw if it wasn't a conflict or still missing
    }
  }
  return row;
}

async function getUserUsage(userId) {
  const daily = await getOrCreateDaily(userId);
  return {
    dateKey: daily.date_key,
    chatDaily: Number(daily.chat_used || 0),
    contentDaily: Number(daily.content_used || 0),
  };
}

async function enforceChatTrial(user) {
  if (isAdminByUser(user)) return;
  const sub = await getLatestSubscription(user.id);
  if (isActiveSubscription(sub)) return;
  const urow = await db('users').where({ id: user.id }).first();
  if (!urow?.is_verified) {
    const err = new Error('الرجاء التحقق عبر رمز OTP لإكمال الاستخدام');
    err.code = 'OTP_REQUIRED';
    err.status = 403;
    throw err;
  }
  if (urow && urow.has_used_trial) {
    const err = new Error(
      'انتهى الاشتراك – الرجاء التجديد للاستمرار في استخدام المحادثة'
    );
    err.code = 'SUBSCRIPTION_REQUIRED';
    err.status = 403;
    throw err;
  }
  const { chatDaily } = await getUserUsage(user.id);
  const maxUser = Number(process.env.TRIAL_CHAT_USER_DAILY_MAX || 5);
  if (chatDaily >= maxUser) {
    await db('users')
      .where({ id: user.id, has_used_trial: 0 })
      .update({ has_used_trial: 1 });
    const err = new Error('وصلت لحد التجربة اليومية للمحادثة');
    err.code = 'TRIAL_LIMIT_REACHED';
    err.status = 403;
    throw err;
  }
}

async function enforceContentTrial(user) {
  if (isAdminByUser(user)) return;
  const sub = await getLatestSubscription(user.id);
  if (isActiveSubscription(sub)) return;
  const urow = await db('users').where({ id: user.id }).first();
  if (!urow?.is_verified) {
    const err = new Error('الرجاء التحقق عبر رمز OTP لإكمال الاستخدام');
    err.code = 'OTP_REQUIRED';
    err.status = 403;
    throw err;
  }
  if (urow && urow.has_used_trial) {
    const err = new Error(
      'انتهى الاشتراك – الرجاء التجديد للاستمرار في إنشاء المحتوى'
    );
    err.code = 'SUBSCRIPTION_REQUIRED';
    err.status = 403;
    throw err;
  }
  const { contentDaily } = await getUserUsage(user.id);
  const maxDaily = Number(process.env.TRIAL_CONTENT_DAILY_MAX || 3);
  if (contentDaily >= maxDaily) {
    await db('users')
      .where({ id: user.id, has_used_trial: 0 })
      .update({ has_used_trial: 1 });
    const err = new Error('وصلت لحد التجربة اليومية للمحتوى');
    err.code = 'TRIAL_LIMIT_REACHED';
    err.status = 403;
    throw err;
  }
}

async function incChatDaily(userId, delta = 1) {
  const daily = await getOrCreateDaily(userId);
  await db('usage_daily')
    .where({ id: daily.id })
    .update({ chat_used: daily.chat_used + delta });
}

async function incContentDaily(userId, delta = 1) {
  const daily = await getOrCreateDaily(userId);
  await db('usage_daily')
    .where({ id: daily.id })
    .update({ content_used: daily.content_used + delta });
}

async function getOrCreateSubscriberDaily(userId) {
  const key = dateKeyLocal();
  let row = await db('subscriber_usage_daily')
    .where({ user_id: userId, date_key: key })
    .first();
  if (!row) {
    try {
      const [id] = await db('subscriber_usage_daily').insert({
        user_id: userId,
        date_key: key,
        chat_used: 0,
        content_used: 0,
      });
      row = await db('subscriber_usage_daily').where({ id }).first();
    } catch (err) {
      row = await db('subscriber_usage_daily')
        .where({ user_id: userId, date_key: key })
        .first();
      if (!row) throw err;
    }
  }
  return row;
}

async function getSubscriberUsage(userId) {
  const daily = await getOrCreateSubscriberDaily(userId);
  return {
    dateKey: daily.date_key,
    chatUsed: Number(daily.chat_used || 0),
    contentUsed: Number(daily.content_used || 0),
  };
}

async function incSubscriberChatDaily(userId, delta = 1) {
  const daily = await getOrCreateSubscriberDaily(userId);
  await db('subscriber_usage_daily')
    .where({ id: daily.id })
    .update({ chat_used: daily.chat_used + delta });
}

async function incSubscriberContentDaily(userId, delta = 1) {
  const daily = await getOrCreateSubscriberDaily(userId);
  await db('subscriber_usage_daily')
    .where({ id: daily.id })
    .update({ content_used: daily.content_used + delta });
}

function fairConfig() {
  const enforce =
    (process.env.FAIR_ENFORCE || 'false').toLowerCase() === 'true';
  const chatWarn = Number(process.env.FAIR_CHAT_WARN || 200);
  const contentWarn = Number(process.env.FAIR_CONTENT_WARN || 50);
  const chatHard = Number(process.env.FAIR_CHAT_HARD || 500);
  const contentHard = Number(process.env.FAIR_CONTENT_HARD || 150);
  return { enforce, chatWarn, contentWarn, chatHard, contentHard };
}

async function checkSubscriberFairChat(userId) {
  const cfg = fairConfig();
  const usage = await getSubscriberUsage(userId);
  const warn = usage.chatUsed >= cfg.chatWarn;
  const throttled = cfg.enforce && usage.chatUsed >= cfg.chatHard;
  return { warn, throttled, usage };
}

async function checkSubscriberFairContent(userId) {
  const cfg = fairConfig();
  const usage = await getSubscriberUsage(userId);
  const warn = usage.contentUsed >= cfg.contentWarn;
  const throttled = cfg.enforce && usage.contentUsed >= cfg.contentHard;
  return { warn, throttled, usage };
}

async function getEntitlements(userId) {
  const user = await db('users').where({ id: userId }).first();
  const is_admin =
    !!user?.is_admin ||
    (user?.email || '').toLowerCase() ===
      (process.env.ADMIN_EMAIL || 'alva@admin.com').toLowerCase();
  const is_verified = !!user?.is_verified;
  const sub = await getLatestSubscription(userId);
  const has_active_subscription = isActiveSubscription(sub);
  const subscription_end_at = sub?.end_at || null;
  const has_used_trial = !!user?.has_used_trial;
  const usage = await getUserUsage(userId);
  const maxChat = Number(process.env.TRIAL_CHAT_USER_DAILY_MAX || 5);
  const maxContent = Number(process.env.TRIAL_CONTENT_DAILY_MAX || 3);
  const daily_usage = {
    dateKey: usage.dateKey,
    content_used_today: usage.contentDaily,
    chat_used_today: usage.chatDaily,
    content_remaining_today: Math.max(0, maxContent - usage.contentDaily),
    chat_remaining_today: Math.max(0, maxChat - usage.chatDaily),
  };
  const requires_renewal_block =
    !is_admin && is_verified && !has_active_subscription && has_used_trial;
  const can_use_trial_today =
    !is_admin &&
    is_verified &&
    !has_active_subscription &&
    !has_used_trial &&
    (daily_usage.content_remaining_today > 0 ||
      daily_usage.chat_remaining_today > 0);
  let subscriber_fair_usage = null;
  if (has_active_subscription) {
    const cfg = fairConfig();
    const subUse = await getSubscriberUsage(userId);
    const warn =
      subUse.chatUsed >= cfg.chatWarn || subUse.contentUsed >= cfg.contentWarn;
    const throttled =
      cfg.enforce &&
      (subUse.chatUsed >= cfg.chatHard ||
        subUse.contentUsed >= cfg.contentHard);
    subscriber_fair_usage = {
      dateKey: subUse.dateKey,
      chat_used: subUse.chatUsed,
      content_used: subUse.contentUsed,
      warn,
      throttled,
    };
  }
  return {
    is_admin,
    is_verified,
    has_active_subscription,
    subscription_end_at,
    has_used_trial,
    daily_usage,
    requires_renewal_block,
    can_use_trial_today,
    subscriber_fair_usage,
  };
}

module.exports = {
  isAdminByUser,
  getLatestSubscription,
  isActiveSubscription,
  getUserUsage,
  enforceChatTrial,
  enforceContentTrial,
  incChatDaily,
  incContentDaily,
  getEntitlements,
  incSubscriberChatDaily,
  incSubscriberContentDaily,
  checkSubscriberFairChat,
  checkSubscriberFairContent,
};
