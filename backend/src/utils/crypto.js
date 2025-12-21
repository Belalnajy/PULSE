const crypto = require('crypto');

function getKey() {
  const hex = process.env.ENCRYPTION_KEY_HEX || '';
  if (hex.length !== 64) throw new Error('ENCRYPTION_KEY_HEX must be 64 hex chars');
  return Buffer.from(hex, 'hex');
}

function encrypt(str) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(b64) {
  const raw = Buffer.from(b64, 'base64');
  const iv = raw.slice(0, 12);
  const tag = raw.slice(12, 28);
  const data = raw.slice(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = { encrypt, decrypt, sha256 };
