const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const otp = require('../../utils/otp');
const validators = require('../../utils/validators');
const { invalidRequest } = require('../../utils/usuario_helpers');

// Confirma o e-mail ou telefone usando o código enviado.
const validarContato = (purpose) => async (request, response) => {
    const isEmail = purpose === 'email';
    const contact = isEmail
        ? String(request.body.email || '').trim().toLowerCase()
        : String(request.body.telefone || '').replace(/[\s()-]/g, '');
    const code = String(request.body.codigo_verificacao || '');

    if (!(isEmail ? validators.email.test(contact) : validators.phone(contact)) || !/^\d{6}$/.test(code)) {
        throw invalidRequest('Contato ou código inválido.');
    }

    // Busca o código e verifica prazo e limite de tentativas.
    const record = await dao.getCode(contact, purpose);
    const expired = !record || new Date(record.expira_em) <= new Date() || record.tentativas >= 5;
    if (expired) throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID');

    if (!otp.compare(code, record.codigo_hash)) {
        await dao.incrementCodeAttempts(record.id);
        throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID');
    }

    // Confirma o contato e remove o código usado.
    await dao.transaction(async (transaction) => {
        await dao.markContactVerified(contact, purpose, transaction);
        await dao.deleteCode(record.id, transaction);
    });

    response.json({ mensagem: 'Contato validado com sucesso.' });
};

module.exports = { validarContato };
