const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const { enforceChatTrial, isActiveSubscription, getLatestSubscription, checkSubscriberFairChat, incSubscriberChatDaily } = require('../services/subscription');
const { db } = require('../db');
const { sendChatMessage } = require('../services/ai');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/conversations', auth, async (req, res) => {
  const rows = await db('conversations').where({ user_id: req.user.id }).orderBy('id', 'desc');
  res.json({ success: true, data: { conversations: rows } });
});

router.get('/conversations/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const conv = await db('conversations').where({ id, user_id: req.user.id }).first();
  if (!conv) return res.status(404).json({ success: false, error: { code: 404, message: 'المحادثة غير موجودة' } });
  const msgs = await db('messages').where({ conversation_id: id }).orderBy('id', 'asc');
  res.json({ success: true, data: { conversation: conv, messages: msgs } });
});

router.delete('/conversations/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const conv = await db('conversations').where({ id, user_id: req.user.id }).first();
  if (!conv) return res.status(404).json({ success: false, error: { code: 404, message: 'المحادثة غير موجودة' } });
  await db('conversations').where({ id }).del();
  res.json({ success: true, data: { deleted: true } });
});

const sendSchema = Joi.object({ conversationId: Joi.number().allow(null), message: Joi.string().min(1).required() });
router.post('/send-message', rateLimit({ windowMs: 60000, max: 30 }), auth, async (req, res) => {
  const { error, value } = sendSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 400, message: error.message } });
  try {
    const sub = await getLatestSubscription(req.user.id);
    const active = isActiveSubscription(sub);
    if (active) {
      const fair = await checkSubscriberFairChat(req.user.id);
      if (fair.throttled) {
        const err = new Error('تم تفعيل إيقاف مؤقت بسبب سياسة الاستخدام العادل');
        err.code = 'FAIR_USAGE_THROTTLED';
        err.status = 429;
        throw err;
      }
    } else {
      await enforceChatTrial(req.user);
    }
    const result = await sendChatMessage(req.user, value.conversationId, value.message);
    if (active) {
      await incSubscriberChatDaily(req.user.id, 1);
      const fair = await checkSubscriberFairChat(req.user.id);
      return res.json({ success: true, data: { conversationId: result.conversationId, messages: result.messages, fair_usage_warning: fair.warn ? { level: 'warn' } : null } });
    }
    res.json({ success: true, data: { conversationId: result.conversationId, messages: result.messages } });
  } catch (e) {
    if (e.code === 'SUBSCRIPTION_REQUIRED') return res.status(403).json({ success: false, error: { code: 'SUBSCRIPTION_REQUIRED', message: e.message } });
    if (e.code === 'TRIAL_LIMIT_REACHED') return res.status(403).json({ success: false, error: { code: 'TRIAL_LIMIT_REACHED', message: e.message } });
    if (e.code === 'OTP_REQUIRED') return res.status(403).json({ success: false, error: { code: 'OTP_REQUIRED', message: e.message } });
    if (e.code === 'FAIR_USAGE_THROTTLED') return res.status(429).json({ success: false, error: { code: 'FAIR_USAGE_THROTTLED', message: e.message } });
    res.status(500).json({ success: false, error: { code: 500, message: 'فشل إرسال الرسالة' } });
  }
});

module.exports = router;
