require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { initDb } = require('../initDb');

(async () => {
  await initDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'Alva@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Alva';
  const existing = await db('users').where({ email: adminEmail }).first();
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await db('users').insert({ email: adminEmail, password_hash: hash, is_admin: true, display_name: 'Admin', is_verified: 1 });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    if (!existing.is_verified) {
      await db('users').where({ id: existing.id }).update({ is_verified: 1 });
    }
    console.log('Admin user already exists');
  }
  console.log('DB initialized');
  process.exit(0);
})();
