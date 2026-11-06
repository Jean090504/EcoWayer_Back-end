const dao = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');
const { invalidRequest, removePrivateFields } = require('../../utils/usuario_helpers');

// Retorna os dados públicos do usuário autenticado e seu endereço.
const buscarMeuPerfil = async (request, response) => {
    const user = await dao.findById(Number(request.auth.sub));
    if (!user) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');

    const address = await dao.getAddress(user.id);
    response.json({ usuario: { ...removePrivateFields(user), endereco: address || null } });
};

const atualizarMeuPerfil = async (request, response) => {
    const data = {};

    // Atualiza somente os campos enviados na requisição.
    if (request.body.nome !== undefined) {
        if (typeof request.body.nome !== 'string') {
            throw invalidRequest('Nome inválido.');
        }

        const nome = request.body.nome.trim();
        if (nome.length < 2 || nome.length > 255) throw invalidRequest('Nome inválido.');
        data.nome = nome;
    }

    if (request.body.data_nascimento !== undefined) {
        const date = new Date(`${request.body.data_nascimento}T00:00:00Z`);
        const dataInvalida = Number.isNaN(date.valueOf())
            || date.toISOString().slice(0, 10) !== request.body.data_nascimento
            || date >= new Date();
        if (dataInvalida) throw invalidRequest('Data de nascimento inválida.');
        data.data_nascimento = request.body.data_nascimento;
    }

    if (request.body.id_genero !== undefined) {
        const genderId = Number(request.body.id_genero);
        if (!Number.isInteger(genderId) || !(await dao.genderExists(genderId))) throw invalidRequest('Gênero inválido.');
        data.id_genero = genderId;
    }

    // Evita gravar uma atualização sem nenhum campo válido.
    if (!Object.keys(data).length) throw invalidRequest('Informe ao menos um campo para atualizar.');

    await dao.updateProfile(Number(request.auth.sub), data);
    const user = await dao.findById(Number(request.auth.sub));
    response.json({ mensagem: 'Perfil atualizado.', usuario: removePrivateFields(user) });
};

module.exports = { buscarMeuPerfil, atualizarMeuPerfil };
