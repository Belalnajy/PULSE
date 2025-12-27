const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || !process.env.EMAIL_HOST, // Use secure transport by default for Gmail or if specified
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
          <p style="font-size: 12px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} Pulse. All rights reserved.</p>
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

async function sendExpiryReminderEmail(email, userName, daysLeft, expiryDate) {
  try {
    const formattedDate = new Date(expiryDate).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const urgencyColor =
      daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#38bdf8';
    const urgencyText =
      daysLeft <= 3 ? 'عاجل!' : daysLeft <= 7 ? 'تنبيه' : 'تذكير';

    const info = await transporter.sendMail({
      from: `"Pulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${urgencyText} - اشتراكك في Pulse سينتهي خلال ${daysLeft} ${
        daysLeft === 1 ? 'يوم' : 'أيام'
      }`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #0c131d; border-radius: 16px; color: #fff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
            <tr>
              <td align="center">
                <img src="https://alva-pulse-immq2mvaa5.edgeone.app/Pulse-logo.png" alt="Pulse" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
                <h1 style="color: #38bdf8; margin: 15px 0 5px; font-size: 28px;">Pulse</h1>
              </td>
            </tr>
          </table>
          
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <p style="font-size: 18px; margin: 0 0 15px; color: #e5e7eb;">مرحباً ${
              userName || 'عزيزي المشترك'
            } 👋</p>
            
            <div style="background: ${urgencyColor}15; border: 1px solid ${urgencyColor}40; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: ${urgencyColor}; font-size: 16px; font-weight: bold; margin: 0 0 10px;">${urgencyText}</p>
              <p style="font-size: 32px; font-weight: bold; color: #fff; margin: 0;">
                ${daysLeft} <span style="font-size: 18px; color: #9ca3af;">${
        daysLeft === 1 ? 'يوم' : 'أيام'
      } متبقية</span>
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 15px; line-height: 1.8; margin: 0;">
              اشتراكك في Pulse سينتهي في <strong style="color: #fff;">${formattedDate}</strong>.
              <br />
              لا تفوت فرصة الاستمرار في استخدام أدوات PULSE  المتقدمة لإنشاء محتواك التسويقي.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://pulse.ai'}/app" 
               style="display: inline-block; background: linear-gradient(135deg, #00b894 0%, #38bdf8 100%); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(56,189,248,0.3);">
              تجديد الاشتراك الآن
            </a>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
              إذا كان لديك أي استفسار، لا تتردد في التواصل معنا
              <br />
              &copy; ${new Date().getFullYear()} Pulse. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    });
    console.log(
      '[Email] Expiry reminder sent to %s: %s',
      email,
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      '[Email] Failed to send expiry reminder to %s:',
      email,
      error
    );
    return { success: false, error: error.message };
  }
}

async function sendResetPasswordEmail(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: `"Pulse Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'تغيير كلمة المرور - Pulse',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #0c131d; border-radius: 16px; color: #fff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
            <tr>
              <td align="center">
                <img src="https://alva-pulse-immq2mvaa5.edgeone.app/Pulse-logo.png" alt="Pulse" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
                <h1 style="color: #38bdf8; margin: 15px 0 5px; font-size: 28px;">Pulse</h1>
              </td>
            </tr>
          </table>
          
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <p style="font-size: 18px; margin: 0 0 15px; color: #e5e7eb;">طلب تغيير كلمة المرور 🔐</p>
            <p style="color: #9ca3af; font-size: 15px; line-height: 1.8; margin-bottom: 25px;">
              لقد تلقينا طلباً لتغيير كلمة المرور الخاصة بحسابك. يرجى استخدام الرمز التالي لإتمام العملية:
            </p>
            
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 20px; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; color: #38bdf8; letter-spacing: 12px; margin: 0;">
                ${otp}
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; margin: 25px 0 0; text-align: center;">
              هذا الرمز صالح لمدة 15 دقيقة فقط.
              <br />
              إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذا البريد.
            </p>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} Pulse. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    });
    console.log('[Email] Reset password OTP sent to %s', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      '[Email] Failed to send reset password OTP to %s:',
      email,
      error
    );
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOtpEmail,
  sendExpiryReminderEmail,
  sendResetPasswordEmail,
};
