class BaseProvider {
  name() { return 'base'; }
  async createCheckoutSession(user, planId, meta = {}) { throw new Error('not_implemented'); }
  async getCheckoutStatus(session) { return { status: session.status, session_id: session.session_id, plan_id: session.plan_id }; }
  async handleWebhook(payload, headers) { return { ok: true }; }
}

module.exports = BaseProvider;
