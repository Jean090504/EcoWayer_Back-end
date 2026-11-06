const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { verify } = require('../../utils/password');
const { sign } = require('../../utils/jwt');
const { normalizeContact } = require('../../utils/usuario_helpers');

// Autentica com e-mail ou telefone e devolve o token de sessão.
const autenticarUsuario = async (request, response) => {
    const login = normalizeContact(request.body.login);
    const password = String(request.body.senha || '');
    const user = await dao.findByLogin(login);

    // Confere o contato e a senha informados.
    if (!user?.senha_hash || !(await verify(user.senha_hash, password))) {
        throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    // Só permite acesso depois de confirmar e-mail e telefone.
    const verification = await dao.getVerificationState(user.id);
    if (user.id_status_usuario !== verification.activeStatus || !verification.emailVerified || !verification.phoneVerified) {
        throw new AppError('Confirme seu e-mail e telefone antes de entrar.', 403, 'ACCOUNT_UNVERIFIED');
    }

    // Cria o token usado nas rotas privadas.
    response.json({ token: sign({ sub: String(user.id) }), tipo: 'Bearer', usuario: { id: user.id } });
};

module.exports = { autenticarUsuario };
