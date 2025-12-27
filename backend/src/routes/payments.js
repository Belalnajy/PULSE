const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const {
  createCheckoutSession,
  getCheckoutStatus,
  handleWebhook,
  markSessionPaid,
  markSessionFailed,
} = require('../payment/paymentService');

const router = express.Router();

const checkoutSchema = Joi.object({
  plan_id: Joi.string().valid('monthly').required(),
  return_url: Joi.string().uri().optional(),
});
router.post(
  '/checkout',
  rateLimit({ windowMs: 60000, max: 20 }),
  auth,
  async (req, res) => {
    const { error, value } = checkoutSchema.validate(req.body || {});
    if (error)
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: error.message } });
    try {
      const created = await createCheckoutSession(req.user.id, value.plan_id, {
        return_url: value.return_url || null,
      });
      res.json({ success: true, data: created });
    } catch (e) {
      console.error('Checkout error:', e.message);
      console.error('Stack:', e.stack);
      res.status(500).json({
        success: false,
        error: { code: 500, message: 'تعذر إنشاء جلسة الدفع' },
      });
    }
  }
);

router.get(
  '/checkout/:session_id',
  rateLimit({ windowMs: 60000, max: 30 }),
  auth,
  async (req, res) => {
    try {
      const status = await getCheckoutStatus(req.params.session_id);
      if (!status)
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'الجلسة غير موجودة' },
        });
      res.json({ success: true, data: status });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: { code: 500, message: 'تعذر قراءة حالة الجلسة' },
      });
    }
  }
);

// Payment verification (JSON response, no redirect)
router.get('/verify/:invoice_id', async (req, res) => {
  try {
    const { invoice_id } = req.params;

    // Find the payment session
    const { db } = require('../db');
    const session = await db('payments_sessions')
      .where({ session_id: invoice_id })
      .first();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        status: 'not_found',
      });
    }

    // Verify payment with Moyasar API
    const axios = require('axios');
    const secretKey = process.env.MOYASAR_SECRET_KEY;

    try {
      const response = await axios.get(
        `https://api.moyasar.com/v1/invoices/${invoice_id}`,
        {
          auth: {
            username: secretKey,
            password: '',
          },
        }
      );

      const invoice = response.data;

      // Handle different payment statuses
      if (invoice.status === 'paid' && session.status !== 'paid') {
        // (Y) Authentication/Account Verification Successful
        await markSessionPaid(invoice_id);
        return res.json({
          success: true,
          status: 'activated',
          message: 'تم تفعيل الاشتراك بنجاح',
        });
      } else if (invoice.status === 'paid') {
        return res.json({
          success: true,
          status: 'already_active',
          message: 'الاشتراك مفعّل بالفعل',
        });
      } else if (invoice.status === 'failed') {
        // Payment failed - check specific reason
        const source = invoice.source || {};
        const message = source.message || '';

        let errorMessage = 'فشلت عملية الدفع';
        let errorCode = 'failed';

        if (
          message.includes('Authentication Cancelled') ||
          message.includes('cancelled')
        ) {
          // (N) Authentication Cancelled
          errorMessage = 'تم إلغاء عملية التحقق';
          errorCode = 'cancelled';
        } else if (
          message.includes('Authentication rejected') ||
          message.includes('rejected')
        ) {
          // (R) Authentication rejected
          errorMessage = 'تم رفض عملية التحقق';
          errorCode = 'rejected';
        } else if (
          message.includes('Not Authenticated') ||
          message.includes('denied')
        ) {
          // (N) Not Authenticated/Account Not Verified Transaction denied
          errorMessage = 'تم رفض المعاملة - الحساب غير موثق';
          errorCode = 'denied';
        } else if (
          message.includes('not available') ||
          message.includes('unavailable')
        ) {
          // (U) Authentication not available
          errorMessage = 'خدمة التحقق غير متاحة حالياً';
          errorCode = 'unavailable';
        } else if (
          message.includes('Server Error') ||
          message.includes('server error')
        ) {
          // (E) Authentication Server Error
          errorMessage = 'خطأ في خادم التحقق';
          errorCode = 'server_error';
        }

        return res.json({
          success: false,
          status: errorCode,
          message: errorMessage,
          details: message,
        });
      } else if (
        invoice.status === 'pending' ||
        invoice.status === 'initiated'
      ) {
        return res.json({
          success: false,
          status: invoice.status,
          message: 'الدفع قيد المعالجة',
        });
      } else {
        return res.json({
          success: false,
          status: invoice.status,
          message: 'حالة الدفع غير معروفة',
        });
      }
    } catch (apiError) {
      console.error('Moyasar verification error:', apiError.message);
      return res.status(500).json({
        success: false,
        error: 'Verification failed',
        status: 'verification_error',
        message: 'فشل التحقق من حالة الدفع',
      });
    }
  } catch (e) {
    console.error('Verify error:', e.message);
    return res.status(500).json({
      success: false,
      error: e.message,
      status: 'error',
    });
  }
});

