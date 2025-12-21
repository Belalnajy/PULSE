const { db } = require('../db');
const { logger } = require('../utils/logger');

async function ensureActiveLicense(req, res, next) {
  try {
    if (req.user?.is_admin) return next();
    const lic = await db('licenses').where({ user_id: req.user.id }).orderBy('id', 'desc').first();
    if (!lic) {
      logger.warn({ userId: req.user.id }, 'No license found');
      return res.status(402).json({ success: false, error: { code: 'NO_LICENSE', message: 'لا يوجد ترخيص. الرجاء التفعيل أو التجديد.' } });
    }
    const expired = new Date(lic.expires_at).getTime() < Date.now() || lic.status !== 'active';
    if (expired) {
      logger.warn({ userId: req.user.id }, 'License expired or inactive');
      return res.status(402).json({ success: false, error: { code: 'LICENSE_EXPIRED', message: 'انتهى الترخيص أو غير نشط. الرجاء التجديد.' } });
    }
    req.license = lic;
    next();
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 500, message: 'License check failed' } });
  }
}

module.exports = { ensureActiveLicense };
