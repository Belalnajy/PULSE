const { db } = require('../db');

async function upsertOrder({ orderId, sku, customerPhone, customerEmail, status }) {
  const existing = await db('salla_orders').where({ order_id: orderId }).first();
  const payload = { order_id: orderId, sku, customer_phone: customerPhone, customer_email: customerEmail || null, status, used: 0 };
  if (existing) {
    await db('salla_orders').where({ id: existing.id }).update(payload);
    return { id: existing.id };
  } else {
    const [id] = await db('salla_orders').insert(payload);
    return { id };
  }
}

async function upsertOrderFromSalla(orderData) {
  const { orderId, sku, customer_phone, customer_email, status } = orderData;
  return upsertOrder({ orderId, sku, customerPhone: customer_phone, customerEmail: customer_email, status });
}

async function fetchSingleOrder(orderId) {
  return null;
}

async function fetchAndStoreRecentOrders() {
  return 0;
}

module.exports = { upsertOrder, upsertOrderFromSalla, fetchSingleOrder, fetchAndStoreRecentOrders };
