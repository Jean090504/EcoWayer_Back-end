require('dotenv').config();

const mysql = require('mysql2/promise');

// Configure estas linhas no arquivo Usuario/.env:
// DB_HOST=ecowayerdb.mysql.database.azure.com
// DB_PORT=3306
// DB_USER=maxsz06
// DB_PASSWORD="SUA_SENHA"
// DB_NAME=ecowayer_db

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) throw new Error('DB_PASSWORD precisa estar definida no ambiente do backend Usuario.');

const dbHost = process.env.DB_HOST || '127.0.0.1';
const usarTLS = dbHost.toLowerCase().endsWith('.mysql.database.azure.com');

const baseConfig = {
  host: dbHost,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'ecowayer_db',
  port: Number(process.env.DB_PORT || 3306),
  charset: 'utf8mb4',
  ...(usarTLS && { ssl: { rejectUnauthorized: true, verifyIdentity: true } }),
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
