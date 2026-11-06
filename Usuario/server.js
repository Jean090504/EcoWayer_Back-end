require('dotenv').config();

const http = require('node:http');
const app = require('./app');
const database = require('./database/database');
const configurarChatWebSocket = require('./websocket/chat_server');

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);
configurarChatWebSocket(server);

server.listen(port, () => {
    console.log(`API de Usuário disponível em http://localhost:${port}`);
});

const shutdown = () => {
    server.close(async () => {
        await database.destroy();
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
