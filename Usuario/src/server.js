require('dotenv').config();
const app = require('./app');
const db = require('../database/database');
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => console.log(`EcoWayer API de Usuário disponível na porta ${port}.`));
const shutdown = async () => {
  server.close(async () => { await db.destroy(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
