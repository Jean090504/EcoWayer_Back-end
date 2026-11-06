const AppError = require('./AppError');
const dao = require('../model/DAO/usuario/usuario');
const otp = require('./otp');
const notification = require('./notificacao');

const invalidRequest = (message, code = 'VALIDATION_ERROR') => new AppError(message, 400, code);

const sendCode = async (userId, contact, purpose) => {
    const code = otp.generate();
    await dao.saveCode({
        userId,
        contact,
        codeHash: otp.hash(code),
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
        return await notification.enviarCodigo({ contato: contact, codigo: code, finalidade: purpose });
    } catch {
        return { enviado: false };
    }
};

const removePrivateFields = (user) => {
    const { senha_hash, ...publicUser } = user;
    return publicUser;
};

const normalizeContact = (value) => {
    const contact = String(value || '').trim();
    return contact.includes('@') ? contact.toLowerCase() : contact.replace(/[\s()-]/g, '');
};

module.exports = { invalidRequest, sendCode, removePrivateFields, normalizeContact };
