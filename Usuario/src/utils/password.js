const argon2 = require('argon2');
exports.hash = (value) => argon2.hash(value, { type: argon2.argon2id });
exports.verify = (hash, value) => argon2.verify(hash, value);
