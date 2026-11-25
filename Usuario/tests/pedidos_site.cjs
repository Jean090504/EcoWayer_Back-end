const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { criarServico, validarPagamento, assinaturaValida } = require('../services/pedidosSite')

test('pagamento precisa ter referência, valor, moeda e ambiente corretos', () => {
    const pedido = { id: 'pedido', valor: '12.50' }
    const pagamento = { external_reference: 'pedido', transaction_amount: 12.5, currency_id: 'BRL', live_mode: false }
    assert.doesNotThrow(() => validarPagamento(pedido, pagamento))
    for (const invalido of [{ external_reference: 'outro' }, { transaction_amount: 1 }, { currency_id: 'USD' }, { live_mode: true }, { live_mode: undefined }]) {
        assert.throws(() => validarPagamento(pedido, { ...pagamento, ...invalido }), { status: 409 })
    }
})

test('webhook exige assinatura vinculada ao ID consultado e rejeita adulteração', () => {
    const segredo = 'segredo-de-teste'
    const v1 = crypto.createHmac('sha256', segredo).update('id:123;request-id:req;ts:123456;').digest('hex')
    const headers = { 'x-request-id': 'req', 'x-signature': `ts=123456,v1=${v1}` }
    const req = { query: { 'data.id': '123' }, get: n => headers[n] }
    assert.equal(assinaturaValida(req, segredo), true)
    assert.equal(assinaturaValida(req, ''), false)
    req.query['data.id'] = '124'
    assert.equal(assinaturaValida(req, segredo), false)
    headers['x-signature'] = 'ts=1,v1=malformado'
    assert.equal(assinaturaValida(req, segredo), false)
})

test('fluxo persistido e proteções de entrega (transação revertida)', { skip: process.env.PEDIDOS_DB_TEST !== '1' }, async t => {
    const db = require('knex')(require('../model/database_config_knex/knexFile').development)
    const trx = await db.transaction()
    try {
        const usuarios = await trx('tbl_usuario').select('id').limit(3)
        assert.equal(usuarios.length, 3, 'Necessários três usuários de demonstração no banco')
        const [vendedor, comprador, terceiro] = usuarios.map(u => u.id)
        const modelo = await trx('tbl_anuncio').first()
        delete modelo.id
        const modalidade = await trx('tbl_modalidade').where('nome', 'venda').first()
        let pagamentos = []
        let preferencias = 0
        const gateway = {
            criarPreferencia: async p => { preferencias++; return { id: p.id, init_point: 'https://www.mercadopago.com.br/checkout/teste' } },
            buscarPagamentos: async () => pagamentos,
            consultarPagamento: async id => pagamentos.find(p => String(p.id) === String(id))
        }
        const s = criarServico(trx, gateway, 'chave-local-de-teste')
        async function novo() {
            const [anuncio] = await trx('tbl_anuncio').insert({ ...modelo, nome: 'Teste transacional pedidos', id_usuario: vendedor, id_modalidade: modalidade.id, preco: 12.5, status: 'ativo' })
            const { pedido_id } = await s.iniciar(anuncio, comprador)
            return { anuncio, id: pedido_id }
        }
        function aprovar(id, status = 'approved') {
            pagamentos = [{ id: String(crypto.randomInt(100000000, 999999999)), external_reference: id, transaction_amount: 12.5, currency_id: 'BRL', live_mode: false, status, date_last_updated: new Date().toISOString() }]
        }
        const { id, anuncio } = await novo()
        await t.test('checkout repetido não duplica pedido ou preferência; terceiros não acessam', async () => {
            assert.equal((await s.iniciar(anuncio, comprador)).pedido_id, id)
            assert.equal(preferencias, 1)
            assert.equal((await trx('tbl_conversa').where({ id_anuncio: anuncio, id_usuario: comprador })).length, 1)
            await assert.rejects(s.iniciar(anuncio, terceiro), { status: 409 })
            await assert.rejects(s.obter(id, terceiro), { status: 404 })
            await assert.rejects(s.iniciar(anuncio, vendedor), { status: 403 })
            await assert.rejects(s.codigo(id, comprador), { status: 409 })
        })
        await t.test('recusado não libera entrega; nova tentativa aprovada libera', async () => {
            aprovar(id, 'rejected')
            await s.sincronizar(id, comprador)
            await assert.rejects(s.codigo(id, comprador), { status: 409 })
            aprovar(id)
            const p = await s.sincronizar(id, comprador)
            assert.equal(p.status_entrega, 'aguardando_entrega')
            await s.sincronizar(id, comprador)
            const historicos = await trx('tbl_historico_pagamento').where({ id_pagamento: p.id_pagamento })
            assert.equal(historicos.length, 2)
            assert.equal((await trx('tbl_anuncio').where({ id: anuncio }).first()).status, 'negociado')
            await assert.rejects(s.codigo(id, vendedor), { status: 403 })
        })
        await t.test('código protegido, tentativas persistidas, expiração e bloqueio', async () => {
            const { codigo } = await s.codigo(id, comprador)
            assert.match(codigo, /^\d{8}$/)
            const armazenado = await s.obter(id, comprador)
            assert.notEqual(armazenado.codigo_hash, codigo)
            assert.equal(s.publico(armazenado, vendedor).codigo_hash, undefined)
            await assert.rejects(s.codigo(id, comprador), { status: 409 })
            await assert.rejects(s.confirmar(id, comprador, codigo), { status: 403 })
            const errado = codigo === '00000000' ? '11111111' : '00000000'
            for (let i = 0; i < 5; i++) await assert.rejects(s.confirmar(id, vendedor, errado), { status: 400 })
            assert.equal((await s.obter(id, comprador)).codigo_tentativas, 5)
            await assert.rejects(s.confirmar(id, vendedor, codigo), { status: 409 })
            await trx('tbl_pedido_site').where({ id }).update({ codigo_expira_em: new Date(Date.now() - 1000) })
            await assert.rejects(s.confirmar(id, vendedor, codigo), { status: 409 })
        })
        await t.test('confirma entrega apenas uma vez e mantém o registro legado', async () => {
            const { codigo } = await s.codigo(id, comprador)
            const p = await s.confirmar(id, vendedor, codigo)
            assert.equal(p.status_entrega, 'entregue')
            assert.equal(p.confirmado_por, vendedor)
            assert.equal(p.codigo_hash, null)
            assert.equal((await trx('tbl_entrega').where({ id: p.id_entrega }).first()).status, 'concluida')
            await assert.rejects(s.confirmar(id, vendedor, codigo), { status: 409 })
        })
        await t.test('problema bloqueia entrega sem inventar estorno', async () => {
            const p = await novo(); aprovar(p.id)
            await s.sincronizar(p.id, comprador)
            const { codigo } = await s.codigo(p.id, comprador)
            await s.problema(p.id, comprador, 'Produto diferente do anúncio.')
            await assert.rejects(s.confirmar(p.id, vendedor, codigo), { status: 409 })
            assert.equal((await s.obter(p.id, comprador)).status_pagamento, 'approved')
        })
        await t.test('estorno confirmado invalida código', async () => {
            const p = await novo(); aprovar(p.id)
            await s.sincronizar(p.id, comprador)
            const { codigo } = await s.codigo(p.id, comprador)
            pagamentos[0].status = 'refunded'
            pagamentos[0].date_last_updated = new Date().toISOString()
            await assert.rejects(s.confirmar(p.id, vendedor, codigo), { status: 409 })
            assert.equal((await s.obter(p.id, comprador)).codigo_hash, null)
        })
    } finally { await trx.rollback(); await db.destroy() }
})
