const express = require('express');
const Joi = require('joi');
const { db } = require('../db');

const router = express.Router();

router.post('/request', async (req, res) => {
  const schema = Joi.object({
    message: Joi.string().min(1).required(),
    email: Joi.string().min(1).required(),
    isNewUser: Joi.boolean().optional(),
    orderId: Joi.string().optional(),
    phone: Joi.string().optional(),
  });
  const { error, value } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({
        success: false,
        error: {
          code: 'INVALID_SUPPORT_REQUEST',
          message: 'البيانات غير مكتملة.',
        },
      });
  const m = String(value.message || '').trim();
  const e = String(value.email || '').trim();
  if (!m || !e)
    return res
      .status(400)
      .json({
        success: false,
        error: {
          code: 'INVALID_SUPPORT_REQUEST',
          message: 'البيانات غير مكتملة.',
        },
      });
  try {
    const payload = {
      user_id: req.user && req.user.id ? req.user.id : null,
      email: e || null,
      order_id: value.orderId || null,
      phone: value.phone || null,
      message: m,
      is_new_user: !!value.isNewUser,
      resolved: 0,
      created_at: new Date().toISOString(),
    };
    await db('support_requests').insert(payload);
    res.json({ success: true });
  } catch (e) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: 'SUPPORT_ERROR', message: 'تعذر إنشاء الطلب.' },
      });
  }
});

module.exports = router;
