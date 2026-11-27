const crypto = require('crypto')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const { validarSenha } = require('../controller/modulo/validacaoSenha')

const erro = (status, message) => Object.assign(new Error(message), { status })
const normalizar = (tipo, destino) => tipo === 'email'
    ? String(destino || '').trim().toLowerCase()
    : String(destino || '').replace(/\D/g, '')
const destinoValido = (tipo, destino) => tipo === 'email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino) && destino.length <= 255
    : /^\d{10,11}$/.test(destino)
const resumo = item => ({ desafio: item.id, expira_em: item.expira_em })
function assinatura(id, codigo) {
    if (!process.env.JWT_SECRET) throw erro(503, 'Verificação temporariamente indisponível.')
    return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${id}:${codigo}`).digest('hex')
}
async function enviar(tipo, destino, codigo) {
    if (tipo === 'email') {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) throw erro(503, 'O envio de e-mail ainda não foi configurado.')
        const transporte = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT || 587) === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } })
        await transporte.sendMail({ from: SMTP_FROM, to: destino, subject: 'Código de verificação EcoWayer', text: `Seu código EcoWayer é ${codigo}. Ele expira em 10 minutos. Não compartilhe este código.` })
    } else {
        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) throw erro(503, 'O envio de SMS ainda não foi configurado.')
        const numero = `+55${destino}`
        const resposta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`, {
            method: 'POST',
            headers: { Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ To: numero, From: TWILIO_FROM, Body: `Seu código EcoWayer é ${codigo}. Válido por 10 minutos.` }),
            signal: AbortSignal.timeout(10000)
        })
        if (!resposta.ok) throw erro(503, 'Não foi possível enviar o SMS. Confira o número e tente novamente.')
    }
}
async function iniciar(db, dados) {
    const tipo = dados?.tipo
    const finalidade = dados?.finalidade
    const destino = normalizar(tipo, dados?.destino)
    if (!['email', 'telefone'].includes(tipo) || !['cadastro', 'recuperacao'].includes(finalidade) ||
        (finalidade === 'recuperacao' && tipo !== 'email') || !destinoValido(tipo, destino)) throw erro(400, 'Contato ou finalidade inválidos.')
    if (finalidade === 'cadastro') {
        const tabela = tipo === 'email' ? 'tbl_email' : 'tbl_telefone'
        const coluna = tipo === 'email' ? 'email' : 'numero'
        if (await db(tabela).where({ [coluna]: destino }).first()) throw erro(409, 'Este contato já está cadastrado.')
    }
    if (finalidade === 'recuperacao' && !await db('tbl_email').where({ email: destino }).first()) {
        // Não revela se há uma conta com este e-mail.
        throw erro(400, 'Não foi possível iniciar a recuperação para este e-mail.')
    }
    const ultimo = await db('tbl_desafio_contato').where({ tipo, destino, finalidade }).orderBy('criado_em', 'desc').first()
    if (ultimo && Date.now() - new Date(ultimo.enviado_em).getTime() < 60000) throw erro(429, 'Aguarde 60 segundos para solicitar outro código.')
    const id = crypto.randomUUID()
    const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
    const agora = new Date()
    const item = { id, tipo, finalidade, destino, codigo_hash: assinatura(id, codigo), criado_em: agora, enviado_em: agora, expira_em: new Date(agora.getTime() + 600000), tentativas: 0 }
    await db('tbl_desafio_contato').insert(item)
    try { await enviar(tipo, destino, codigo) }
    catch (falha) {
        await db('tbl_desafio_contato').where({ id }).delete()
        throw falha
    }
    await db('tbl_desafio_contato').where({ tipo, destino, finalidade }).whereNot({ id }).whereNull('consumido_em')
        .update({ consumido_em: new Date() })
    return resumo(item)
}
async function reenviar(db, id) {
    if (!/^[a-f\d-]{36}$/i.test(String(id || ''))) throw erro(400, 'Solicite um novo código.')
    const item = await db('tbl_desafio_contato').where({ id }).first()
    if (!item || item.consumido_em || item.confirmado_em) throw erro(400, 'Solicite um novo código.')
    if (Date.now() - new Date(item.enviado_em).getTime() < 60000) throw erro(429, 'Aguarde 60 segundos para reenviar o código.')
    const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
    await enviar(item.tipo, item.destino, codigo)
    const agora = new Date()
    await db('tbl_desafio_contato').where({ id }).update({ codigo_hash: assinatura(id, codigo), enviado_em: agora, expira_em: new Date(agora.getTime() + 600000), tentativas: 0 })
    return resumo({ id, expira_em: new Date(agora.getTime() + 600000) })
}
async function confirmar(db, id, codigo) {
    if (!/^[a-f\d-]{36}$/i.test(String(id || '')) || !/^\d{6}$/.test(String(codigo || ''))) throw erro(400, 'Código inválido.')
    return db.transaction(async trx => {
        const item = await trx('tbl_desafio_contato').where({ id }).forUpdate().first()
        if (!item || item.consumido_em || new Date(item.expira_em).getTime() <= Date.now() || item.tentativas >= 5) throw erro(400, 'Código expirado ou inválido. Solicite outro.')
        const recebido = Buffer.from(assinatura(id, codigo), 'hex')
        const esperado = Buffer.from(item.codigo_hash, 'hex')
        if (recebido.length !== esperado.length || !crypto.timingSafeEqual(recebido, esperado)) {
            await trx('tbl_desafio_contato').where({ id }).increment('tentativas', 1)
            return { invalido: true }
        }
        if (!item.confirmado_em) await trx('tbl_desafio_contato').where({ id }).update({ confirmado_em: new Date() })
        return { confirmado: true }
    }).then(resultado => {
        if (resultado.invalido) throw erro(400, 'Código inválido.')
        return resultado
    })
}
async function exigirConfirmado(db, id, tipo, destino, finalidade = 'cadastro') {
    if (!/^[a-f\d-]{36}$/i.test(String(id || ''))) throw erro(400, `Confirme ${tipo === 'email' ? 'o e-mail' : 'o telefone'} antes de continuar.`)
    const item = await db('tbl_desafio_contato').where({ id, tipo, finalidade, destino: normalizar(tipo, destino) }).first()
    if (!item?.confirmado_em || item.consumido_em || new Date(item.expira_em).getTime() <= Date.now()) throw erro(400, `Confirme ${tipo === 'email' ? 'o e-mail' : 'o telefone'} antes de continuar.`)
}
async function recuperarSenha(db, id, novaSenha) {
    const falhaSenha = validarSenha(novaSenha)
    if (falhaSenha) throw erro(400, falhaSenha)
    if (!/^[a-f\d-]{36}$/i.test(String(id || ''))) throw erro(400, 'Verifique seu e-mail novamente.')
    await db.transaction(async trx => {
        const item = await trx('tbl_desafio_contato').where({ id, tipo: 'email', finalidade: 'recuperacao' }).forUpdate().first()
        if (!item?.confirmado_em || item.consumido_em || new Date(item.expira_em).getTime() <= Date.now()) throw erro(400, 'Verifique seu e-mail novamente.')
        const email = await trx('tbl_email').where({ email: item.destino }).first('id')
        if (!email) throw erro(400, 'Conta não encontrada.')
        await trx('tbl_conta').where({ id_email: email.id }).update({ senha: await bcrypt.hash(novaSenha, 10) })
        await trx('tbl_desafio_contato').where({ id }).update({ consumido_em: new Date() })
    })
}
module.exports = { iniciar, reenviar, confirmar, exigirConfirmado, recuperarSenha }
