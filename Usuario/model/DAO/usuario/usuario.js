const database = require('../../../database/database');

const publicColumns = [
    'user.id', 'user.nome', 'user.cpf', 'user.data_nascimento', 'user.id_genero',
    'image.url as avatar', 'email.email', 'phone.numero as telefone', 'status.status as status_conta',
];

// Mantém aqui as consultas e gravações da tabela de usuários.
const transaction = (callback) => database.transaction(callback);

// Busca dados de usuário para autenticação e perfil.
const findByLogin = (login, connection = database) => connection('tbl_usuario as user')
    .leftJoin('tbl_email as email', 'email.id_usuario', 'user.id')
    .leftJoin('tbl_telefone as phone', 'phone.id_usuario', 'user.id')
    .select('user.id', 'user.senha_hash', 'user.id_status_usuario')
    .where('email.email', login)
    .orWhere('phone.numero', login)
    .first();

const findByEmail = (email, connection = database) => connection('tbl_usuario as user')
    .join('tbl_email as contact', 'contact.id_usuario', 'user.id')
    .select('user.id', 'user.nome', 'user.senha_hash', 'user.id_status_usuario', 'contact.verificado')
    .where('contact.email', email)
    .first();

const findById = (id, connection = database) => connection('tbl_usuario as user')
    .leftJoin('tbl_email as email', 'email.id_usuario', 'user.id')
    .leftJoin('tbl_telefone as phone', 'phone.id_usuario', 'user.id')
    .leftJoin('tbl_imagem as image', 'image.id', 'user.id_imagem')
    .leftJoin('tbl_status_usuario as status', 'status.id', 'user.id_status_usuario')
    .select([...publicColumns, 'user.senha_hash'])
    .where('user.id', id)
    .first();

// Confere contatos únicos e estado de verificação.
const findByContact = async (contact, connection = database) => {
    const email = await connection('tbl_email').select('id_usuario as id').where('email', contact).first();
    return email || connection('tbl_telefone').select('id_usuario as id').where('numero', contact).first();
};

const getVerificationState = async (id, connection = database) => {
    const [email, phone, active] = await Promise.all([
        connection('tbl_email').select('verificado').where({ id_usuario: id }).first(),
        connection('tbl_telefone').select('verificado').where({ id_usuario: id }).first(),
        connection('tbl_status_usuario').select('id').where({ status: 'ativo' }).first(),
    ]);

    return { emailVerified: Boolean(email?.verificado), phoneVerified: Boolean(phone?.verificado), activeStatus: active?.id };
};

const genderExists = async (id, connection = database) => Boolean(await connection('tbl_genero').where({ id }).first());

const cpfExists = async (cpf, connection = database) => Boolean(await connection('tbl_usuario')
    .whereRaw("REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?", [cpf])
    .first());

const isActive = async (id, connection = database) => {
    const user = await connection('tbl_usuario as user')
        .join('tbl_status_usuario as status', 'status.id', 'user.id_status_usuario')
        .select('status.status')
        .where('user.id', id)
        .first();
    return user?.status === 'ativo';
};

const contactExists = async ({ email, phone }, connection = database) => {
    if (email && await connection('tbl_email').where({ email }).first()) return true;
    if (phone && await connection('tbl_telefone').where({ numero: phone }).first()) return true;
    return false;
};

// Cria usuário e dados relacionados dentro da mesma transação.
const create = async (data, connection) => {
    const imageType = await connection('tbl_tipo_imagem').select('id').where('tipo', 'Perfil').first();
    const status = await connection('tbl_status_usuario').select('id').where('status', 'ativo').first();
    const level = await connection('tbl_nivel_impacto').select('id').orderBy('numero').first();
    if (!imageType || !status || !level) throw new Error('Execute os dados de referência antes do cadastro.');

    const [imageId] = await connection('tbl_imagem').insert({ url: 'https://placehold.co/256x256?text=EcoWayer', id_tipo_imagem: imageType.id });
    const [userId] = await connection('tbl_usuario').insert({
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        id_imagem: imageId,
        id_genero: data.id_genero,
        id_status_usuario: status.id,
        id_nivel_impacto: level.id,
        senha_hash: data.senha_hash,
    });

    await connection('tbl_email').insert({ email: data.email, codigo_verificacao: '000000', id_usuario: userId });
    await connection('tbl_telefone').insert({ numero: data.telefone, codigo_verificacao: '000000', id_usuario: userId });

    if (data.endereco) {
        const [addressId] = await connection('tbl_endereco').insert(data.endereco);
        await connection('tbl_endereco_usuario').insert({ id_endereco: addressId, id_usuario: userId });
    }

    return userId;
};

