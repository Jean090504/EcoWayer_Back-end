const crypto = require('node:crypto');
exports.generate = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
exports.hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');
exports.compare = (code, hash) => crypto.timingSafeEqual(Buffer.from(exports.hash(code)), Buffer.from(hash));
