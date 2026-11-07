// Exemplos identificados e idempotentes para a apresentação do TCC.
// Execute com: node scripts/seedChamadosTeste.js
const knex = require('knex')
const config = require('../model/database_config_knex/knexFile.js')

const db = knex(config.development)

const exemplos = [
  { anuncioId: 11, motivo: '[TESTE TCC] A IA sinalizou conteúdo que exige revisão humana antes da decisão final.', acao: 'CONFERENCIA_HUMANA' },
  { anuncioId: 13, motivo: '[TESTE TCC] A IA apontou possível divergência na descrição e solicitou conferência do anúncio.', acao: 'CONFERENCIA_HUMANA' },
  { anuncioId: 14, denunciaId: 4, motivo: '[TESTE TCC] Denúncia de possível spam no anúncio de embalagens; conferir descrição e imagens.', acao: 'DENUNCIA' },
  { anuncioId: 15, denunciaId: 5, motivo: '[TESTE TCC] Denúncia sobre possível mistura de óleo com solventes; revisão de segurança necessária.', acao: 'DENUNCIA' }
]

async function main() {
  const modelo = await db('tbl_ia').where('status', 'EM_PRODUCAO').first('id') || await db('tbl_ia').first('id')
  if (!modelo) throw new Error('Nenhum modelo de IA cadastrado em tbl_ia.')

  for (const exemplo of exemplos) {
    const anuncio = await db('tbl_anuncio').where('id', exemplo.anuncioId).first('id', 'id_usuario')
    if (!anuncio) {
      console.log(`Anúncio #${exemplo.anuncioId} não existe; exemplo ignorado.`)
      continue
    }
    if (exemplo.denunciaId && !await db('tbl_denuncias').where('id', exemplo.denunciaId).first('id')) {
      console.log(`Denúncia #${exemplo.denunciaId} não existe; exemplo ignorado.`)
      continue
    }
    const existente = await db('tbl_alertas').where({ motivo: exemplo.motivo, id_alvo: String(exemplo.anuncioId) }).first('id')
    if (existente) {
      console.log(`Chamado de teste #${existente.id} já cadastrado.`)
      continue
    }
    const id = await db.transaction(async (trx) => {
      const [alertaId] = await trx('tbl_alertas').insert({
        motivo: exemplo.motivo,
        status: 'PENDENTE',
        tipo_alvo: 'ANUNCIO_ITEM',
        id_alvo: String(exemplo.anuncioId),
        acao: exemplo.acao,
        id_ia: modelo.id,
        id_usuario: anuncio.id_usuario
      })
      await trx('tbl_alertas_anuncio').insert({ id_alerta: alertaId, id_anuncio: anuncio.id })
      if (exemplo.denunciaId) await trx('tbl_alertas_denuncias').insert({ id_alertas: alertaId, id_denuncias: exemplo.denunciaId })
      return alertaId
    })
    console.log(`Chamado de teste #${id} criado para o anúncio #${anuncio.id}.`)
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 }).finally(() => db.destroy())