// Payment callback - verify and activate subscription
router.get('/callback', async (req, res) => {
  try {
    const { id, status } = req.query; // Moyasar sends id and status as query params
    const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')[0]
      .trim();

    if (!id) {
      console.error('[Callback] Missing payment ID in request');
      return res.redirect(`${frontendUrl}/app?payment=missing_id`);
    }

    // Find the payment session
    const { db } = require('../db');
    const session = await db('payments_sessions')
      .where({ session_id: id })
      .first();

    if (!session) {
      console.error(`[Callback] No session found for ID: ${id}`);
      return res.redirect(`${frontendUrl}/app?payment=session_not_found`);
    }

    // Verify payment with Moyasar API
    const axios = require('axios');
    const secretKey = process.env.MOYASAR_SECRET_KEY;

    try {
      const response = await axios.get(
        `https://api.moyasar.com/v1/invoices/${id}`,
        {
          auth: {
            username: secretKey,
            password: '',
          },
        }
      );

      const invoice = response.data;

      // Handle different payment statuses
      if (invoice.status === 'paid') {
        // (Y) Authentication/Account Verification Successful
        await markSessionPaid(id);
        return res.redirect(`${frontendUrl}/app?payment=success`);
      } else if (invoice.status === 'failed') {
        // Payment failed - could be various reasons
        const source = invoice.source || {};
        const message = source.message || '';

        // Update session with failed status
        await db('payments_sessions').where({ session_id: id }).update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        });

        // Handle specific authentication failures
        if (
          message.includes('Authentication Cancelled') ||
          message.includes('cancelled')
        ) {
          // (N) Authentication Cancelled
          return res.redirect(`${frontendUrl}/app?payment=cancelled`);
        } else if (
          message.includes('Authentication rejected') ||
          message.includes('rejected')
        ) {
          // (R) Authentication rejected
          return res.redirect(`${frontendUrl}/app?payment=rejected`);
        } else if (
          message.includes('Not Authenticated') ||
          message.includes('denied')
        ) {
          // (N) Not Authenticated/Account Not Verified Transaction denied
          return res.redirect(`${frontendUrl}/app?payment=denied`);
        } else if (
          message.includes('not available') ||
          message.includes('unavailable')
        ) {
          // (U) Authentication not available
          return res.redirect(`${frontendUrl}/app?payment=unavailable`);
        } else if (
          message.includes('Server Error') ||
          message.includes('server error')
        ) {
          // (E) Authentication Server Error
          return res.redirect(`${frontendUrl}/app?payment=server_error`);
        } else {
          // Generic failure
          return res.redirect(`${frontendUrl}/app?payment=failed`);
        }
      } else if (
        invoice.status === 'pending' ||
        invoice.status === 'initiated'
      ) {
        // Payment still pending
        await db('payments_sessions').where({ session_id: id }).update({
          status: invoice.status,
          updated_at: new Date().toISOString(),
        });
        return res.redirect(`${frontendUrl}/app?payment=pending`);
      } else {
        // Unknown status
        await db('payments_sessions').where({ session_id: id }).update({
          status: invoice.status,
          updated_at: new Date().toISOString(),
        });
        return res.redirect(`${frontendUrl}/app?payment=unknown`);
      }
    } catch (apiError) {
      console.error('Moyasar verification error:', apiError.message);
      return res.redirect(`${frontendUrl}/app?payment=verification_failed`);
    }
  } catch (e) {
    console.error('Callback error:', e.message);
    const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')[0]
      .trim();
    return res.redirect(`${frontendUrl}/app?payment=error`);
  }
});

router.post('/webhook/moyasar', async (req, res) => {
  try {
    console.log('Moyasar webhook received:', JSON.stringify(req.body, null, 2));

    const payload = req.body;

    // Moyasar sends payment object with status
    if (payload.type === 'payment' && payload.status === 'paid') {
      const invoiceId = payload.id;

      // Find the payment session
      const { db } = require('../db');
      const session = await db('payments_sessions')
        .where({ session_id: invoiceId })
        .first();

      if (session && session.status !== 'paid') {
        console.log(`Activating subscription for session: ${invoiceId}`);
        await markSessionPaid(invoiceId);
      }
    }

    // Always return 200 to Moyasar
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e.message);
    res.status(200).json({ received: true }); // Still return 200 to avoid retries
  }
});

