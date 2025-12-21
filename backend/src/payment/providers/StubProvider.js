const BaseProvider = require('./BaseProvider');
const { v4: uuidv4 } = require('uuid');

class StubProvider extends BaseProvider {
  name() { return 'stub'; }
  async createCheckoutSession(user, planId, meta = {}) {
    const session_id = uuidv4();
    const checkout_url = `/billing/mock?session=${session_id}`;
    return { session_id, plan_id: planId, checkout_url, provider: this.name(), meta };
  }
  async handleWebhook(payload, headers) { return { ignored: true }; }
}

module.exports = StubProvider;
