
import { RowDataPacket } from 'mysql2/promise'
import { Database } from '../config/database.js'

export type ModelLifecycleState = 'EM_TREINO' | 'APROVADO' | 'EM_PRODUCAO' | 'DESATIVADO'

export interface IAICatalogEntity {
  id?: number
  nome: string
  versao: string
  provedor: string
  status: ModelLifecycleState
  acuracia_aprovada?: number | null
  id_externo?: string | null
  criado_em?: string
}

export class AICatalogModel {
  static async register(model: Omit<IAICatalogEntity, 'id' | 'criado_em'>): Promise<number> {
    const sql = `
      INSERT INTO tbl_ia (nome, versao, provedor, status, acuracia_aprovada, id_externo)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const result = await Database.execute(sql, [
      model.nome,
      model.versao,
      model.provedor,
      model.status,
      model.acuracia_aprovada || null,
      model.id_externo || null
    ])
    return result.insertId
  }

  static async findActiveProductionModel(): Promise<IAICatalogEntity | null> {
    const sql = `SELECT * FROM tbl_ia WHERE status = 'EM_PRODUCAO' LIMIT 1`
    const rows = await Database.query<RowDataPacket[]>(sql)
    if (rows.length === 0) return null
    return rows[0] as IAICatalogEntity
  }

  static async updateLifecycleState(id: number, nextState: ModelLifecycleState): Promise<void> {
    const sql = `UPDATE tbl_ia SET status = ? WHERE id = ?`
    await Database.execute(sql, [nextState, id])
  }
}