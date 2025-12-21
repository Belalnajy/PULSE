const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { db } = require('../db');

const router = express.Router();

// Get all active plans (public)
router.get('/', rateLimit({ windowMs: 60000, max: 30 }), async (req, res) => {
  try {
    const plans = await db('subscription_plans')
      .where({ is_active: true })
      .select(
        'plan_id',
        'name',
        'price_cents',
        'currency',
        'duration_months',
        'description'
      )
      .orderBy('price_cents', 'asc');

    res.json({ success: true, data: plans });
  } catch (e) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: 500, message: 'فشل في جلب الباقات' },
      });
  }
});

// Get specific plan (public)
router.get(
  '/:plan_id',
  rateLimit({ windowMs: 60000, max: 30 }),
  async (req, res) => {
    try {
      const plan = await db('subscription_plans')
        .where({ plan_id: req.params.plan_id, is_active: true })
        .first();

      if (!plan) {
        return res
          .status(404)
          .json({
            success: false,
            error: { code: 404, message: 'الباقة غير موجودة' },
          });
      }

      res.json({ success: true, data: plan });
    } catch (e) {
      res
        .status(500)
        .json({
          success: false,
          error: { code: 500, message: 'فشل في جلب الباقة' },
        });
    }
  }
);

// Update plan (admin only)
const updatePlanSchema = Joi.object({
  name: Joi.string().optional(),
  price_cents: Joi.number().integer().min(0).optional(),
  currency: Joi.string().valid('USD', 'SAR', 'EUR').optional(),
  duration_months: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
  description: Joi.string().allow('', null).optional(),
});

router.put(
  '/:plan_id',
  rateLimit({ windowMs: 60000, max: 10 }),
  auth,
  async (req, res) => {
    try {
      // Check admin
      if (!req.user.is_admin) {
        return res
          .status(403)
          .json({ success: false, error: { code: 403, message: 'غير مصرح' } });
      }

      const { error, value } = updatePlanSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({
            success: false,
            error: { code: 400, message: error.message },
          });
      }

      const plan = await db('subscription_plans')
        .where({ plan_id: req.params.plan_id })
        .first();
      if (!plan) {
        return res
          .status(404)
          .json({
            success: false,
            error: { code: 404, message: 'الباقة غير موجودة' },
          });
      }

      await db('subscription_plans')
        .where({ plan_id: req.params.plan_id })
        .update({ ...value, updated_at: new Date().toISOString() });

      const updated = await db('subscription_plans')
        .where({ plan_id: req.params.plan_id })
        .first();
      res.json({ success: true, data: updated });
    } catch (e) {
      res
        .status(500)
        .json({
          success: false,
          error: { code: 500, message: 'فشل في تحديث الباقة' },
        });
    }
  }
);

// Create new plan (admin only)
const createPlanSchema = Joi.object({
  plan_id: Joi.string().required(),
  name: Joi.string().required(),
  price_cents: Joi.number().integer().min(0).required(),
  currency: Joi.string().valid('USD', 'SAR', 'EUR').default('USD'),
  duration_months: Joi.number().integer().min(1).default(1),
  is_active: Joi.boolean().default(true),
  description: Joi.string().allow('', null).optional(),
});

router.post(
  '/',
  rateLimit({ windowMs: 60000, max: 10 }),
  auth,
  async (req, res) => {
    try {
      // Check admin
      if (!req.user.is_admin) {
        return res
          .status(403)
          .json({ success: false, error: { code: 403, message: 'غير مصرح' } });
      }

      const { error, value } = createPlanSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({
            success: false,
            error: { code: 400, message: error.message },
          });
      }

      const existing = await db('subscription_plans')
        .where({ plan_id: value.plan_id })
        .first();
      if (existing) {
        return res
          .status(400)
          .json({
            success: false,
            error: { code: 400, message: 'الباقة موجودة بالفعل' },
          });
      }

      await db('subscription_plans').insert({
        ...value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const created = await db('subscription_plans')
        .where({ plan_id: value.plan_id })
        .first();
      res.json({ success: true, data: created });
    } catch (e) {
      res
        .status(500)
        .json({
          success: false,
          error: { code: 500, message: 'فشل في إنشاء الباقة' },
        });
    }
  }
);

module.exports = router;