router.post('/webhook/:provider', async (req, res) => {
  try {
    await handleWebhook(req.params.provider, req.body, req.headers);
    res.json({ success: true, data: { message: 'ignored in stub' } });
  } catch (e) {
    res
      .status(400)
      .json({ success: false, error: { code: 400, message: 'webhook error' } });
  }
});

router.post(
  '/checkout/:session_id/mark-paid',
  rateLimit({ windowMs: 60000, max: 10 }),
  auth,
  async (req, res) => {
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'development') {
      return res
        .status(403)
        .json({ success: false, error: { code: 403, message: 'dev_only' } });
    }
    try {
      const updated = await markSessionPaid(req.params.session_id);
      if (!updated)
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'الجلسة غير موجودة' },
        });
      res.json({
        success: true,
        data: { status: updated.status, session_id: updated.session_id },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: { code: 500, message: 'تعذر تحديث الجلسة' },
      });
    }
  }
);

router.post(
  '/checkout/:session_id/mark-failed',
  rateLimit({ windowMs: 60000, max: 10 }),
  auth,
  async (req, res) => {
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'development') {
      return res
        .status(403)
        .json({ success: false, error: { code: 403, message: 'dev_only' } });
    }
    try {
      const updated = await markSessionFailed(req.params.session_id);
      if (!updated)
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'الجلسة غير موجودة' },
        });
      res.json({
        success: true,
        data: { status: updated.status, session_id: updated.session_id },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: { code: 500, message: 'تعذر تحديث الجلسة' },
      });
    }
  }
);

// Manual verification of the user's latest pending session
router.get('/verify-my-last-session', auth, async (req, res) => {
  try {
    const { db } = require('../db');
    // Only allow sessions created in the last 24 hours to prevent stale reactivation
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const session = await db('payments_sessions')
      .where({ user_id: req.user.id })
      .whereIn('status', ['pending', 'initiated'])
      .where('created_at', '>=', twentyFourHoursAgo)
      .orderBy('id', 'desc')
      .first();

    if (!session) {
      return res.status(404).json({
        success: false,
        status: 'no_pending',
        message: 'لا توجد عمليات دفع معلقة مؤخراً ليتم التحقق منها.',
        error: {
          code: 404,
          message: 'لا توجد عمليات دفع معلقة مؤخراً ليتم التحقق منها.',
        },
      });
    }

    const invoice_id = session.session_id;
    const axios = require('axios');
    const secretKey = process.env.MOYASAR_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: 'إعدادات بوابة الدفع غير مكتملة (Missing API Key)',
      });
    }

    // Verify with Moyasar
    const response = await axios.get(
      `https://api.moyasar.com/v1/invoices/${invoice_id}`,
      {
        auth: {
          username: secretKey,
          password: '',
        },
      }
    );

    const invoice = response.data;

    if (invoice.status === 'paid') {
      await markSessionPaid(invoice_id);
      return res.json({
        success: true,
        status: 'activated',
        message: 'تم التحقق من الدفع وتفعيل الاشتراك بنجاح! 🎉',
      });
    } else if (invoice.status === 'failed') {
      await markSessionFailed(invoice_id);
      return res.json({
        success: false,
        status: 'failed',
        message: 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.',
        details: invoice.source?.message || '',
      });
    } else if (invoice.status === 'initiated' || invoice.status === 'pending') {
      return res.json({
        success: false,
        status: invoice.status,
        message:
          invoice.status === 'initiated'
            ? 'عملية الدفع بدأت، لكنك لم تدخل بيانات البطاقة بعد. يُرجى إتمام الدفع في صفحة ميسر.'
            : 'عملية الدفع قيد الانتظار، بانتظار إتمام العملية من جانبك.',
        error: {
          code: 400,
          message:
            invoice.status === 'initiated'
              ? 'يُرجى إتمام الدفع في صفحة ميسر.'
              : 'عملية الدفع قيد الانتظار.',
        },
      });
    } else {
      return res.json({
        success: false,
        status: invoice.status,
        message: `حالة الدفع: ${invoice.status}. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.`,
        error: { code: 400, message: `حالة الدفع: ${invoice.status}` },
      });
    }
  } catch (e) {
    console.error('Verify last session error:', e.message);
    res.status(500).json({
      success: false,
      message: 'وقع خطأ أثناء محاولة التحقق من الدفع.',
      error: e.message,
    });
  }
});

module.exports = router;
