const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendOtpEmail(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: `"Alva Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your Pulse account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #38bdf8; text-align: center;">Pulse Email Verification</h2>
          <p>Please use the following 6-digit code to verify your email address and activate your account:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #333;">
            ${otp}
          </div>
          <p>This code will expire in ${
            process.env.OTP_EXPIRY_MINUTES || 10
          } minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} Pulse AI. All rights reserved.</p>
        </div>
      `,
    });
    console.log('[Email] OTP sent to %s: %s', email, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send OTP to %s:', email, error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendOtpEmail };
