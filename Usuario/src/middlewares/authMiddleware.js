const { verify } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const dao = require('../model/DAO/usuarioDAO');
module.exports = async (req, _res, next) => {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return next(new AppError('Autenticação necessária.', 401, 'UNAUTHORIZED'));
  try { req.auth = verify(token); } catch { return next(new AppError('Token inválido ou expirado.', 401, 'INVALID_TOKEN')); }
  try {
    if (!(await dao.isActive(Number(req.auth.sub)))) return next(new AppError('Conta indisponível.', 401, 'ACCOUNT_INACTIVE'));
    return next();
  } catch (error) { return next(error); }
};