// Gerencia os códigos de confirmação e recuperação de senha.
const saveCode = async ({ userId, contact, codeHash, purpose, expiresAt }, connection = database) => {
    await connection('tbl_codigo_usuario').where({ id_usuario: userId, finalidade: purpose }).del();
    await connection('tbl_codigo_usuario').insert({
        id_usuario: userId, contato: contact, codigo_hash: codeHash, finalidade: purpose, expira_em: expiresAt,
    });
};

const getCode = (contact, purpose, connection = database) => connection('tbl_codigo_usuario').where({ contato: contact, finalidade: purpose }).first();
const deleteCode = (id, connection = database) => connection('tbl_codigo_usuario').where({ id }).del();
const incrementCodeAttempts = (id, connection = database) => connection('tbl_codigo_usuario').where({ id }).increment('tentativas', 1);

const markContactVerified = async (contact, purpose, connection = database) => {
    if (purpose === 'email') await connection('tbl_email').where({ email: contact }).update({ verificado: true });
    if (purpose === 'telefone') await connection('tbl_telefone').where({ numero: contact }).update({ verificado: true });
};

// Atualiza perfil e contatos, ou anonimiza uma conta excluída.
const setPassword = (id, passwordHash, connection = database) => connection('tbl_usuario').where({ id }).update({ senha_hash: passwordHash });
const updateProfile = (id, data, connection = database) => connection('tbl_usuario').where({ id }).update(data);
const updateEmail = (id, email, connection = database) => connection('tbl_email').where({ id_usuario: id }).update({ email, codigo_verificacao: '000000', verificado: false });

const updateAvatar = async (id, url, connection = database) => {
    const imageType = await connection('tbl_tipo_imagem').select('id').where('tipo', 'Perfil').first();
    const [imageId] = await connection('tbl_imagem').insert({ url, id_tipo_imagem: imageType.id });
    await connection('tbl_usuario').where({ id }).update({ id_imagem: imageId });
};

const getAddress = (id, connection = database) => connection('tbl_endereco_usuario as user_address')
    .join('tbl_endereco as address', 'address.id', 'user_address.id_endereco')
    .select('address.*')
    .where('user_address.id_usuario', id)
    .first();

const getCoordinates = async (id, connection = database) => {
    const address = await connection('tbl_endereco_usuario as user_address')
        .join('tbl_endereco as address', 'address.id', 'user_address.id_endereco')
        .select('address.latitude', 'address.longitude')
        .where('user_address.id_usuario', id)
        .whereNotNull('address.latitude')
        .whereNotNull('address.longitude')
        .first();
    return address || null;
};

const erase = async (id, connection = database) => {
    const addresses = await connection('tbl_endereco_usuario').select('id_endereco').where({ id_usuario: id });
    await connection('tbl_endereco_usuario').where({ id_usuario: id }).del();

    for (const { id_endereco: addressId } of addresses) {
        const stillLinked = await connection('tbl_endereco_usuario').where({ id_endereco: addressId }).first();
        const collectionAddress = await connection('tbl_endereco_ponto_coleta').where({ id_endereco: addressId }).first();
        if (!stillLinked && !collectionAddress) await connection('tbl_endereco').where({ id: addressId }).del();
    }

    await connection('tbl_codigo_usuario').where({ id_usuario: id }).del();
    await connection('tbl_email').where({ id_usuario: id }).update({ email: `excluido+${id}@invalid.ecowayer` });
    await connection('tbl_telefone').where({ id_usuario: id }).update({ numero: `deleted${id}` });

    const inactiveStatus = await connection('tbl_status_usuario').select('id').where('status', 'desativado').first();
    await connection('tbl_usuario').where({ id }).update({
        nome: 'Usuário removido',
        cpf: `000.${String(id).padStart(3, '0')}.000-${String(id % 100).padStart(2, '0')}`,
        senha_hash: null,
        id_status_usuario: inactiveStatus.id,
    });
};

module.exports = {
    transaction, findByLogin, findByEmail, findById, findByContact, getVerificationState,
    genderExists, cpfExists, isActive, contactExists, create, saveCode, getCode,
    deleteCode, incrementCodeAttempts, markContactVerified, setPassword,
    updateProfile, updateEmail, updateAvatar, getAddress, getCoordinates, erase,
};
