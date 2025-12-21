const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const { activateSubscription } = require('../services/payment');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const mockSchema = Joi.object({ months: Joi.number().integer().min(1).max(12).default(1) });
router.post('/mock/confirm', rateLimit({ windowMs: 60000, max: 10 }), auth, async (req, res) => {
  const { error, value } = mockSchema.validate(req.body || {});
  if (error) return res.status(400).json({ success: false, error: { code: 400, message: error.message } });
  try {
    const sub = await activateSubscription(req.user.id, value.months, 'mock', `MOCK_${Date.now()}`);
    res.json({ success: true, data: { subscription: sub } });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ success: false, error: { code: status, message: e.message || 'فشل تفعيل الاشتراك' } });
  }
});

router.post('/prepare', rateLimit({ windowMs: 60000, max: 20 }), auth, async (req, res) => {
  try {
    res.json({ success: true, data: { message: 'سيتم ربط بوابة الدفع لاحقًا' } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 500, message: 'تعذر تجهيز عملية الدفع' } });
  }
});

module.exports = router;
