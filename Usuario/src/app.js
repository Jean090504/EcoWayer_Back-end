require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('node:path');
const AppError = require('./utils/AppError');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/uploads/avatars', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads/avatars'), { maxAge: '7d', immutable: true, index: false }));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ecowayer-api-usuario' }));
app.use(require('./routes'));
app.use((_req, _res, next) => next(new AppError('Rota não encontrada.', 404, 'NOT_FOUND')));
app.use(errorMiddleware);

module.exports = app;
