const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { verify } = require('../../utils/password');

// Confirma a senha e anonimiza a conta do usuário.
const excluirMinhaConta = async (request, response) => {
    const user = await dao.findById(Number(request.auth.sub));
    const password = String(request.body.confirmacao_senha || '');

    if (!user?.senha_hash || !(await verify(user.senha_hash, password))) {
        throw new AppError('Senha de confirmação incorreta.', 401, 'INVALID_PASSWORD');
    }

    // Mantém os registros relacionados e remove os dados pessoais.
    await dao.transaction((transaction) => dao.erase(user.id, transaction));
    response.status(204).end();
};

module.exports = { excluirMinhaConta };
