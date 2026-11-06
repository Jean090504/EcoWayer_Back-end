const deliveryDAO = require('../../model/DAO/entrega/entrega');
const offerDAO = require('../../model/DAO/negociacao/negociacao');
const userDAO = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');

// Agenda a entrega de uma negociação já aceita.
const criarEntrega = async (request, response) => {
    const negotiationId = Number(request.body.id_negociacao);
    const weight = Number(request.body.peso_estimado);
    const scheduledAt = new Date(request.body.data_entrega);
    const userId = Number(request.auth.sub);

    if (!Number.isInteger(negotiationId) || negotiationId < 1
        || !Number.isFinite(weight) || weight <= 0 || weight > 100000
        || Number.isNaN(scheduledAt.valueOf()) || scheduledAt <= new Date()) {
        throw new AppError(
            'Informe negociação aceita, peso positivo e data futura para a entrega.',
            400,
            'VALIDATION_ERROR'
        );
    }

    const offer = await offerDAO.buscarPorId(negotiationId);
    if (!offer || offer.status !== 'aceita') {
        throw new AppError('Negociação aceita não encontrada.', 404, 'ACCEPTED_NEGOTIATION_NOT_FOUND');
    }

    const isParticipant = [offer.id_comprador, offer.id_vendedor].map(Number).includes(userId);
    if (!isParticipant) throw new AppError('Você não participa desta negociação.', 403, 'FORBIDDEN');

    const existingDelivery = await deliveryDAO.buscarPorNegociacao(negotiationId);
    if (existingDelivery) {
        throw new AppError('Esta negociação já tem uma entrega agendada.', 409, 'DELIVERY_ALREADY_EXISTS');
    }

    const delivery = await userDAO.transaction((transaction) => deliveryDAO.criar({
        negotiationId,
        adId: Number(offer.id_anuncio),
        recipientId: Number(offer.id_comprador),
        weight,
        scheduledAt,
    }, transaction));

    response.status(201).json({ mensagem: 'Entrega agendada.', entrega: delivery });
};

module.exports = { criarEntrega };
