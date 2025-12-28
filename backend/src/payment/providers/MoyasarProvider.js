const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../db');

class MoyasarProvider extends BaseProvider {
  name() {
    return 'moyasar';
  }

  async createCheckoutSession(user, planId, meta = {}) {
    const secretKey = process.env.MOYASAR_SECRET_KEY;
    if (!secretKey) throw new Error('MOYASAR_SECRET_KEY not set');

    // Fetch plan from database
    const plan = await db('subscription_plans')
      .where({ plan_id: planId, is_active: true })
      .first();

    if (!plan) {
      throw new Error(`Plan ${planId} not found or inactive`);
    }

    const amount = plan.price_cents;
    const currency = plan.currency;
    const description = `${plan.name} - ${user.email}`;

    // Redirect to backend callback for server-side verification and handling
    // This is the production best practice: Gateway -> Backend (Verify) -> Frontend
    const apiBaseUrl = (
      process.env.API_BASE_URL ||
      `http://localhost:${process.env.PORT || 5000}`
    ).replace(/\/+$/, ''); // Remove trailing slashes
    const callbackUrl = `${apiBaseUrl}/api/payments/callback`;
    console.log(
      `[Moyasar] Creating invoice for user ${user.id}, plan ${planId}`
    );
    console.log(`[Moyasar] Callback URL: ${callbackUrl}`);

    try {
      const response = await axios.post(
        'https://api.moyasar.com/v1/invoices',
        {
          amount: amount,
          currency: currency,
          description: description,
          callback_url: callbackUrl,
          metadata: {
            user_id: user.id,
            plan_id: planId,
            ...meta,
          },
        },
        {
          auth: {
            username: secretKey,
            password: '',
          },
        }
      );

      const invoice = response.data;
      return {
        session_id: invoice.id,
        plan_id: planId,
        checkout_url: invoice.url,
        provider: this.name(),
        meta: { ...meta, invoice_id: invoice.id },
      };
    } catch (error) {
      console.error('Moyasar create invoice error:');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Message:', error.message);
      console.error('Request data:', {
        amount,
        currency,
        description,
        callbackUrl,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to create Moyasar invoice'
      );
    }
  }

  async handleWebhook(payload, headers) {
    // Basic webhook handling - in real prod we verify signature if available or check status
    // Moyasar sends the payment object.
    if (payload.status === 'paid') {
      return { ok: true, status: 'paid', id: payload.id };
    }
    return { ok: true, status: payload.status };
  }
}

module.exports = MoyasarProvider;
