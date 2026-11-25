const express = require('express')
const crypto = require('node:crypto')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')

const router = express.Router()

function disponivel() {
    return process.env.NODE_ENV !== 'production' && process.env.MP_TEST_MODE === '1' && Boolean(process.env.MP_ACCESS_TOKEN)
}

function cliente() {
    return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
}

function urlRetorno(resultado) {
    const origem = (process.env.MP_BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '')
    return `${origem}/mercadopago/retorno?resultado=${resultado}`
}

router.post('/teste/preferencia', async (req, res) => {
    if (!disponivel()) return res.status(503).json({ message: 'Pagamentos de teste não estão disponíveis.' })
    const id = Number(req.body?.id_anuncio)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'Anúncio inválido.' })
    try {
        const anuncio = await req.app.locals.dbPublicacao('tbl_anuncio as a')
            .join('tbl_modalidade as m', 'm.id', 'a.id_modalidade')
            .where('a.id', id)
            .select('a.id', 'a.nome', 'a.preco', 'a.status', 'a.id_usuario', 'm.nome as modalidade')
            .first()
        if (!anuncio || anuncio.status !== 'ativo') return res.status(404).json({ message: 'Anúncio indisponível.' })
        if (String(anuncio.modalidade).toLowerCase() !== 'venda') return res.status(400).json({ message: 'Este anúncio não é de venda.' })
        if (Number(anuncio.id_usuario) === Number(req.usuario.id)) return res.status(403).json({ message: 'Você não pode pagar pelo próprio anúncio.' })
        const preco = Number(anuncio.preco)
        if (!Number.isFinite(preco) || preco <= 0 || Math.round(preco * 100) / 100 !== preco) {
            return res.status(400).json({ message: 'Preço do anúncio inválido para pagamento.' })
        }
        const preferencia = await new Preference(cliente()).create({
            body: {
                items: [{ id: String(anuncio.id), title: String(anuncio.nome).slice(0, 256), quantity: 1, unit_price: preco, currency_id: 'BRL' }],
                external_reference: `ecowayer-teste-${anuncio.id}-${req.usuario.id}-${crypto.randomUUID()}`,
                back_urls: {
                    success: urlRetorno('sucesso'),
                    failure: urlRetorno('falha'),
                    pending: urlRetorno('pendente')
                }
            }
        })
        if (!/^https:\/\/(?:www\.)?mercadopago\.com\.br\//.test(preferencia.init_point || '')) {
            throw new Error('URL de checkout inesperada.')
        }
        return res.json({ response: { init_point: preferencia.init_point } })
    } catch (erro) {
        console.error('Falha ao criar preferência Mercado Pago:', erro.message)
        return res.status(502).json({ message: 'Não foi possível abrir o pagamento de teste. Tente novamente.' })
    }
})

async function retorno(req, res) {
    res.set('Cache-Control', 'no-store')
    let mensagem = 'O pagamento não foi confirmado. Consulte o painel do Mercado Pago.'
    const id = String(req.query.collection_id || req.query.payment_id || '')
    if (disponivel() && /^\d{1,20}$/.test(id)) {
        try {
            const pagamento = await new Payment(cliente()).get({ id })
            if (pagamento.status === 'approved' && String(pagamento.external_reference || '').startsWith('ecowayer-teste-')) {
                mensagem = 'Pagamento de teste aprovado pelo Mercado Pago. Nenhuma entrega ou repasse foi registrado no EcoWayer.'
            } else if (pagamento.status === 'pending' || pagamento.status === 'in_process') {
                mensagem = 'Pagamento de teste pendente. Consulte o painel do Mercado Pago.'
            }
        } catch (erro) {
            console.error('Falha ao consultar pagamento Mercado Pago:', erro.message)
        }
    }
    const front = process.env.MP_FRONTEND_URL || 'http://localhost:5173'
    res.type('html').send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagamento de teste • EcoWayer</title><body style="font:16px system-ui;background:#faf8ff;color:#191c30;min-height:100vh;display:grid;place-items:center;margin:0;padding:20px;box-sizing:border-box"><main style="max-width:440px;background:white;padding:32px;border-radius:24px;box-shadow:0 8px 28px #231f3514"><h1 style="font-size:24px">Resultado do teste</h1><p>${mensagem}</p><a href="${front}" style="color:#724bc2;font-weight:600">Voltar ao EcoWayer</a></main></body></html>`)
}

module.exports = { router, retorno }
