const database = require('../../../database/database');

// Cria uma entrega para uma negociação aceita.
const criar = async ({ negotiationId, adId, recipientId, weight, scheduledAt }, connection = database) => {
    const [deliveryId] = await connection('tbl_entrega').insert({
        peso_estimado: weight,
        status: 'pendente',
        data_entrega: scheduledAt,
        id_anuncio: adId,
        id_usuario: recipientId,
        id_negociacao: negotiationId,
    });

    return connection('tbl_entrega').where({ id: deliveryId }).first();
};

const buscarPorNegociacao = (negotiationId, connection = database) => connection('tbl_entrega')
    .where({ id_negociacao: negotiationId })
    .first();

module.exports = { criar, buscarPorNegociacao };
