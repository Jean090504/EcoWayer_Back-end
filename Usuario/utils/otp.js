const crypto = require('node:crypto');

const generate = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');
const compare = (code, codeHash) => crypto.timingSafeEqual(Buffer.from(hash(code)), Buffer.from(codeHash));

module.exports = { generate, hash, compare };
