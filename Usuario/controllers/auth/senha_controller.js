const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { hash, verify } = require('../../utils/password');
const otp = require('../../utils/otp');
const validators = require('../../utils/validators');
const { invalidRequest, sendCode, normalizeContact } = require('../../utils/usuario_helpers');

// Envia o código de recuperação sem revelar se o contato existe.
const solicitarRecuperacao = async (request, response) => {
    const contact = normalizeContact(request.body.contato);
    const emailInvalido = !validators.email.test(contact);
    const telefoneInvalido = !validators.phone(contact);
    if (emailInvalido && telefoneInvalido) {
        throw invalidRequest('Informe um e-mail ou telefone válido.');
    }

    const user = await dao.findByContact(contact);
    if (user) await sendCode(user.id, contact, 'recuperacao');

    response.json({ mensagem: 'Se o contato estiver cadastrado, você receberá instruções para redefinir a senha.' });
};

const redefinirSenha = async (request, response) => {
    const contact = normalizeContact(request.body.contato);
    const code = String(request.body.codigo_verificacao || '');
    const newPassword = String(request.body.nova_senha || '');

    const contatoInvalido = !validators.email.test(contact) && !validators.phone(contact);
    const codigoInvalido = !/^\d{6}$/.test(code);
    const senhaInvalida = !validators.password.test(newPassword);

    if (contatoInvalido || codigoInvalido || senhaInvalida) {
        throw invalidRequest('Contato, código ou nova senha inválidos.');
    }

    // Confere se o código existe, está dentro do prazo e ainda pode ser usado.
    const record = await dao.getCode(contact, 'recuperacao');
    const invalidCode = !record || record.tentativas >= 5 || new Date(record.expira_em) <= new Date()
        || !otp.compare(code, record.codigo_hash);

    if (invalidCode) {
        if (record) await dao.incrementCodeAttempts(record.id);
        throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID');
    }

    // Troca a senha e invalida o código em uma única transação.
    await dao.transaction(async (transaction) => {
        await dao.setPassword(record.id_usuario, await hash(newPassword), transaction);
        await dao.deleteCode(record.id, transaction);
    });

    response.json({ mensagem: 'Senha redefinida com sucesso.' });
};

const alterarSenha = async (request, response) => {
    const { senha_atual: currentPassword, nova_senha: newPassword } = request.body;
    if (!validators.password.test(newPassword || '')) {
        throw invalidRequest('A nova senha precisa ter 10 a 128 caracteres, maiúscula, minúscula, número e símbolo.');
    }

    // Exige a senha atual antes de salvar a nova senha.
    const user = await dao.findById(Number(request.auth.sub));
    if (!user?.senha_hash || !(await verify(user.senha_hash, String(currentPassword || '')))) {
        throw new AppError('Senha atual incorreta.', 401, 'INVALID_PASSWORD');
    }

    await dao.setPassword(user.id, await hash(newPassword));
    response.json({ mensagem: 'Senha alterada.' });
};

module.exports = { solicitarRecuperacao, redefinirSenha, alterarSenha };
