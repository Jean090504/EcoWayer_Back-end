
import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { env } from './env.js'

export class Database {
  private static pool: Pool | null = null

  /**
   * Inicializa e retorna o pool de conexões do MySQL
   */
  static init(): Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASS,
        database: env.DB_NAME,
        waitForConnections: true,
        connectionLimit: env.DB_CONNECTION_LIMIT,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      })
    }
    return this.pool
  }

  /**
   * Executa comandos SELECT de forma parametrizada e imune a SQL Injection
   */
  static async query<T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
    const activePool = this.init()
    const [rows] = await activePool.query<T>(sql, params)
    return rows
  }

  /**
   * Executa comandos de escrita (INSERT, UPDATE, DELETE) retornando metadados de execução
   */
  static async execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
    const activePool = this.init()
    const [result] = await activePool.execute<ResultSetHeader>(sql, params)
    return result
  }

  /**
   * Obtém uma conexão dedicada para transações manuais
   */
  static async getConnection(): Promise<PoolConnection> {
    const activePool = this.init()
    return await activePool.getConnection()
  }

  /**
   * Verifica a conectividade para monitoramento de saúde do sistema 
   */
  static async ping(): Promise<boolean> {
    try {
      const activePool = this.init()
      await activePool.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }
}