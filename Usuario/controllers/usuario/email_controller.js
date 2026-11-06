const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const validators = require('../../utils/validators');
const { invalidRequest, sendCode } = require('../../utils/usuario_helpers');

// Altera o e-mail e envia um novo código para confirmação.
const alterarEmail = async (request, response) => {
    const email = String(request.body.novo_email || '').trim().toLowerCase();
    if (!validators.email.test(email)) throw invalidRequest('E-mail inválido.');
    if (await dao.contactExists({ email })) throw new AppError('E-mail já cadastrado.', 409, 'CONTACT_IN_USE');

    const userId = Number(request.auth.sub);
    await dao.updateEmail(userId, email);
    const notification = await sendCode(userId, email, 'email');

    response.json({ mensagem: 'E-mail alterado. Confirme o novo endereço.', notificacao_enviada: notification.enviado });
};

module.exports = { alterarEmail };
