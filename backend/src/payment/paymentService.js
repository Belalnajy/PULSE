const { db } = require('../db');
const StubProvider = require('./providers/StubProvider');
const MoyasarProvider = require('./providers/MoyasarProvider');
const BaseProvider = require('./providers/BaseProvider');
const { activateSubscription } = require('../services/payment');

function getProvider() {
  if (process.env.MOYASAR_SECRET_KEY) {
    return new MoyasarProvider();
  }
  return new StubProvider();
}

async function createCheckoutSession(userId, planId, meta = {}) {
  const user = await db('users').where({ id: userId }).first();
  const provider = getProvider();
  const created = await provider.createCheckoutSession(user, planId, meta);
  const now = new Date().toISOString();
  await db('payments_sessions').insert({
    session_id: created.session_id,
    user_id: userId,
    plan_id: created.plan_id,
    status: 'pending',
    provider: created.provider,
    raw_meta_json: JSON.stringify(meta || {}),
    created_at: now,
    updated_at: now,
  });
  return created;
}

async function getCheckoutStatus(sessionId) {
  const row = await db('payments_sessions')
    .where({ session_id: sessionId })
    .first();
  if (!row) return null;
  return {
    status: row.status,
    session_id: row.session_id,
    plan_id: row.plan_id,
    provider: row.provider,
  };
}

async function handleWebhook(providerName, payload, headers) {
  const provider = getProvider();
  const res = await provider.handleWebhook(payload, headers);
  return res;
}

async function markSessionPaid(sessionId) {
  const row = await db('payments_sessions')
    .where({ session_id: sessionId })
    .first();
  if (!row) return null;
  const now = new Date().toISOString();
  await db('payments_sessions')
    .where({ session_id: sessionId })
    .update({ status: 'paid', updated_at: now });
  const updated = await db('payments_sessions')
    .where({ session_id: sessionId })
    .first();
  await activateSubscription(
    updated.user_id,
    1,
    updated.provider || 'stub',
    sessionId
  );
  return updated;
}

async function markSessionFailed(sessionId) {
  const row = await db('payments_sessions')
    .where({ session_id: sessionId })
    .first();
  if (!row) return null;
  const now = new Date().toISOString();
  await db('payments_sessions')
    .where({ session_id: sessionId })
    .update({ status: 'failed', updated_at: now });
  const updated = await db('payments_sessions')
    .where({ session_id: sessionId })
    .first();
  return updated;
}

module.exports = {
  createCheckoutSession,
  getCheckoutStatus,
  handleWebhook,
  markSessionPaid,
  markSessionFailed,
};
