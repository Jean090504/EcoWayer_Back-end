const chatDAO = require('../../model/DAO/chat/chat');
const adDAO = require('../../model/DAO/anuncio/anuncio');
const offerDAO = require('../../model/DAO/negociacao/negociacao');
const userDAO = require('../../model/DAO/usuario/usuario');
const notificationService = require('../../services/notificacao_service');
const AppError = require('../../utils/AppError');

// Cria uma proposta ou contraproposta para um anúncio.
const criarProposta = async (request, response) => {
    const userId = Number(request.auth.sub);
    const adId = Number(request.body.id_anuncio);
    const value = Number(request.body.valor_ofertado);
    const pickupLocation = String(request.body.local_retirada || '').trim();
    const parentId = request.body.id_negociacao_pai ? Number(request.body.id_negociacao_pai) : null;

    const anuncioInvalido = !Number.isInteger(adId) || adId < 1;
    const valorInvalido = !Number.isFinite(value) || value <= 0;
    const localInvalido = pickupLocation.length < 2 || pickupLocation.length > 255;

    if (anuncioInvalido || valorInvalido || localInvalido) {
        throw new AppError('Informe anúncio, valor positivo e local de retirada.', 400, 'VALIDATION_ERROR');
    }

    // Usa a conversa enviada ou abre uma para o anúncio.
    let conversation;
    if (request.body.id_conversa) {
        const conversationId = Number(request.body.id_conversa);
        if (!(await chatDAO.ehParticipante(conversationId, userId))) {
            throw new AppError('Conversa não encontrada.', 404, 'CONVERSATION_NOT_FOUND');
        }
        conversation = await chatDAO.buscarConversa(conversationId);
        if (Number(conversation.id_anuncio) !== adId) {
            throw new AppError(
                'A conversa pertence a outro anúncio.',
                400,
                'CONVERSATION_AD_MISMATCH'
            );
        }
    } else {
        conversation = await chatDAO.buscarOuCriarConversa(adId, userId);
        if (!conversation) throw new AppError('Anúncio não encontrado ou pertence a você.', 400, 'INVALID_AD');
        conversation = await chatDAO.buscarConversa(conversation.id);
    }

    const adStatus = await adDAO.buscarStatus(adId);
    const adAvailable = await adDAO.verificarDisponibilidade(adId);
    if (adStatus !== 'ativo' || !adAvailable) {
        throw new AppError('Este anúncio não aceita propostas.', 409, 'AD_NOT_AVAILABLE');
    }

    // Confere a proposta anterior quando for uma contraproposta.
    let parentOffer;
    if (parentId) {
        parentOffer = await offerDAO.buscarPorId(parentId);
        const propostaNaoEncontrada = !parentOffer
            || Number(parentOffer.id_conversa) !== Number(conversation.id);
        if (propostaNaoEncontrada) {
            throw new AppError('Proposta original não encontrada.', 404, 'OFFER_NOT_FOUND');
        }
        if (Number(parentOffer.id_usuario) === userId || !['pendente', 'contraproposta'].includes(parentOffer.status)) {
            throw new AppError('Não é possível responder a esta proposta.', 409, 'OFFER_NOT_OPEN');
        }
    }

    // Atualiza a proposta anterior e salva a nova na mesma transação.
    let offer;
    await userDAO.transaction(async (transaction) => {
        if (parentOffer) await offerDAO.atualizarStatus(parentOffer.id, 'contraproposta', transaction);
        offer = await offerDAO.criar({
            conversationId: conversation.id,
            userId,
            parentId,
            value,
            pickupLocation,
        }, transaction);
    });

    const recipientId = userId === Number(conversation.id_usuario)
        ? conversation.id_vendedor
        : conversation.id_usuario;
    await notificationService.criarNotificacao({
        userId: recipientId,
        type: 'negociacao',
        title: 'Nova proposta',
        message: `Você recebeu uma proposta para ${conversation.anuncio}.`,
        data: { id_negociacao: offer.id, id_conversa: conversation.id },
    });

    response.status(201).json({ mensagem: 'Proposta enviada.', negociacao: offer });
};

const atualizarStatus = async (request, response) => {
    const offerId = Number(request.params.id);
    const userId = Number(request.auth.sub);
    const status = String(request.body.status || '');
    if (!['aceita', 'recusada'].includes(status)) {
        throw new AppError('Status deve ser aceita ou recusada.', 400, 'VALIDATION_ERROR');
    }

    const offer = await offerDAO.buscarPorId(offerId);
    if (!offer) throw new AppError('Proposta não encontrada.', 404, 'OFFER_NOT_FOUND');
    if (![Number(offer.id_comprador), Number(offer.id_vendedor)].includes(userId) || Number(offer.id_usuario) === userId) {
        throw new AppError('Somente a outra parte pode responder a esta proposta.', 403, 'FORBIDDEN');
    }
    if (offer.status !== 'pendente') throw new AppError('Esta proposta já foi respondida.', 409, 'OFFER_NOT_OPEN');

    // Se aceita, encerra outras propostas e marca o anúncio como negociado.
    await userDAO.transaction(async (transaction) => {
        await offerDAO.atualizarStatus(offer.id, status, transaction);
        if (status === 'aceita') {
            await offerDAO.encerrarOutrasPendentes(offer.id_conversa, offer.id, transaction);
            await adDAO.atualizarStatus(offer.id_anuncio, 'negociado', `Proposta ${offer.id} aceita.`, transaction);
        }
    });

    await notificationService.criarNotificacao({
        userId: Number(offer.id_usuario),
        type: 'negociacao',
        title: status === 'aceita' ? 'Proposta aceita' : 'Proposta recusada',
        message: `Sua proposta para ${offer.anuncio} foi ${status}.`,
        data: { id_negociacao: offer.id },
    });

    response.json({ mensagem: `Proposta ${status}.`, id_negociacao: offer.id, status });
};

const listarNegociacoes = async (request, response) => {
    // Lista propostas em que o usuário participa como comprador ou vendedor.
    const offers = await offerDAO.listarDoUsuario(Number(request.auth.sub));
    response.json({ count: offers.length, negociacoes: offers });
};

module.exports = { criarProposta, atualizarStatus, listarNegociacoes };
