const clientsByUser = new Map();

const register = (userId, socket) => {
    const key = Number(userId);
    if (!clientsByUser.has(key)) clientsByUser.set(key, new Set());
    clientsByUser.get(key).add(socket);
    socket.userId = key;
    socket.conversationIds = new Set();
};

const remove = (socket) => {
    const clients = clientsByUser.get(socket.userId);
    if (!clients) return;
    clients.delete(socket);
    if (!clients.size) clientsByUser.delete(socket.userId);
};

const send = (socket, payload) => {
    if (socket.readyState === 1) socket.send(JSON.stringify(payload));
};

const sendToUser = (userId, payload) => {
    const clients = clientsByUser.get(Number(userId));
    if (clients) for (const socket of clients) send(socket, payload);
};

const sendToConversation = (conversationId, payload) => {
    const id = Number(conversationId);
    for (const clients of clientsByUser.values()) {
        for (const socket of clients) {
            if (socket.conversationIds.has(id)) send(socket, payload);
        }
    }
};

module.exports = { register, remove, send, sendToUser, sendToConversation };
