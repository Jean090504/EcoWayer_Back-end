const database = require('../../../database/database');

// Busca uma entrega e as duas pessoas que podem confirmar o QR code.
const buscarEntrega = (deliveryId, connection = database) => connection('tbl_entrega as delivery')
    .join('tbl_anuncio as ad', 'ad.id', 'delivery.id_anuncio')
    .select(
        'delivery.id',
        'delivery.id_anuncio',
        'delivery.id_usuario as id_recebedor',
        'delivery.status as status_entrega',
        'ad.id_usuario as id_anunciante'
    )
    .where('delivery.id', deliveryId)
    .first();

// Invalida códigos anteriores da mesma entrega antes de gerar outro.
const cancelarCodigosAtivos = async (deliveryId, connection = database) => {
    const codes = await connection('tbl_qr_code_entrega as link')
        .join('tbl_qr_code as qr', 'qr.id', 'link.id_qr_code')
        .select('qr.id')
        .where('link.id_entrega', deliveryId)
        .where('qr.status', 'ativo');

    if (codes.length) {
        await connection('tbl_qr_code')
            .whereIn('id', codes.map((code) => code.id))
            .update({ status: 'cancelado' });
    }
};

// Salva o código e sua ligação com a entrega e o anúncio.
const criar = async ({ code, createdAt, expiresAt, userId, delivery }, connection) => {
    const [qrId] = await connection('tbl_qr_code').insert({
        codigo: code,
        data_criacao: createdAt,
        data_expiracao: expiresAt,
        status: 'ativo',
        id_usuario_gerador: userId,
    });

    await connection('tbl_qr_code_entrega').insert({
        id_qr_code: qrId,
        id_anuncio: delivery.id_anuncio,
        id_entrega: delivery.id,
    });

    return qrId;
};

// Bloqueia o QR code durante a validação para impedir leituras duplicadas.
const buscarPorCodigoParaAtualizar = (code, connection) => connection('tbl_qr_code as qr')
    .join('tbl_qr_code_entrega as link', 'link.id_qr_code', 'qr.id')
    .join('tbl_entrega as delivery', 'delivery.id', 'link.id_entrega')
    .join('tbl_anuncio as ad', 'ad.id', 'link.id_anuncio')
    .select(
        'qr.id as id_qr_code',
        'qr.status as status_qr',
        'qr.data_expiracao',
        'qr.id_usuario_gerador',
        'delivery.id as id_entrega',
        'delivery.id_usuario as id_recebedor',
        'delivery.status as status_entrega',
        'link.id_anuncio',
        'ad.id_usuario as id_anunciante',
        'ad.id_categoria'
    )
    .where('qr.codigo', code)
    .forUpdate()
    .first();

// Registra a tentativa. O trigger credita pontos somente para status "valida".
const registrarLeitura = (data, connection) => connection('tbl_leitura_qr_code').insert({
    data_leitura: new Date(),
    status: data.status,
    id_qr_code: data.qrId,
    id_usuario: data.userId,
});

const marcarComoUtilizado = (qrId, connection) => connection('tbl_qr_code')
    .where({ id: qrId, status: 'ativo' })
    .update({ status: 'utilizado' });

// Usa a função de validação de validade criada no banco.
const estaAtivo = async (code, connection) => {
    const [rows] = await connection.raw(
        'SELECT fn_validar_qr_code_ativo(?) AS valido',
        [code]
    );
    return Boolean(Number(rows[0]?.valido));
};

const buscarPontosCreditados = (userId, categoryId, connection) => connection('tbl_pontos')
    .select('qntd_pontos')
    .where({ id_usuario: userId, id_categoria: categoryId })
    .orderBy('id', 'desc')
    .first();

const contarPontosCreditados = async (userId, categoryId, connection) => {
    const result = await connection('tbl_pontos')
        .where({ id_usuario: userId, id_categoria: categoryId })
        .count({ total: 'id' })
        .first();
    return Number(result?.total || 0);
};

module.exports = {
    buscarEntrega,
    cancelarCodigosAtivos,
    criar,
    buscarPorCodigoParaAtualizar,
    registrarLeitura,
    marcarComoUtilizado,
    estaAtivo,
    buscarPontosCreditados,
    contarPontosCreditados,
};
