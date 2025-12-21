const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendRenewalCode(to, code) {
  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'رمز تجديد الترخيص',
    text: `رمز التجديد الخاص بك: ${code}`,
    html: `<p>رمز التجديد الخاص بك: <strong>${code}</strong></p>`
  });
  return info.messageId;
}

module.exports = { sendRenewalCode };
