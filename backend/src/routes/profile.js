const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const { db } = require('../db');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).first();
  if (!user) return res.status(404).json({ success: false, error: { code: 404, message: 'المستخدم غير موجود' } });
  res.json({ success: true, data: { user: { id: user.id, email: user.email, display_name: user.display_name, is_admin: !!user.is_admin } } });
});

const putSchema = Joi.object({
  displayName: Joi.string().min(2).max(60).optional(),
  email: Joi.string().email().optional(),
  currentPassword: Joi.string().min(8).optional(),
  newPassword: Joi.string().min(8).optional()
});

router.put('/', auth, async (req, res) => {
  const { error, value } = putSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 400, message: error.message } });
  const { displayName, email, currentPassword, newPassword } = value;

  const user = await db('users').where({ id: req.user.id }).first();
  if (!user) return res.status(404).json({ success: false, error: { code: 404, message: 'المستخدم غير موجود' } });

  const updates = {};

  if (typeof displayName === 'string') {
    updates.display_name = displayName;
  }

  const wantsEmailChange = typeof email === 'string' && email !== user.email;
  const wantsPasswordChange = typeof newPassword === 'string' && newPassword.length > 0;

  if (wantsEmailChange || wantsPasswordChange) {
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'يلزم إدخال كلمة المرور الحالية.' } });
    }
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'كلمة المرور الحالية غير صحيحة.' } });
    }
  }

  if (wantsEmailChange) {
    const exists = await db('users').where({ email }).whereNot({ id: user.id }).first();
    if (exists) {
      return res.status(409).json({ success: false, error: { code: 409, message: 'هذا البريد مستخدم من قبل حساب آخر.' } });
    }
    updates.email = email;
  }

  if (wantsPasswordChange) {
    const hash = await bcrypt.hash(newPassword, 10);
    updates.password_hash = hash;
  }

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: { user: { id: user.id, email: user.email, display_name: user.display_name, is_admin: !!user.is_admin } } });
  }

  await db('users').where({ id: user.id }).update(updates);
  const updated = await db('users').where({ id: user.id }).first();
  res.json({ success: true, data: { user: { id: updated.id, email: updated.email, display_name: updated.display_name, is_admin: !!updated.is_admin } } });
});

const { getEntitlements } = require('../services/subscription');

router.get('/entitlements', auth, async (req, res) => {
  try {
    const ent = await getEntitlements(req.user.id);
    res.json({ success: true, data: ent });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 500, message: 'تعذر تحميل الصلاحيات' } });
  }
});

module.exports = router;
