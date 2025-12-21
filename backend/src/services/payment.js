const { db } = require('../db');

function addMonths(baseDate, months) {
  const d = new Date(baseDate.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

async function activateSubscription(userId, months = 1, provider = 'mock', txId = null) {
  const start = new Date();
  const end = addMonths(start, months);
  const payload = {
    user_id: userId,
    status: 'active',
    provider,
    transaction_id: txId,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  };
  await db('subscriptions').insert(payload);
  await db('users').where({ id: userId }).update({ has_used_trial: 1 });
  return payload;
}

async function expireSubscription(userId) {
  const last = await db('subscriptions').where({ user_id: userId }).orderBy('id', 'desc').first();
  if (!last) return null;
  const nowIso = new Date().toISOString();
  await db('subscriptions').where({ id: last.id }).update({ status: 'expired', end_at: nowIso });
  const updated = await db('subscriptions').where({ id: last.id }).first();
  return updated;
}

module.exports = { activateSubscription, expireSubscription };
