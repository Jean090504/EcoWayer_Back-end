const dao = require('../../model/DAO/notificacao/notificacao');
const AppError = require('../../utils/AppError');

// Lista as notificações do usuário autenticado.
const listarNotificacoes = async (request, response) => {
    const unreadOnly = request.query.nao_lidas === 'true';
    const notifications = await dao.listar(Number(request.auth.sub), unreadOnly);
    response.json({ count: notifications.length, notificacoes: notifications });
};

const marcarComoLida = async (request, response) => {
    const notificationId = Number(request.params.id);
    if (!Number.isInteger(notificationId) || notificationId < 1) throw new AppError('Notificação inválida.', 400, 'VALIDATION_ERROR');

    const updated = await dao.marcarComoLida(notificationId, Number(request.auth.sub));
    if (!updated) throw new AppError('Notificação não encontrada.', 404, 'NOTIFICATION_NOT_FOUND');
    response.json({ mensagem: 'Notificação marcada como lida.' });
};

const marcarTodasComoLidas = async (request, response) => {
    const count = await dao.marcarTodasComoLidas(Number(request.auth.sub));
    response.json({ mensagem: 'Notificações marcadas como lidas.', count });
};

module.exports = { listarNotificacoes, marcarComoLida, marcarTodasComoLidas };
