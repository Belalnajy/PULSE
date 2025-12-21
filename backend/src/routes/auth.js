const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const { sendOtpEmail } = require('../services/email');

function generateOtp() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

const regSchema = Joi.object({
  displayName: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
});
router.post(
  '/register',
  rateLimit({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    const { error, value } = regSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const { displayName, email, phone, password } = value;
    const existing = await db('users').where({ email }).first();
    if (existing)
      return res.status(409).json({
        success: false,
        error: { code: 409, message: 'البريد مستخدم مسبقًا' },
      });
    const phoneUsed = await db('users').where({ phone }).first();
    if (phoneUsed)
      return res.status(409).json({
        success: false,
        error: { code: 409, message: 'رقم الجوال مستخدم مسبقًا' },
      });
    const password_hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otp_hash = await bcrypt.hash(otp, 10);
    const expires = new Date(
      Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000
    ).toISOString();

    const [userId] = await db('users').insert({
      email,
      password_hash,
      display_name: displayName,
      phone,
      is_verified: 0,
      otp_code: otp_hash,
      otp_expires_at: expires,
    });

    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      data: {
        verificationRequired: true,
        user: { id: userId, email, display_name: displayName, phone },
      },
    });
  }
);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});
router.post(
  '/login',
  rateLimit({ windowMs: 60000, max: 20 }),
  async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const { email, password } = value;
    const user = await db('users').where({ email }).first();
    if (!user)
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'بيانات دخول غير صحيحة' },
      });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'بيانات دخول غير صحيحة' },
      });

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNVERIFIED',
          message: 'الرجاء تفعيل حسابك عبر رمز OTP المرسل لبريدك',
        },
        requireVerification: true,
      });
    }

    const token = jwt.sign(
      { userId: user.id, is_admin: !!user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          is_admin: !!user.is_admin,
        },
        mustChangePassword: !!user.force_password_change,
      },
    });
  }
);

const { auth } = require('../middleware/auth');
const { getUserUsage } = require('../services/subscription');

router.get('/me', auth, async (req, res) => {
  const sub = await db('subscriptions')
    .where({ user_id: req.user.id })
    .orderBy('id', 'desc')
    .first();
  let trialDaily = null;
  let subscriptionRequired = false;
  const isAdmin =
    !!req.user.is_admin ||
    req.user.email === (process.env.ADMIN_EMAIL || 'Alva@admin.com');
  const active =
    sub &&
    sub.status === 'active' &&
    sub.end_at &&
    new Date(sub.end_at).getTime() > Date.now();
  if (!isAdmin && !active) {
    const u = await db('users').where({ id: req.user.id }).first();
    const usedTrial = !!u?.has_used_trial;
    if (usedTrial) {
      subscriptionRequired = true;
      trialDaily = null;
    } else {
      const maxChat = Number(process.env.TRIAL_CHAT_USER_DAILY_MAX || 5);
      const maxContent = Number(process.env.TRIAL_CONTENT_DAILY_MAX || 3);
      const usage = await getUserUsage(req.user.id);
      const chatLeft = Math.max(0, maxChat - usage.chatDaily);
      const contentLeft = Math.max(0, maxContent - usage.contentDaily);
      trialDaily = {
        chatLeft,
        contentLeft,
        chatMax: maxChat,
        contentMax: maxContent,
      };
    }
  }
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        display_name: req.user.display_name,
        is_admin: !!req.user.is_admin,
        force_password_change: !!req.user.force_password_change,
        is_verified: !!req.user.is_verified,
      },
      subscription: sub || null,
      trialDaily,
      subscriptionRequired,
      mustChangePassword: !!req.user.force_password_change,
    },
  });
});

const forceSchema = Joi.object({ newPassword: Joi.string().min(8).required() });
router.post('/force-change-password', auth, async (req, res) => {
  const { error, value } = forceSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, error: { code: 400, message: error.message } });
  try {
    const me = await db('users').where({ id: req.user.id }).first();
    if (!me)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'المستخدم غير موجود' },
      });
    if (!me.force_password_change) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_FORCED',
          message: 'لا يوجد طلب لتغيير كلمة المرور.',
        },
      });
    }
    const hash = await bcrypt.hash(value.newPassword, 10);
    await db('users')
      .where({ id: me.id })
      .update({ password_hash: hash, force_password_change: 0 });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

const resendSchema = Joi.object({ email: Joi.string().email().required() });
router.post(
  '/request-otp',
  rateLimit({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    const { error, value } = resendSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ email: value.email }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'المستخدم غير موجود' },
      });
    if (user.is_verified)
      return res.json({ success: true, data: { alreadyVerified: true } });

    // Cooldown check
    if (user.otp_expires_at) {
      const lastSent =
        new Date(user.otp_expires_at).getTime() -
        (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000;
      const now = Date.now();
      const diff = (now - lastSent) / 1000;
      const cooldown = process.env.OTP_RESEND_COOLDOWN_SECONDS || 60;
      if (diff < cooldown) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'COOLDOWN',
            message: `الرجاء الانتظار ${Math.ceil(
              cooldown - diff
            )} ثانية قبل إعادة الطلب`,
            secondsLeft: Math.ceil(cooldown - diff),
          },
        });
      }
    }

    const otp = generateOtp();
    const otp_hash = await bcrypt.hash(otp, 10);
    const expires = new Date(
      Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000
    ).toISOString();

    await db('users')
      .where({ id: user.id })
      .update({ otp_code: otp_hash, otp_expires_at: expires });

    await sendOtpEmail(user.email, otp);

    res.json({ success: true, data: { sent: true } });
  }
);

const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required(),
});
router.post(
  '/verify-otp',
  rateLimit({ windowMs: 60000, max: 10 }),
  async (req, res) => {
    const { error, value } = verifySchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ email: value.email }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'المستخدم غير موجود' },
      });
    if (user.is_verified)
      return res.json({ success: true, data: { alreadyVerified: true } });
    const notExpired =
      user.otp_expires_at &&
      new Date(user.otp_expires_at).getTime() > Date.now();

    const otpOk = user.otp_code
      ? await bcrypt.compare(value.code, user.otp_code)
      : false;

    if (!notExpired || !otpOk) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
        },
      });
    }

    await db('users')
      .where({ id: user.id })
      .update({ is_verified: 1, otp_code: null, otp_expires_at: null });

    const token = jwt.sign(
      { userId: user.id, is_admin: !!user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          is_admin: !!user.is_admin,
        },
      },
    });
  }
);

module.exports = router;
