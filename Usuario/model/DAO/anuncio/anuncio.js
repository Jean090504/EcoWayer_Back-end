const database = require('../../../database/database');

// Busca os dados de um anúncio para exibição.
const buscarPorId = (id, connection = database) => connection('tbl_anuncio as ad')
    .join('tbl_usuario as user', 'user.id', 'ad.id_usuario')
    .join('tbl_categoria as category', 'category.id', 'ad.id_categoria')
    .join('tbl_modalidade as modality', 'modality.id', 'ad.id_modalidade')
    .join('tbl_condicao_item as condition', 'condition.id', 'ad.id_condicao_item')
    .select(
        'ad.id', 'ad.nome', 'ad.descricao', 'ad.valor', 'ad.data_publicacao',
        'ad.id_usuario', 'user.nome as anunciante', 'category.nome as categoria',
        'modality.nome as modalidade', 'condition.nome as condicao'
    )
    .where('ad.id', id)
    .first();

// Lista anúncios ativos e aplica os filtros disponíveis.
const listarAtivos = (filters = {}, connection = database) => {
    const query = connection('tbl_anuncio as ad')
        .join('tbl_usuario as user', 'user.id', 'ad.id_usuario')
        .join('tbl_categoria as category', 'category.id', 'ad.id_categoria')
        .join('tbl_modalidade as modality', 'modality.id', 'ad.id_modalidade')
        .join('tbl_condicao_item as condition', 'condition.id', 'ad.id_condicao_item')
        .select(
            'ad.id', 'ad.nome', 'ad.descricao', 'ad.valor', 'ad.data_publicacao',
            'ad.id_usuario', 'user.nome as anunciante', 'category.nome as categoria',
            'modality.nome as modalidade', 'condition.nome as condicao'
        )
        .select(connection.raw("COALESCE((SELECT history.status FROM tbl_historico_anuncio history WHERE history.id_anuncio = ad.id ORDER BY history.data_alteracao DESC, history.id DESC LIMIT 1), 'ativo') as status"))
        .select(connection.raw('(SELECT image.url FROM tbl_imagem_anuncio link JOIN tbl_imagem image ON image.id = link.id_imagem WHERE link.id_anuncio = ad.id ORDER BY link.id LIMIT 1) as imagem'))
        .whereRaw("COALESCE((SELECT history.status FROM tbl_historico_anuncio history WHERE history.id_anuncio = ad.id ORDER BY history.data_alteracao DESC, history.id DESC LIMIT 1), 'ativo') = 'ativo'");

    if (filters.id_categoria) query.where('ad.id_categoria', filters.id_categoria);
    if (filters.modalidade) query.where('modality.nome', filters.modalidade);
    return query.orderBy('ad.data_publicacao', 'desc');
};

// Cria anúncio, histórico inicial e imagem opcional.
const criar = async (ad, imageUrl, connection) => {
    const imageType = await connection('tbl_tipo_imagem').select('id').where('tipo', 'Anúncio').first();
    if (!imageType) throw new Error('Tipo de imagem "Anúncio" não cadastrado.');

    const [adId] = await connection('tbl_anuncio').insert({
        nome: ad.nome,
        descricao: ad.descricao || null,
        valor: ad.valor,
        data_publicacao: new Date(),
        id_usuario: ad.id_usuario,
        id_categoria: ad.id_categoria,
        id_modalidade: ad.id_modalidade,
        id_condicao_item: ad.id_condicao_item,
    });

    // O trigger trg_anuncio_after_insert cria o histórico inicial.
    if (imageUrl) {
        const [imageId] = await connection('tbl_imagem').insert({ url: imageUrl, id_tipo_imagem: imageType.id });
        await connection('tbl_imagem_anuncio').insert({ id_imagem: imageId, id_anuncio: adId });
    }

    return adId;
};

// Registra as mudanças de status no histórico do anúncio.
const atualizarStatus = async (adId, status, details, connection = database) => {
    await connection('tbl_historico_anuncio').insert({
        status,
        data_alteracao: new Date(),
        detalhes: details || null,
        id_anuncio: adId,
    });
};

const buscarCoordsDoAnunciante = (userId, connection = database) => connection('tbl_endereco_usuario as link')
    .join('tbl_endereco as address', 'address.id', 'link.id_endereco')
    .select('address.latitude', 'address.longitude')
    .where('link.id_usuario', userId)
    .whereNotNull('address.latitude')
    .whereNotNull('address.longitude')
    .first();

const buscarStatus = async (adId, connection = database) => {
    const history = await connection('tbl_historico_anuncio')
        .select('status')
        .where({ id_anuncio: adId })
        .orderBy('data_alteracao', 'desc')
        .orderBy('id', 'desc')
        .first();
    return history?.status || 'ativo';
};

const existeReferencia = (table, id, connection = database) => connection(table).where({ id }).first();

// Aplica a regra de disponibilidade definida no banco.
const verificarDisponibilidade = async (adId, connection = database) => {
    const [rows] = await connection.raw(
        'SELECT fn_verificar_anuncio_disponivel(?) AS disponivel',
        [adId]
    );
    return Boolean(Number(rows[0]?.disponivel));
};

module.exports = {
    buscarPorId,
    listarAtivos,
    criar,
    atualizarStatus,
    buscarCoordsDoAnunciante,
    buscarStatus,
    existeReferencia,
    verificarDisponibilidade,
};
