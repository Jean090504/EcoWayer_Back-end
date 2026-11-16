require('dotenv').config();

const mysql = require('mysql2/promise');

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) throw new Error('DB_PASSWORD precisa estar definida no ambiente do backend Usuario.');

const baseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'ecowayer_db',
  port: Number(process.env.DB_PORT || 3306),
  charset: 'utf8mb4',
};

let configCache = null; // evita testar as senhas a cada nova conexão do pool

async function conexaoComFallback() {
  if (configCache) return configCache;

  const teste = await mysql.createConnection({ ...baseConfig, password: dbPassword });
  await teste.end();
  configCache = { ...baseConfig, password: dbPassword };
  return configCache;
}

module.exports = {
  development: {
    client: 'mysql2',
    connection: conexaoComFallback,
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
  },
};
