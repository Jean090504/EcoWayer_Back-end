const database = require('../../../database/database');

// Busca conversas e confirma se o usuário pode acessá-las.
const buscarConversa = (id, connection = database) => connection('tbl_conversa as conversation')
    .join('tbl_anuncio as ad', 'ad.id', 'conversation.id_anuncio')
    .select('conversation.id', 'conversation.id_anuncio', 'conversation.id_usuario', 'ad.id_usuario as id_vendedor', 'ad.nome as anuncio')
    .where('conversation.id', id)
    .first();

const listarConversas = (userId, connection = database) => connection('tbl_conversa as conversation')
    .join('tbl_anuncio as ad', 'ad.id', 'conversation.id_anuncio')
    .join('tbl_usuario as buyer', 'buyer.id', 'conversation.id_usuario')
    .join('tbl_usuario as seller', 'seller.id', 'ad.id_usuario')
    .select('conversation.id', 'conversation.id_anuncio', 'ad.nome as anuncio', 'conversation.id_usuario', 'buyer.nome as comprador', 'seller.nome as vendedor', 'ad.id_usuario as id_vendedor')
    .where((query) => query.where('conversation.id_usuario', userId).orWhere('ad.id_usuario', userId))
    .orderBy('conversation.id', 'desc');

const ehParticipante = async (conversationId, userId, connection = database) => {
    const conversation = await buscarConversa(conversationId, connection);
    return Boolean(conversation && [conversation.id_usuario, conversation.id_vendedor].includes(Number(userId)));
};

const buscarOuCriarConversa = async (adId, buyerId, connection = database) => {
    const ad = await connection('tbl_anuncio').select('id', 'id_usuario').where({ id: adId }).first();
    if (!ad) return null;
    if (Number(ad.id_usuario) === Number(buyerId)) return null;

    let conversation = await connection('tbl_conversa')
        .where({ id_anuncio: adId, id_usuario: buyerId })
        .first();

    if (!conversation) {
        const [id] = await connection('tbl_conversa').insert({ id_anuncio: adId, id_usuario: buyerId });
        conversation = { id, id_anuncio: adId, id_usuario: buyerId };
    }

    return conversation;
};

// Lista, registra e marca mensagens como lidas.
const listarMensagens = (conversationId, connection = database) => connection('tbl_mensagens as message')
    .join('tbl_usuario as sender', 'sender.id', 'message.id_remetente')
    .select('message.id', 'message.texto', 'message.envio', 'message.lida', 'message.id_conversa', 'message.id_remetente', 'sender.nome as remetente')
    .where('message.id_conversa', conversationId)
    .orderBy('message.envio', 'asc');

const criarMensagem = async ({ conversationId, userId, text }, connection = database) => {
    const [id] = await connection('tbl_mensagens').insert({
        texto: text,
        envio: new Date(),
        lida: false,
        id_conversa: conversationId,
        id_remetente: userId,
    });

    return connection('tbl_mensagens as message')
        .join('tbl_usuario as sender', 'sender.id', 'message.id_remetente')
        .select('message.id', 'message.texto', 'message.envio', 'message.lida', 'message.id_conversa', 'message.id_remetente', 'sender.nome as remetente')
        .where('message.id', id)
        .first();
};

const marcarMensagensLidas = (conversationId, userId, connection = database) => connection('tbl_mensagens')
    .where({ id_conversa: conversationId })
    .whereNot('id_remetente', userId)
    .update({ lida: true });

module.exports = { buscarConversa, listarConversas, ehParticipante, buscarOuCriarConversa, listarMensagens, criarMensagem, marcarMensagensLidas };
