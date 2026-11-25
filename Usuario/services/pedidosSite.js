const crypto = require('node:crypto')

function falhar(status, message) { throw Object.assign(new Error(message), { status }) }
function hashCodigo(id, codigo, segredo) {
    return crypto.createHmac('sha256', segredo).update(`${id}:${codigo}`).digest('hex')
}
function validarPagamento(pedido, pagamento) {
    if (pagamento.live_mode !== false || pagamento.external_reference !== pedido.id ||
        pagamento.currency_id !== 'BRL' || Math.round(Number(pagamento.transaction_amount) * 100) !== Math.round(Number(pedido.valor) * 100)) {
        falhar(409, 'Pagamento não corresponde ao pedido de teste.')
    }
}
function assinaturaValida(req, segredo) {
    const id = String(req.query['data.id'] || '')
    const requestId = req.get('x-request-id') || ''
    const partes = Object.fromEntries(String(req.get('x-signature') || '').split(',').map(s => s.trim().split('=')))
    if (!segredo || !/^\d{1,20}$/.test(id) || !requestId || !/^\d+$/.test(partes.ts || '') || !/^[a-f0-9]{64}$/i.test(partes.v1 || '')) return false
    const esperado = crypto.createHmac('sha256', segredo).update(`id:${id};request-id:${requestId};ts:${partes.ts};`).digest()
    return crypto.timingSafeEqual(esperado, Buffer.from(partes.v1, 'hex'))
}

