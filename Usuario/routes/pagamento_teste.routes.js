const express = require('express')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const { criarServico, assinaturaValida } = require('../services/pedidosSite')
const router = express.Router()
const pedidosRouter = express.Router()

function disponivel() {
    if (!process.env.MP_ACCESS_TOKEN) return false
    if (process.env.MP_TEST_MODE === '1') return process.env.NODE_ENV !== 'production' ||
        (process.env.MP_STAGING_ENABLED === '1' && /^https:\/\//.test(process.env.MP_BACKEND_URL || '') &&
            /^https:\/\//.test(process.env.MP_FRONTEND_URL || ''))
    return process.env.NODE_ENV === 'production' && process.env.MP_LIVE_ENABLED === '1' &&
        process.env.MP_SETTLEMENT_MODE === 'platform' &&
        Boolean(process.env.MP_WEBHOOK_SECRET) && /^https:\/\//.test(process.env.MP_BACKEND_URL || '') &&
        /^https:\/\//.test(process.env.MP_FRONTEND_URL || '')
}
function ambiente() { return process.env.MP_TEST_MODE === '1' ? 'teste' : 'producao' }
function cliente() { return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 10000 } }) }
function origemBackend() { return (process.env.MP_BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '') }
async function exigirContaCorreta() {
    // APP_USR também pode ser token de teste: consulta a conta, não o prefixo.
    const resposta = await fetch('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(10000)
    })
    const conta = await resposta.json()
    if (!resposta.ok || Boolean(conta.tags?.includes('test_user')) !== (ambiente() === 'teste')) {
        throw Object.assign(new Error('As credenciais do Mercado Pago não correspondem ao ambiente configurado.'), { status: 503 })
    }
}
function gateway() {
    return {
        async criarPreferencia(p) {
            await exigirContaCorreta()
            const retorno = `${origemBackend()}/mercadopago/retorno?pedido=${p.id}`
            return new Preference(cliente()).create({ body: {
                items: [{ id: String(p.id_anuncio), title: p.titulo, quantity: 1, unit_price: Number(p.valor), currency_id: 'BRL' }],
                external_reference: p.id,
                back_urls: { success: retorno, failure: retorno, pending: retorno },
                ...(process.env.MP_WEBHOOK_SECRET && /^https:\/\//.test(origemBackend()) ? { notification_url: `${origemBackend()}/mercadopago/webhook` } : {})
            }, requestOptions: { idempotencyKey: p.id } })
        },
        consultarPagamento: id => new Payment(cliente()).get({ id }),
        async buscarPagamentos(referencia) {
            const resultado = await new Payment(cliente()).search({ options: { external_reference: referencia, sort: 'date_created', criteria: 'desc', limit: 100 } })
            return Promise.all((resultado.results || []).map(p => new Payment(cliente()).get({ id: p.id })))
        }
    }
}
function servico(req) { return criarServico(req.app.locals.dbPublicacao, gateway(), process.env.JWT_SECRET, ambiente()) }
function rota(handler) {
    return async (req, res) => {
        res.set('Cache-Control', 'no-store')
        if (!disponivel()) return res.status(503).json({ message: 'Checkout indisponível neste ambiente.' })
        try { await handler(req, res, servico(req)) } catch (e) {
            if (!e.status) console.error('Falha no pedido:', e.code || e.name)
            res.status(e.status || 502).json({ message: e.status ? e.message : 'Não foi possível atualizar o pedido. Tente novamente.' })
        }
    }
}
const criarPreferencia = rota(async (req, res, s) => {
    const id = Number(req.body?.id_anuncio)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Anúncio inválido.' })
    res.json({ response: await s.iniciar(id, req.usuario.id) })
})
router.post('/preferencia', criarPreferencia)
router.post('/teste/preferencia', (req, res, next) => process.env.MP_TEST_MODE === '1'
    ? criarPreferencia(req, res, next)
    : res.status(404).json({ message: 'Rota de teste indisponível.' }))
pedidosRouter.get('/', rota(async (req, res, s) => {
    const pedidos = await req.app.locals.dbPublicacao('tbl_pedido_site')
        .where('id_comprador', req.usuario.id).orWhere('id_vendedor', req.usuario.id).orderBy('criado_em', 'desc').limit(100)
    res.json({ pedidos: pedidos.map(p => s.publico(p, req.usuario.id)) })
}))
pedidosRouter.post('/:id/atualizar', rota(async (req, res, s) => {
    const p = await s.sincronizar(req.params.id, req.usuario.id)
    res.json({ pedido: s.publico(p, req.usuario.id) })
}))
pedidosRouter.get('/:id/conversa', rota(async (req, res, s) => {
    const p = await s.obter(req.params.id, req.usuario.id)
    const conversa = await req.app.locals.dbPublicacao('tbl_conversa')
        .where({ id_anuncio: p.id_anuncio, id_usuario: p.id_comprador }).orderBy('id').first('id')
    if (!conversa) return res.status(404).json({ message: 'Conversa não encontrada.' })
    res.json({ id_conversa: conversa.id })
}))
pedidosRouter.post('/:id/codigo', rota(async (req, res, s) => res.json(await s.codigo(req.params.id, req.usuario.id))))
pedidosRouter.post('/:id/confirmar', rota(async (req, res, s) => {
    res.json({ pedido: s.publico(await s.confirmar(req.params.id, req.usuario.id, req.body?.codigo), req.usuario.id) })
}))
pedidosRouter.post('/:id/problema', rota(async (req, res, s) => {
    await s.problema(req.params.id, req.usuario.id, req.body?.motivo)
    res.json({ message: 'Problema registrado. Entrega bloqueada; nenhum reembolso automático foi realizado.' })
}))
const webhook = rota(async (req, res, s) => {
    if (!assinaturaValida(req, process.env.MP_WEBHOOK_SECRET)) return res.status(401).json({ message: 'Assinatura inválida.' })
    if ((req.body?.type || req.query.type) !== 'payment') return res.sendStatus(200)
    const id = String(req.query['data.id'])
    const pagamento = await gateway().consultarPagamento(id)
    const p = await req.app.locals.dbPublicacao('tbl_pedido_site').where({ id: pagamento.external_reference || '' }).first()
    if (p) await s.sincronizarInterno(p.id, id)
    res.sendStatus(200)
})
function retorno(req, res) {
    // Retornar ao site não aprova o pedido. A tela consulta o backend.
    const url = new URL(process.env.MP_FRONTEND_URL || 'http://localhost:5173')
    url.searchParams.set('tela', 'pedidos')
    const id = String(req.query.pedido || '')
    if (/^[a-f0-9-]{36}$/.test(id)) url.searchParams.set('pedido', id)
    res.set('Cache-Control', 'no-store').redirect(303, url.toString())
}
module.exports = { router, pedidosRouter, retorno, webhook, disponivel }
