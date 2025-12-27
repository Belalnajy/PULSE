const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const {
  activateSubscription,
  expireSubscription,
} = require('../services/payment');
const { sendExpiryReminderEmail } = require('../services/email');

const router = express.Router();

function adminOnly(req, res, next) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'Alva@admin.com';
    if (!req.user || req.user.email !== adminEmail) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_ADMIN', message: 'Admin access only' },
      });
    }
    next();
  } catch (e) {
    return res.status(403).json({
      success: false,
      error: { code: 'NOT_ADMIN', message: 'Admin access only' },
    });
  }
}

router.use(auth);
router.use(adminOnly);

router.get('/users', async (req, res) => {
  try {
    const users = await db('users').select(
      'id',
      'email',
      'display_name',
      'phone',
      'created_at'
    );
    const result = [];
    for (const u of users) {
      const sub = await db('subscriptions')
        .where({ user_id: u.id })
        .orderBy('id', 'desc')
        .first();
      let subscriptionStatus = 'none';
      let endAt = null;
      let remainingDays = null;
      if (sub) {
        subscriptionStatus = sub.status || 'none';
        endAt = sub.end_at || null;
        if (endAt) {
          remainingDays = Math.floor(
            (new Date(endAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
          );
        }
      }
      const openSupport = await db('support_requests')
        .where({ resolved: 0 })
        .andWhere(function () {
          this.where('user_id', u.id).orWhere(function () {
            this.whereNotNull('email').andWhere('email', u.email);
          });
        })
        .orderBy('created_at', 'desc')
        .first();
      result.push({
        id: u.id,
        name: u.display_name || null,
        email: u.email,
        phone: u.phone || null,
        subscriptionStatus,
        endAt,
        remainingDays: Number.isFinite(remainingDays) ? remainingDays : null,
        hasOpenSupport: !!openSupport,
        lastSupportAt: openSupport ? openSupport.created_at : null,
        createdAt: u.created_at,
      });
    }
    res.json({ success: true, data: { users: result } });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin users query failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

const idSchema = Joi.object({
  userId: Joi.number().integer().min(1).required(),
});

router.post('/subscriptions/activate', async (req, res) => {
  try {
    const { error, value } = idSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ id: value.userId }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found' },
      });
    const sub = await activateSubscription(
      user.id,
      1,
      'admin',
      `ADMIN_${Date.now()}`
    );
    logger.info({ userId: user.id }, 'Admin subscription activated');
    res.json({ success: true, data: { subscription: sub } });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin activate failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

router.post('/subscriptions/deactivate', async (req, res) => {
  try {
    const { error, value } = idSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ id: value.userId }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found' },
      });
    const updated = await expireSubscription(user.id);
    logger.info({ userId: user.id }, 'Admin subscription deactivated');
    res.json({ success: true, data: { subscription: updated } });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin deactivate failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

router.post('/users/reset-password', async (req, res) => {
  try {
    const { error, value } = idSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ id: value.userId }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found' },
      });

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 12; i++)
      pwd += chars[Math.floor(Math.random() * chars.length)];

    const hash = await bcrypt.hash(pwd, 10);
    await db('users')
      .where({ id: user.id })
      .update({ password_hash: hash, force_password_change: 1 });
    logger.info({ userId: user.id }, 'Admin password reset');
    res.json({ success: true, userId: user.id, newPassword: pwd });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin reset-password failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

router.post('/users/delete', async (req, res) => {
  try {
    const { error, value } = idSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    const user = await db('users').where({ id: value.userId }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found' },
      });

    const adminEmail = process.env.ADMIN_EMAIL || 'Alva@admin.com';
    if (user.email === adminEmail || user.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 403, message: 'Cannot delete admin account' },
      });
    }

    await db('users').where({ id: user.id }).del();
    logger.info({ userId: user.id }, 'Admin deleted user');
    res.json({ success: true, data: { deleted: true, userId: user.id } });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin delete-user failed');
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

router.get('/support/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Invalid userId' },
      });
    }
    const user = await db('users').where({ id: userId }).first();
    if (!user)
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود.' },
      });
    const rows = await db('support_requests')
      .where(function () {
        this.where('user_id', user.id).orWhere(function () {
          this.whereNotNull('email').andWhere('email', user.email);
        });
      })
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'message',
        'email',
        'order_id',
        'phone',
        'is_new_user',
        'resolved',
        'created_at'
      );
    res.json({ success: true, data: { requests: rows } });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SUPPORT_ERROR',
        message: 'Unable to load support requests.',
      },
    });
  }
});

router.patch('/support/:id/close', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Invalid request id' },
      });
    }
    const existing = await db('support_requests').where({ id }).first();
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Support request not found' },
      });
    }
    await db('support_requests').where({ id }).update({ resolved: 1 });
    return res.json({ success: true });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin support close failed');
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

router.get('/support-closed', async (req, res) => {
  try {
    const rows = await db('support_requests as sr')
      .leftJoin('users as u', 'u.id', 'sr.user_id')
      .where('sr.resolved', 1)
      .orderBy('sr.created_at', 'desc')
      .select(
        'sr.id',
        'sr.email',
        'sr.phone',
        'sr.message',
        'sr.is_new_user',
        'sr.resolved',
        'sr.created_at',
        'u.display_name as user_name'
      );
    return res.json({ success: true, data: { requests: rows } });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin support-closed failed');
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

// Send notification email to a user (subscription reminder)
const notifySchema = Joi.object({
  userId: Joi.number().integer().min(1).required(),
  type: Joi.string()
    .valid('expiry_reminder', 'welcome', 'custom')
    .default('expiry_reminder'),
  customMessage: Joi.string().max(1000).optional(),
});

router.post('/users/send-notification', async (req, res) => {
  try {
    const { error, value } = notifySchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    }

    const user = await db('users').where({ id: value.userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'User not found' },
      });
    }

    // Get user's subscription info
    const sub = await db('subscriptions')
      .where({ user_id: user.id })
      .orderBy('id', 'desc')
      .first();

    let daysLeft = null;
    let expiryDate = null;

    if (sub && sub.end_at) {
      expiryDate = sub.end_at;
      daysLeft = Math.ceil(
        (new Date(sub.end_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (daysLeft < 0) daysLeft = 0;
    }

    const userName = user.display_name || user.email.split('@')[0];

    if (value.type === 'expiry_reminder') {
      // Send expiry reminder email
      if (!expiryDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_SUBSCRIPTION',
            message: 'المستخدم ليس لديه اشتراك نشط',
          },
        });
      }

      const emailResult = await sendExpiryReminderEmail(
        user.email,
        userName,
        daysLeft || 0,
        expiryDate
      );

      if (emailResult.success) {
        // Update last reminder sent
        await db('subscriptions')
          .where({ id: sub.id })
          .update({ last_reminder_sent: db.fn.now() });

        logger.info(
          { userId: user.id, type: 'expiry_reminder' },
          'Admin sent notification'
        );
        return res.json({
          success: true,
          data: {
            sent: true,
            email: user.email,
            type: 'expiry_reminder',
            daysLeft,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: {
            code: 'EMAIL_FAILED',
            message: 'فشل في إرسال البريد الإلكتروني',
          },
        });
      }
    }

    // For other types, return success (can be expanded later)
    return res.json({
      success: true,
      data: { sent: true, email: user.email, type: value.type },
    });
  } catch (e) {
    logger.error({ err: e.message }, 'Admin send-notification failed');
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_ERROR',
        message: 'Unable to complete admin action.',
      },
    });
  }
});

module.exports = router;
