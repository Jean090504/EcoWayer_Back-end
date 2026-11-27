const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
require('dotenv').config()

test('código de contato exige valor correto, tem limite de tentativas e não pode ser consumido duas vezes', async t => {
    if (!process.env.DB_PASSWORD || !process.env.JWT_SECRET) return t.skip('Banco e segredo não configurados')
    const db = require('knex')(require('../model/database_config_knex/knexFile').development)
    const verificacao = require('../services/verificacaoContato')
    try {
        if (!await db.schema.hasTable('tbl_desafio_contato')) return t.skip('Execute npm run migrate:contato')
        await db.transaction(async trx => {
            const id = crypto.randomUUID()
            const codigo = '123456'
            const destino = `teste-${id}@example.com`
            const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${id}:${codigo}`).digest('hex')
            const agora = new Date()
            await trx('tbl_desafio_contato').insert({ id, tipo: 'email', finalidade: 'cadastro', destino,
                codigo_hash: hash, criado_em: agora, enviado_em: agora, expira_em: new Date(agora.getTime() + 600000) })
            await assert.rejects(verificacao.confirmar(trx, id, '000000'), e => e.status === 400)
            assert.equal((await trx('tbl_desafio_contato').where({ id }).first()).tentativas, 1)
            assert.deepEqual(await verificacao.confirmar(trx, id, codigo), { confirmado: true })
            await verificacao.exigirConfirmado(trx, id, 'email', destino)
            await assert.rejects(verificacao.exigirConfirmado(trx, id, 'email', 'outro@example.com'), e => e.status === 400)
            await trx('tbl_desafio_contato').where({ id }).update({ consumido_em: new Date() })
            await assert.rejects(verificacao.exigirConfirmado(trx, id, 'email', destino), e => e.status === 400)
            throw new Error('ROLLBACK_TESTE')
        }).catch(e => { if (e.message !== 'ROLLBACK_TESTE') throw e })
    } finally { await db.destroy() }
})
