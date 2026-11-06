const { WebSocketServer } = require('ws');
const AppError = require('../utils/AppError');
const { verify } = require('../utils/jwt');
const userDAO = require('../model/DAO/usuario/usuario');
const chatDAO = require('../model/DAO/chat/chat');
const notificationService = require('../services/notificacao_service');
const hub = require('./hub');

const sendError = (socket, message) => hub.send(socket, { tipo: 'erro', mensagem: message });

const autenticarSocket = async (socket, token) => {
    const claims = verify(token);
    const userId = Number(claims.sub);
    if (!(await userDAO.isActive(userId))) throw new AppError('Conta indisponível.', 401, 'ACCOUNT_INACTIVE');
    hub.register(userId, socket);
    socket.autenticado = true;
    clearTimeout(socket.authTimeout);
    hub.send(socket, { tipo: 'autenticado', id_usuario: userId });
};

const handleMessage = async (socket, raw) => {
    let message;
    try {
        message = JSON.parse(raw.toString());
    } catch {
        return sendError(socket, 'Envie uma mensagem JSON válida.');
    }

    if (!socket.autenticado) {
        if (message.tipo !== 'autenticar' || typeof message.token !== 'string') {
            socket.close(1008, 'Autenticação necessária.');
            return;
        }
        try {
            await autenticarSocket(socket, message.token);
        } catch {
            socket.close(1008, 'Token inválido ou expirado.');
        }
        return;
    }

    const conversationId = Number(message.id_conversa);
    if (!Number.isInteger(conversationId) || conversationId < 1) return sendError(socket, 'Conversa inválida.');
    if (!(await chatDAO.ehParticipante(conversationId, socket.userId))) return sendError(socket, 'Você não participa desta conversa.');

    if (message.tipo === 'entrar_conversa') {
        socket.conversationIds.add(conversationId);
        return hub.send(socket, { tipo: 'entrou_conversa', id_conversa: conversationId });
    }

    if (message.tipo !== 'mensagem') return sendError(socket, 'Tipo de evento não reconhecido.');
    const text = String(message.texto || '').trim();
    if (!text || text.length > 5000) return sendError(socket, 'A mensagem deve ter de 1 a 5000 caracteres.');

    const conversation = await chatDAO.buscarConversa(conversationId);
    const savedMessage = await chatDAO.criarMensagem({ conversationId, userId: socket.userId, text });
    socket.conversationIds.add(conversationId);
    hub.sendToConversation(conversationId, { tipo: 'mensagem', mensagem: savedMessage });

    const recipientId = Number(conversation.id_usuario) === socket.userId
        ? conversation.id_vendedor
        : conversation.id_usuario;
    await notificationService.criarNotificacao({
        userId: recipientId,
        type: 'mensagem',
        title: 'Nova mensagem',
        message: `Você recebeu uma mensagem sobre ${conversation.anuncio}.`,
        data: { id_conversa: conversationId, id_mensagem: savedMessage.id },
    });
};

const configurarChatWebSocket = (server) => {
    const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

    server.on('upgrade', (request, socket, head) => {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (pathname !== '/chat/ws') return socket.destroy();
        webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
            webSocketServer.emit('connection', webSocket, request);
        });
    });

    webSocketServer.on('connection', (socket) => {
        socket.autenticado = false;
        socket.authTimeout = setTimeout(() => socket.close(1008, 'Autenticação necessária.'), 5000);
        socket.on('message', (raw) => handleMessage(socket, raw).catch(() => sendError(socket, 'Não foi possível processar o evento.')));
        socket.on('close', () => {
            clearTimeout(socket.authTimeout);
            hub.remove(socket);
        });
        socket.on('error', () => hub.remove(socket));
    });

    return webSocketServer;
};

module.exports = configurarChatWebSocket;
