const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const {
  enforceContentTrial,
  isActiveSubscription,
  getLatestSubscription,
  checkSubscriberFairContent,
  incSubscriberContentDaily,
} = require('../services/subscription');
const { generateCampaignContent } = require('../services/ai');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const schema = Joi.object({
  idea: Joi.string().min(2).required(),
  contentGoal: Joi.string().valid('sell', 'traffic', 'trust').required(),
  contentCategory: Joi.string().valid('marketing', 'interactive').optional(),
  platforms: Joi.array().items(Joi.string()).min(1).required(),
  tone: Joi.string().valid('friendly', 'professional', 'bold').required(),
  audience: Joi.string().min(2).optional(),
  ageGroups: Joi.array()
    .items(Joi.string().valid('18-25', '25-30', '30-35', '40+'))
    .optional(),
  variationMode: Joi.boolean().optional(),
  variationIteration: Joi.number().integer().min(0).optional(),
  clientRequestId: Joi.string().optional(),
  userComment: Joi.string().optional(),
  targetPlatform: Joi.string().optional(),
});

router.post(
  '/generate',
  rateLimit({ windowMs: 60000, max: 30 }),
  auth,
  async (req, res) => {
    const { error, value } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    try {
      const sub = await getLatestSubscription(req.user.id);
      const active = isActiveSubscription(sub);
      const env = (process.env.NODE_ENV || '').toLowerCase();
      const fairEnv = (process.env.FAIR_ENFORCE || '').toLowerCase();
      let enforceFair = env === 'production';
      if (fairEnv === 'true') enforceFair = true;
      if (fairEnv === 'false') enforceFair = false;
      if (active) {
        if (enforceFair) {
          const fair = await checkSubscriberFairContent(req.user.id);
          if (fair.throttled) {
            const err = new Error(
              'تم تفعيل إيقاف مؤقت بسبب سياسة الاستخدام العادل'
            );
            err.code = 'FAIR_USAGE_THROTTLED';
            err.status = 429;
            throw err;
          }
        }
      } else {
        await enforceContentTrial(req.user);
      }
      const outputs = await generateCampaignContent(req.user, value);
      if (active) {
        await incSubscriberContentDaily(req.user.id, 1);
        const fair = await checkSubscriberFairContent(req.user.id);
        return res.json({
          success: true,
          data: {
            generated: true,
            outputs,
            fair_usage_warning: fair.warn ? { level: 'warn' } : null,
          },
        });
      }
      res.json({ success: true, data: { generated: true, outputs } });
    } catch (e) {
      if (e.code === 'SUBSCRIPTION_REQUIRED')
        return res.status(403).json({
          success: false,
          error: { code: 'SUBSCRIPTION_REQUIRED', message: e.message },
        });
      if (e.code === 'TRIAL_LIMIT_REACHED')
        return res.status(403).json({
          success: false,
          error: { code: 'TRIAL_LIMIT_REACHED', message: e.message },
        });
      if (e.code === 'OTP_REQUIRED')
        return res.status(403).json({
          success: false,
          error: { code: 'OTP_REQUIRED', message: e.message },
        });
      if (e.code === 'FAIR_USAGE_THROTTLED')
        return res.status(429).json({
          success: false,
          code: 'FAIR_USAGE_THROTTLED',
          message: e.message,
        });
      const status = e.status || e.code || 500;
      const message = e.message || 'فشل توليد الحملة';
      res
        .status(status)
        .json({ success: false, error: { code: status, message } });
    }
  }
);

module.exports = router;
