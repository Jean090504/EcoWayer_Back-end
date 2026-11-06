const { OAuth2Client } = require('google-auth-library');
const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { sign } = require('../../utils/jwt');
const validators = require('../../utils/validators');
const { invalidRequest, sendCode } = require('../../utils/usuario_helpers');

// Valida o token do Google e autentica ou cadastra o usuário.
const loginGoogle = async (request, response) => {
    const credential = request.body.credential;
    if (typeof credential !== 'string' || !credential) throw invalidRequest('Credencial Google obrigatória.');
    if (!process.env.GOOGLE_CLIENT_ID) throw new AppError('Autenticação Google não configurada.', 503, 'GOOGLE_NOT_CONFIGURED');

    // Confere se a credencial foi emitida para este aplicativo.
    let payload;
    try {
        const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        throw new AppError('Credencial Google inválida ou expirada.', 401, 'INVALID_GOOGLE_CREDENTIAL');
    }

    if (!payload?.email || payload.email_verified !== true) {
        throw new AppError('A conta Google precisa ter um e-mail verificado.', 401, 'UNVERIFIED_GOOGLE_EMAIL');
    }

    // Procura uma conta existente pelo e-mail verificado.
    const email = payload.email.trim().toLowerCase();
    let user = await dao.findByEmail(email);
    let created = false;

    // Para uma conta nova, solicita os dados que o Google não fornece.
    if (!user) {
        const cpf = request.body.cpf;
        const birthDate = request.body.data_nascimento;
        const genderId = Number(request.body.id_genero);
        const phone = String(request.body.telefone || '').replace(/[\s()-]/g, '');
        const name = String(request.body.nome || payload.name || '').trim();

        if (!cpf || !birthDate || !genderId || !phone) {
            throw new AppError('Informe CPF, nascimento, gênero e telefone para criar sua conta.', 422, 'PROFILE_REQUIRED');
        }
        if (name.length < 2 || name.length > 255 || !validators.cpf(cpf) || !validators.phone(phone)) {
            throw invalidRequest('Confira nome, CPF e telefone.');
        }

        const date = new Date(`${birthDate}T00:00:00Z`);
        if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== birthDate || date >= new Date()) {
            throw invalidRequest('Data de nascimento inválida.');
        }
        if (!Number.isInteger(genderId) || !(await dao.genderExists(genderId))) throw invalidRequest('Gênero inválido.');

        try {
            const userId = await dao.transaction(async (transaction) => {
                if (await dao.cpfExists(String(cpf).replace(/\D/g, ''), transaction)) {
                    throw new AppError('CPF já cadastrado.', 409, 'CPF_IN_USE');
                }
                if (await dao.contactExists({ email, phone }, transaction)) {
                    throw new AppError('E-mail ou telefone já cadastrado.', 409, 'CONTACT_IN_USE');
                }

                const id = await dao.create({
                    nome: name,
                    cpf: String(cpf).replace(/\D/g, ''),
                    data_nascimento: birthDate,
                    id_genero: genderId,
                    email,
                    telefone: phone,
                    senha_hash: null,
                }, transaction);
                await dao.markContactVerified(email, 'email', transaction);
                return id;
            });

            created = true;
            user = { id: userId, id_status_usuario: (await dao.getVerificationState(userId)).activeStatus };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new AppError('CPF, e-mail ou telefone já cadastrado.', 409, 'DUPLICATE_USER');
            throw error;
        }
    } else if (!user.verificado) {
        await dao.markContactVerified(email, 'email');
    }

    // Contas novas precisam confirmar o telefone antes do primeiro acesso.
    if (created) {
        const phone = String(request.body.telefone).replace(/[\s()-]/g, '');
        const notification = await sendCode(user.id, phone, 'telefone');
        return response.status(202).json({
            codigo: 'PHONE_VERIFICATION_REQUIRED',
            mensagem: 'Conta criada. Confirme o telefone para concluir o acesso.',
            id_usuario: user.id,
            notificacao_enviada: notification.enviado,
        });
    }

    const contacts = await dao.getVerificationState(user.id);
    if (user.id_status_usuario !== contacts.activeStatus) throw new AppError('Conta desativada.', 403, 'ACCOUNT_DISABLED');
    if (!contacts.phoneVerified) throw new AppError('Confirme seu telefone antes de entrar.', 403, 'PHONE_UNVERIFIED');

    // Emite o token para uma conta existente e confirmada.
    response.json({ token: sign({ sub: String(user.id) }), tipo: 'Bearer', usuario: { id: user.id } });
};

module.exports = { loginGoogle };
