import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { database } from './config/database.js';
import apiRoutes from './routes/apiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(rateLimiter);
app.use(authMiddleware);

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/css', express.static(path.join(__dirname, 'views/public/css')));
app.use('/js', express.static(path.join(__dirname, 'views/public/js')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views/templates/auditDashboard.html'));
});

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await database.connect();

  app.listen(env.port, () => {
    console.log(`EcoWayer AI service running on http://localhost:${env.port}`);
  });
};

void startServer();

export default app;