function criarServico(db, gateway, segredo) {
    async function obter(id, usuario, trx = db) {
        const p = await trx('tbl_pedido_site').where({ id }).first()
        if (!p || ![Number(p.id_comprador), Number(p.id_vendedor)].includes(Number(usuario))) falhar(404, 'Pedido não encontrado.')
        return p
    }
    function publico(p, usuario) {
        const { codigo_hash, codigo_tentativas, ...dados } = p
        return { ...dados, papel: Number(p.id_comprador) === Number(usuario) ? 'comprador' : 'vendedor', ambiente: 'teste' }
    }
    async function iniciar(idAnuncio, comprador) {
        const pedido = await db.transaction(async trx => {
            const a = await trx('tbl_anuncio').where({ id: idAnuncio }).forUpdate().first()
            if (!a || a.status !== 'ativo') falhar(404, 'Anúncio indisponível.')
            if (Number(a.id_usuario) === Number(comprador)) falhar(403, 'Você não pode comprar seu próprio anúncio.')
            const modalidade = await trx('tbl_modalidade').where({ id: a.id_modalidade }).first()
            if (String(modalidade?.nome).toLowerCase() !== 'venda' || !(Number(a.preco) > 0)) falhar(400, 'Anúncio sem preço de venda válido.')
            const existente = await trx('tbl_pedido_site').where({ id_anuncio: idAnuncio }).first()
            if (existente) {
                if (Number(existente.id_comprador) !== Number(comprador)) falhar(409, 'Este anúncio já possui um pedido em andamento.')
                if (existente.status_pagamento === 'approved' || existente.entregue_em) falhar(409, 'Este pedido já foi pago. Consulte Minhas compras.')
                return existente
            }
            const novo = { id: crypto.randomUUID(), id_anuncio: a.id, id_comprador: comprador, id_vendedor: a.id_usuario, titulo: a.nome, valor: a.preco }
            await trx('tbl_pedido_site').insert(novo)
            const conversa = await trx('tbl_conversa').where({ id_anuncio: a.id, id_usuario: comprador }).first()
            if (!conversa) await trx('tbl_conversa').insert({ id_anuncio: a.id, id_usuario: comprador })
            return novo
        })
        // Serializa cliques repetidos; a chave também protege retries após falha de rede.
        return db.transaction(async trx => {
            const p = await trx('tbl_pedido_site').where({ id: pedido.id }).forUpdate().first()
            if (p.checkout_url) return { pedido_id: p.id, init_point: p.checkout_url }
            const pref = await gateway.criarPreferencia(p)
            if (!/^https:\/\/(?:www\.)?mercadopago\.com\.br\//.test(pref.init_point || '')) falhar(502, 'Checkout inválido.')
            await trx('tbl_pedido_site').where({ id: p.id }).update({ preferencia_id: pref.id, checkout_url: pref.init_point })
            return { pedido_id: p.id, init_point: pref.init_point }
        })
    }
    async function sincronizar(id, usuario, pagamentoId) {
        await obter(id, usuario)
        return sincronizarInterno(id, pagamentoId)
    }
    async function sincronizarInterno(id, pagamentoId) {
        return db.transaction(async trx => {
            const p = await trx('tbl_pedido_site').where({ id }).forUpdate().first()
            if (!p) falhar(404, 'Pedido não encontrado.')
            const pagamentos = pagamentoId || p.pagamento_id
                ? [await gateway.consultarPagamento(pagamentoId || p.pagamento_id)]
                : await gateway.buscarPagamentos(p.id)
            // Aprovação tem prioridade sobre tentativas recusadas do mesmo checkout.
            const candidatos = pagamentos.filter(x => x.external_reference === p.id)
            const pagamento = candidatos.find(x => x.status === 'approved') || candidatos.find(x => ['refunded', 'charged_back'].includes(x.status)) || candidatos[0]
            if (!pagamento) {
                if (pagamentoId) falhar(409, 'Pagamento não corresponde ao pedido.')
                return p
            }
            validarPagamento(p, pagamento)
            if (p.pagamento_id && String(p.pagamento_id) !== String(pagamento.id)) {
                // Nunca substitui um pagamento já aprovado por outra tentativa.
                return p
            }
            const data = new Date(pagamento.date_last_updated)
            if (!Number.isFinite(data.getTime())) falhar(502, 'Pagamento sem data de atualização válida.')
            if (p.pagamento_atualizado_em && data < new Date(p.pagamento_atualizado_em)) return p
            // Estorno parcial também impede confirmar uma entrega como integralmente paga.
            const status = Number(pagamento.transaction_amount_refunded || 0) > 0 ? 'refunded' : pagamento.status
            const aprovado = status === 'approved'
            const update = { status_pagamento: status, pagamento_atualizado_em: data }
            // Só fixa o ID definitivo após aprovação/estorno; recusas podem ser tentadas novamente.
            if (aprovado || ['refunded', 'charged_back'].includes(status)) update.pagamento_id = String(pagamento.id)
            if (aprovado && p.status_entrega === 'aguardando_pagamento') update.status_entrega = 'aguardando_entrega'
            if (!aprovado) {
                update.codigo_hash = null
                update.codigo_expira_em = null
                if (!p.entregue_em && p.status_entrega !== 'problema') update.status_entrega = 'aguardando_pagamento'
            }
            const statusLegado = ({ approved: 'aprovado', rejected: 'recusado', cancelled: 'cancelado', refunded: 'estornado', charged_back: 'estornado' })[status] || 'pendente'
            if (!p.id_pagamento) {
                const [idPagamento] = await trx('tbl_pagamento').insert({ status: statusLegado, valor: p.valor, id_externo: String(pagamento.id), id_anuncio: p.id_anuncio, id_comprador: p.id_comprador })
                update.id_pagamento = idPagamento
            } else await trx('tbl_pagamento').where({ id: p.id_pagamento }).update({ status: statusLegado, id_externo: String(pagamento.id) })
            if (p.status_pagamento !== status || !p.id_pagamento) {
                await trx('tbl_historico_pagamento').insert({ id_pagamento: p.id_pagamento || update.id_pagamento, status: statusLegado, data_alteracao: new Date(), detalhes: 'Mercado Pago — pedido de teste no site' })
            }
            if (aprovado) await trx('tbl_anuncio').where({ id: p.id_anuncio, status: 'ativo' }).update({ status: 'negociado' })
            await trx('tbl_pedido_site').where({ id }).update(update)
            return { ...p, ...update }
        })
    }
    async function codigo(id, usuario) {
        const p = await obter(id, usuario)
        if (Number(p.id_comprador) !== Number(usuario)) falhar(403, 'Somente o comprador pode gerar o código.')
        await sincronizarInterno(id)
        return db.transaction(async trx => {
            const atual = await trx('tbl_pedido_site').where({ id }).forUpdate().first()
            if (atual.status_pagamento !== 'approved' || atual.status_entrega !== 'aguardando_entrega') falhar(409, 'Pedido não está disponível para entrega.')
            if (atual.codigo_expira_em && new Date(atual.codigo_expira_em) > new Date()) falhar(409, 'Já existe um código válido. Aguarde sua expiração para gerar outro.')
            if (!segredo) falhar(503, 'Configuração do código de entrega ausente.')
            const codigo = crypto.randomInt(0, 100000000).toString().padStart(8, '0')
            const expira = new Date(Date.now() + 10 * 60 * 1000)
            await trx('tbl_pedido_site').where({ id }).update({ codigo_hash: hashCodigo(id, codigo, segredo), codigo_expira_em: expira, codigo_tentativas: 0 })
            return { codigo, expira_em: expira }
        })
    }
    async function confirmar(id, usuario, codigo) {
        const p = await obter(id, usuario)
        if (Number(p.id_vendedor) !== Number(usuario)) falhar(403, 'Somente o vendedor pode confirmar a entrega.')
        if (!/^\d{8}$/.test(codigo || '')) falhar(400, 'Informe os oito dígitos do código.')
        await sincronizarInterno(id)
        const resultado = await db.transaction(async trx => {
            const atual = await trx('tbl_pedido_site').where({ id }).forUpdate().first()
            if (atual.status_pagamento !== 'approved' || atual.status_entrega !== 'aguardando_entrega') falhar(409, 'Pedido não está disponível para entrega.')
            if (!atual.codigo_hash || new Date(atual.codigo_expira_em) <= new Date() || atual.codigo_tentativas >= 5) falhar(409, 'Código expirado ou bloqueado. O comprador deve gerar outro após a expiração.')
            const valido = crypto.timingSafeEqual(Buffer.from(atual.codigo_hash, 'hex'), Buffer.from(hashCodigo(id, codigo, segredo), 'hex'))
            if (!valido) {
                await trx('tbl_pedido_site').where({ id }).increment('codigo_tentativas', 1)
                return false // commit da tentativa antes de responder com erro
            }
            const agora = new Date()
            const [entrega] = await trx('tbl_entrega').insert({ peso_estimado: 0, status: 'concluida', data_entrega: agora, id_anuncio: atual.id_anuncio, id_usuario: atual.id_comprador })
            await trx('tbl_pedido_site').where({ id }).update({ status_entrega: 'entregue', entregue_em: agora, confirmado_por: usuario, id_entrega: entrega, codigo_hash: null, codigo_expira_em: null })
            return true
        })
        if (!resultado) falhar(400, 'Código incorreto. Confira com o comprador.')
        return obter(id, usuario)
    }
    async function problema(id, usuario, motivo) {
        if (typeof motivo !== 'string' || motivo.trim().length < 10 || motivo.length > 2000) falhar(400, 'Descreva o problema em 10 a 2.000 caracteres.')
        return db.transaction(async trx => {
            await trx('tbl_pedido_site').where({ id }).forUpdate().first()
            const p = await obter(id, usuario, trx)
            if (Number(p.id_comprador) !== Number(usuario)) falhar(403, 'Somente o comprador pode relatar um problema.')
            if (p.status_pagamento !== 'approved' || p.entregue_em) falhar(409, 'Não é possível abrir problema neste pedido.')
            await trx('tbl_pedido_site').where({ id }).update({ status_entrega: 'problema', problema: motivo.trim(), problema_em: new Date(), codigo_hash: null, codigo_expira_em: null })
        })
    }
    return { iniciar, obter, publico, sincronizar, sincronizarInterno, codigo, confirmar, problema }
}
module.exports = { criarServico, validarPagamento, assinaturaValida, hashCodigo }
