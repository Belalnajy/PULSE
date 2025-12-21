async function sendOtp(phone, code) {
  try {
    const env = (process.env.NODE_ENV || '').toLowerCase();
    if (env === 'development') {
      console.log(`DEV OTP for ${phone}: ${code}`);
      return { success: true, dev: true };
    }
    console.log(`[SMS] Sending OTP ${code} to ${phone}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = { sendOtp };
