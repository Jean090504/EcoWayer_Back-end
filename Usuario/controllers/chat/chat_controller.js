const chatDAO = require('../../model/DAO/chat/chat');
const adDAO = require('../../model/DAO/anuncio/anuncio');
const notificationService = require('../../services/notificacao_service');
const AppError = require('../../utils/AppError');

// Abre ou recupera a conversa do usuário com o anunciante.
const criarConversa = async (request, response) => {
    const adId = Number(request.body.id_anuncio);
    if (!Number.isInteger(adId) || adId < 1) throw new AppError('Anúncio inválido.', 400, 'VALIDATION_ERROR');

    const ad = await adDAO.buscarPorId(adId);
    if (!ad) throw new AppError('Anúncio não encontrado.', 404, 'AD_NOT_FOUND');
    if (Number(ad.id_usuario) === Number(request.auth.sub)) {
        throw new AppError(
            'Não é possível iniciar conversa no próprio anúncio.',
            400,
            'OWN_AD'
        );
    }

    const conversation = await chatDAO.buscarOuCriarConversa(adId, Number(request.auth.sub));
    response.status(201).json({ conversa: conversation });
};

const listarConversas = async (request, response) => {
    const userId = Number(request.auth.sub);
    const conversations = await chatDAO.listarConversas(userId);
    const result = conversations.map((conversation) => ({
        ...conversation,
        outro_participante: userId === Number(conversation.id_usuario)
            ? conversation.vendedor
            : conversation.comprador,
    }));
    response.json({ count: result.length, conversas: result });
};

const listarMensagens = async (request, response) => {
    const conversationId = Number(request.params.id);
    if (!(await chatDAO.ehParticipante(conversationId, Number(request.auth.sub)))) {
        throw new AppError('Conversa não encontrada.', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Marca como lidas as mensagens recebidas nesta conversa.
    await chatDAO.marcarMensagensLidas(conversationId, Number(request.auth.sub));
    const messages = await chatDAO.listarMensagens(conversationId);
    response.json({ id_conversa: conversationId, count: messages.length, mensagens: messages });
};

const enviarMensagem = async (request, response) => {
    const conversationId = Number(request.params.id);
    const userId = Number(request.auth.sub);
    const text = String(request.body.texto || '').trim();

    if (!text || text.length > 5000) {
        throw new AppError(
            'A mensagem deve ter de 1 a 5000 caracteres.',
            400,
            'VALIDATION_ERROR'
        );
    }
    if (!(await chatDAO.ehParticipante(conversationId, userId))) {
        throw new AppError('Conversa não encontrada.', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Salva a mensagem e avisa a outra pessoa da conversa.
    const message = await chatDAO.criarMensagem({ conversationId, userId, text });
    const conversation = await chatDAO.buscarConversa(conversationId);
    const recipientId = Number(conversation.id_usuario) === userId
        ? conversation.id_vendedor
        : conversation.id_usuario;

    await notificationService.criarNotificacao({
        userId: recipientId,
        type: 'mensagem',
        title: 'Nova mensagem',
        message: `Você recebeu uma mensagem sobre ${conversation.anuncio}.`,
        data: { id_conversa: conversationId, id_mensagem: message.id },
    });

    response.status(201).json({ mensagem: message });
};

module.exports = { criarConversa, listarConversas, listarMensagens, enviarMensagem };
