const crypto = require('node:crypto');
exports.generate = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const pepper = () => process.env.OTP_PEPPER || process.env.JWT_SECRET || 'development-only-otp-secret';
exports.hash = (code) => crypto.createHmac('sha256', pepper()).update(String(code)).digest('hex');
exports.compare = (code, hash) => {
  const expected = Buffer.from(exports.hash(code), 'utf8');
  const received = Buffer.from(String(hash || ''), 'utf8');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};
