const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { hash } = require('../../utils/password');
const validators = require('../../utils/validators');
const { invalidRequest, sendCode } = require('../../utils/usuario_helpers');

// Valida e guarda um endereço opcional do cadastro.
const validarEndereco = (address) => {
    if (address === undefined) return;
    if (!address || typeof address !== 'object' || Array.isArray(address)) throw invalidRequest('Endereço inválido.');

    const camposObrigatorios = [
        'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'sigla', 'id_externo',
    ];
    const campoObrigatorioInvalido = camposObrigatorios.some((campo) => (
        typeof address[campo] !== 'string' || !address[campo].trim()
    ));

    const limitesExcedidos = address.cep.length > 9
        || address.rua.length > 100
        || address.numero.length > 10
        || address.bairro.length > 100
        || address.cidade.length > 100
        || address.estado.length > 100
        || address.sigla.length > 3
        || String(address.complemento || '').length > 50;

    const latitudeInvalida = address.latitude !== undefined
        && (!Number.isFinite(Number(address.latitude))
            || Number(address.latitude) < -90
            || Number(address.latitude) > 90);
    const longitudeInvalida = address.longitude !== undefined
        && (!Number.isFinite(Number(address.longitude))
            || Number(address.longitude) < -180
            || Number(address.longitude) > 180);

    if (campoObrigatorioInvalido || limitesExcedidos || latitudeInvalida || longitudeInvalida) {
        throw invalidRequest('Endereço incompleto ou inválido.');
    }
};

const cadastrarUsuario = async (request, response) => {
    const { nome, cpf, data_nascimento, id_genero, email, telefone, senha, endereco } = request.body;

    // Confere os campos obrigatórios antes de consultar o banco.
    const dadosInvalidos = typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 255
        || !data_nascimento || !Number.isInteger(Number(id_genero)) || !validators.cpf(cpf)
        || !validators.email.test(email || '') || !validators.phone(telefone)
        || !validators.password.test(senha || '');

    if (dadosInvalidos) throw invalidRequest('Confira nome, CPF, nascimento, gênero, e-mail, telefone e senha.');

    const nascimento = new Date(`${data_nascimento}T00:00:00Z`);
    if (Number.isNaN(nascimento.valueOf()) || nascimento.toISOString().slice(0, 10) !== data_nascimento || nascimento >= new Date()) {
        throw invalidRequest('Data de nascimento inválida.');
    }

    // Confere o endereço opcional antes de salvar o cadastro.
    validarEndereco(endereco);

    // Padroniza os contatos para evitar cadastros duplicados por formatação.
    const emailNormalizado = email.trim().toLowerCase();
    const telefoneNormalizado = telefone.replace(/[\s()-]/g, '');
    const cpfNormalizado = cpf.replace(/\D/g, '');
    const generoExiste = await dao.genderExists(Number(id_genero));

    if (!generoExiste) throw invalidRequest('Gênero inválido.');
    if (await dao.contactExists({ email: emailNormalizado, phone: telefoneNormalizado })) {
        throw new AppError('E-mail ou telefone já cadastrado.', 409, 'CONTACT_IN_USE');
    }

    // Cria usuário, contatos e endereço dentro de uma transação.
    let userId;
    try {
        userId = await dao.transaction(async (transaction) => {
            const cpfExiste = await dao.cpfExists(cpfNormalizado, transaction);
            if (cpfExiste) throw new AppError('CPF já cadastrado.', 409, 'CPF_IN_USE');

            const camposEndereco = [
                'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade',
                'estado', 'sigla', 'id_externo', 'latitude', 'longitude',
            ];
            const addressData = endereco
                ? Object.fromEntries(
                    camposEndereco
                        .filter((campo) => endereco[campo] !== undefined)
                        .map((campo) => [campo, endereco[campo]])
                )
                : undefined;

            return dao.create({
                nome: nome.trim(),
                cpf: cpfNormalizado,
                data_nascimento,
                id_genero: Number(id_genero),
                email: emailNormalizado,
                telefone: telefoneNormalizado,
                senha_hash: await hash(senha),
                endereco: addressData,
            }, transaction);
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') throw new AppError('CPF, e-mail ou telefone já cadastrado.', 409, 'DUPLICATE_USER');
        throw error;
    }

    // Envia os códigos de confirmação depois que o cadastro foi salvo.
    const emailNotice = await sendCode(userId, emailNormalizado, 'email');
    const phoneNotice = await sendCode(userId, telefoneNormalizado, 'telefone');

    response.status(201).json({
        mensagem: 'Cadastro realizado. Confirme seu e-mail e telefone para ativar o acesso.',
        id_usuario: userId,
        notificacoes: { email: emailNotice.enviado, telefone: phoneNotice.enviado },
    });
};

module.exports = { cadastrarUsuario };
