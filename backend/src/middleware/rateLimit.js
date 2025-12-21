const buckets = new Map();
const NODE_ENV = (process.env.NODE_ENV || '').toLowerCase();
const DEV_DISABLE = ((process.env.RATE_LIMIT_DEV_DISABLE || '').toLowerCase() === 'true');
const ENV_WIN = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const ENV_MAX = Number(process.env.RATE_LIMIT_MAX || 30);
console.warn(`RATE_LIMIT_CONFIG nodeEnv=${NODE_ENV} devDisable=${DEV_DISABLE} max=${ENV_MAX} window=${ENV_WIN}`);

function key(ip, route) {
  return `${route}:${ip}`;
}

function rateLimit({ windowMs = 60000, max = 30 }) {
  return (req, res, next) => {
    const env = (process.env.NODE_ENV || '').toLowerCase();
    const disabled = (env === 'development' && (process.env.RATE_LIMIT_DEV_DISABLE || '').toLowerCase() === 'true');
    const win = Number(process.env.RATE_LIMIT_WINDOW_MS || windowMs);
    const mx = Number(process.env.RATE_LIMIT_MAX || max);
    if (disabled) return next();
    const k = key(req.ip || req.headers['x-forwarded-for'] || 'local', req.path);
    const now = Date.now();
    const bucket = buckets.get(k) || { count: 0, reset: now + win };
    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + win;
    }
    bucket.count += 1;
    buckets.set(k, bucket);
    if (bucket.count > mx) {
      return res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'عدد الطلبات كبير. حاول لاحقًا.' });
    }
    next();
  };
}

module.exports = { rateLimit };
