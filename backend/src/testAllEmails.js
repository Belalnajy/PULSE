require('dotenv').config();
const {
  sendOtpEmail,
  sendResetPasswordEmail,
  sendExpiryReminderEmail,
} = require('./services/email');

async function testAll() {
  const testEmail = process.env.EMAIL_USER;
  console.log('--- Testing All Email Types ---');
  console.log('Target Email:', testEmail);

  console.log('\n1. Testing Registration OTP (English Subject)...');
  const res1 = await sendOtpEmail(testEmail, '111111');
  console.log('Result:', res1.success ? 'SUCCESS' : 'FAILED: ' + res1.error);

  console.log('\n2. Testing Password Reset OTP (Arabic Subject)...');
  const res2 = await sendResetPasswordEmail(testEmail, '222222');
  console.log('Result:', res2.success ? 'SUCCESS' : 'FAILED: ' + res2.error);

  console.log('\n3. Testing Expiry Reminder (Arabic Subject)...');
  const res3 = await sendExpiryReminderEmail(
    testEmail,
    'Test User',
    5,
    new Date()
  );
  console.log('Result:', res3.success ? 'SUCCESS' : 'FAILED: ' + res3.error);
}

testAll();
