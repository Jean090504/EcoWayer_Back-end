const notificationDAO = require('../model/DAO/notificacao/notificacao');
const hub = require('../websocket/hub');

const criarNotificacao = async (data, transaction) => {
    const notification = await notificationDAO.criar(data, transaction);
    hub.sendToUser(data.userId, { tipo: 'notificacao', notificacao: notification });
    return notification;
};

module.exports = { criarNotificacao };
