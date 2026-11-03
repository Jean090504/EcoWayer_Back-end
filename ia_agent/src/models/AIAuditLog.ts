
import { RowDataPacket } from 'mysql2/promise'
import { Database } from '../config/database.js'

export interface IAlertRecord {
  id_ia: number
  id_usuario?: number | null
  tipo_alvo: 'ANUNCIO_ITEM' | 'CHAT_MENSAGEM' | 'SISTEMA_IA'
  id_alvo: string
  motivo: string
  status?: 'PENDENTE' | 'RESOLVIDO'
  acao?: string | null
}

export class AIAuditLog {
  static async record(entry: IAlertRecord): Promise<number> {
    const sql = `
      INSERT INTO tbl_alertas (id_ia, id_usuario, tipo_alvo, id_alvo, motivo, status, acao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const result = await Database.execute(sql, [
      entry.id_ia,
      entry.id_usuario || null,
      entry.tipo_alvo,
      entry.id_alvo,
      entry.motivo,
      entry.status || 'PENDENTE',
      entry.acao || null
    ])
    return result.insertId
  }

  /**
   * Monitorização das últimas 24h para avaliar necessidade de rollback
   */
  static async countDecisionsInLast24Hours(): Promise<{ total: number; rejectedByAdmin: number }> {
    const sqlTotal = `
      SELECT COUNT(*) as total FROM tbl_alertas 
      WHERE criado_em >= NOW() - INTERVAL 1 DAY
    `
    const sqlOverrides = `
      SELECT COUNT(*) as overrides FROM tbl_alertas 
      WHERE criado_em >= NOW() - INTERVAL 1 DAY 
      AND acao = 'INVERSAO_DECISAO_IA'
    `

    const [rowsTotal] = await Promise.all([
      Database.query<RowDataPacket[]>(sqlTotal),
      Database.query<RowDataPacket[]>(sqlOverrides)
    ])

    return {
      total: rowsTotal[0]?.total || 0,
      rejectedByAdmin: rowsTotal[0]?.overrides || 0
    }
  }
}