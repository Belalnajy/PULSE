const { db } = require('../db');
const { initDb } = require('../initDb');
const { getEntitlements, incChatDaily, incContentDaily } = require('../services/subscription');

async function main() {
  await initDb();
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node src/scripts/entitlements_check.js <email>');
    process.exit(1);
  }
  const user = await db('users').where({ email }).first();
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  const before = await getEntitlements(user.id);
  console.log('Entitlements (before):');
  console.log(JSON.stringify(before, null, 2));

  await incChatDaily(user.id, 1);
  await incContentDaily(user.id, 1);

  const after = await getEntitlements(user.id);
  console.log('Entitlements (after +1 chat/content):');
  console.log(JSON.stringify(after, null, 2));
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

