const jwt = require('jsonwebtoken');
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET deve ter ao menos 32 caracteres.');
  return value;
};
exports.sign = (payload) => jwt.sign(payload, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'ecowayer-api-usuario', audience: 'ecowayer' });
exports.verify = (token) => jwt.verify(token, secret(), { issuer: 'ecowayer-api-usuario', audience: 'ecowayer' });
