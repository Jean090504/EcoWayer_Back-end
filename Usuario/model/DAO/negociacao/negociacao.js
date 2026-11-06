const database = require('../../../database/database');

// Salva e consulta propostas vinculadas a uma conversa.
const criar = async ({ conversationId, userId, parentId, value, pickupLocation }, connection) => {
    const [id] = await connection('tbl_negociacao').insert({
        id_conversa: conversationId,
        id_usuario: userId,
        id_negociacao_pai: parentId || null,
        valor_ofertado: value,
        local_retirada: pickupLocation,
        status: 'pendente',
        criada_em: new Date(),
        atualizada_em: new Date(),
    });
    return buscarPorId(id, connection);
};

const buscarPorId = (id, connection = database) => connection('tbl_negociacao as offer')
    .join('tbl_conversa as conversation', 'conversation.id', 'offer.id_conversa')
    .join('tbl_anuncio as ad', 'ad.id', 'conversation.id_anuncio')
    .select(
        'offer.id', 'offer.id_conversa', 'offer.id_usuario', 'offer.id_negociacao_pai',
        'offer.valor_ofertado', 'offer.local_retirada', 'offer.status', 'offer.criada_em',
        'conversation.id_anuncio', 'conversation.id_usuario as id_comprador', 'ad.id_usuario as id_vendedor', 'ad.nome as anuncio'
    )
    .where('offer.id', id)
    .first();

const listarDoUsuario = (userId, connection = database) => connection('tbl_negociacao as offer')
    .join('tbl_conversa as conversation', 'conversation.id', 'offer.id_conversa')
    .join('tbl_anuncio as ad', 'ad.id', 'conversation.id_anuncio')
    .select(
        'offer.id', 'offer.id_conversa', 'offer.id_usuario', 'offer.id_negociacao_pai',
        'offer.valor_ofertado', 'offer.local_retirada', 'offer.status', 'offer.criada_em',
        'conversation.id_anuncio', 'ad.nome as anuncio'
    )
    .where((query) => query.where('conversation.id_usuario', userId).orWhere('ad.id_usuario', userId))
    .orderBy('offer.criada_em', 'desc');

const atualizarStatus = (id, status, connection = database) => connection('tbl_negociacao')
    .where({ id })
    .update({ status, atualizada_em: new Date() });

const encerrarOutrasPendentes = (conversationId, exceptId, connection = database) => connection('tbl_negociacao')
    .where({ id_conversa: conversationId, status: 'pendente' })
    .whereNot('id', exceptId)
    .update({ status: 'recusada', atualizada_em: new Date() });

module.exports = { criar, buscarPorId, listarDoUsuario, atualizarStatus, encerrarOutrasPendentes };
