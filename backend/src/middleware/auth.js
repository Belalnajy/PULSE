const jwt = require('jsonwebtoken');
const { db } = require('../db');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: payload.userId }).first();
    if (!user) return res.status(401).json({ success: false, error: { code: 401, message: 'User not found' } });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid token' } });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: payload.userId }).first();
    if (user) req.user = user;
    next();
  } catch (e) {
    next();
  }
}

module.exports = { auth, optionalAuth };
