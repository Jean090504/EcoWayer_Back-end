const argon2 = require('argon2');

const hash = (value) => argon2.hash(value, { type: argon2.argon2id });
const verify = (passwordHash, value) => argon2.verify(passwordHash, value);

module.exports = { hash, verify };
