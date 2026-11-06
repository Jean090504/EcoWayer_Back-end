require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('node:path');
const errorMiddleware = require('./middlewares/error_middleware');
const AppError = require('./utils/AppError');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads'), { maxAge: '7d', immutable: true, index: false }));

app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'ecowayer-api-usuario' });
});

// Rotas organizadas por área, como no módulo Admin.
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/usuario.routes'));
app.use('/ads', require('./routes/anuncio.routes'));
app.use('/negotiations', require('./routes/negociacao.routes'));
app.use('/chat', require('./routes/chat.routes'));
app.use('/reports', require('./routes/denuncia.routes'));
app.use('/notifications', require('./routes/notificacao.routes'));
app.use('/points', require('./routes/pontos.routes'));
app.use('/qrcode', require('./routes/qrcode.routes'));
app.use('/deliveries', require('./routes/entrega.routes'));
app.use('/rewards', require('./routes/recompensa.routes'));

app.use((_request, _response, next) => next(new AppError('Rota não encontrada.', 404, 'NOT_FOUND')));
app.use(errorMiddleware);

module.exports = app;
