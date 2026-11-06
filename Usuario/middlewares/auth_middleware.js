const dao = require('../model/DAO/usuario/usuario');
const { verify } = require('../utils/jwt');
const AppError = require('../utils/AppError');

// Confere o token e valida se a conta continua ativa.
const authMiddleware = async (request, _response, next) => {
    const token = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return next(new AppError('Autenticação necessária.', 401, 'UNAUTHORIZED'));

    try {
        request.auth = verify(token);
    } catch {
        return next(new AppError('Token inválido ou expirado.', 401, 'INVALID_TOKEN'));
    }

    try {
        if (!(await dao.isActive(Number(request.auth.sub)))) return next(new AppError('Conta indisponível.', 401, 'ACCOUNT_INACTIVE'));
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = authMiddleware;
