require('dotenv').config();
const { sendOtpEmail } = require('./services/email');

async function test() {
  console.log('Testing Email Service...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  const result = await sendOtpEmail(process.env.EMAIL_USER, '123456');
  if (result.success) {
    console.log('Test email sent successfully!');
  } else {
    console.error('Test email failed:', result.error);
  }
}

test();
