const mysql = require('mysql2/promise');

// Senhas candidatas (a do .env tem prioridade, se existir)
const senhas = [process.env.DB_PASSWORD, 'bcd127', '12345678'].filter(Boolean);

const baseConfig = {
  host: 'localhost',
  user: 'root',
  database: 'ecowayer_db',
  port: 3306,
  charset: 'utf8mb4',
};

let configCache = null; // evita testar as senhas a cada nova conexão do pool

async function conexaoComFallback() {
  if (configCache) return configCache;

  let ultimoErro;

  for (const password of senhas) {
    try {
      const teste = await mysql.createConnection({ ...baseConfig, password });
      await teste.end();

      configCache = { ...baseConfig, password };
      return configCache;
    } catch (err) {
      // só tenta a próxima se o erro for de senha errada
      if (err.code !== 'ER_ACCESS_DENIED_ERROR') throw err;
      ultimoErro = err;
    }
  }

  throw ultimoErro; // nenhuma senha funcionou
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