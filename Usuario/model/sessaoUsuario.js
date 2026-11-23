const { createHmac, randomUUID } = require('node:crypto')
const jwt = require('jsonwebtoken')
const knex = require('knex')
const db = knex(require('./database_config_knex/knexFile.js').development)

function assinaturaConta(email, senhaHash, segredo) {
    return createHmac('sha256', segredo).update(JSON.stringify([email, senhaHash])).digest('hex')
}

function emitirToken(conta, segredo) {
    return jwt.sign({
        id: conta.id,
        email: conta.email,
        tipo: 'usuario',
        versaoConta: assinaturaConta(conta.email, conta.senha, segredo)
    }, segredo, {
        jwtid: randomUUID(),
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        algorithm: 'HS256'
    })
}

function lerToken(req) {
    const [tipo, token] = (req.headers.authorization || '').split(' ')
    if (tipo === 'Bearer') return token
    return String(req.headers.cookie || '').split(';')
        .map(item => item.trim())
        .find(item => item.startsWith('ecowayer_token='))
        ?.slice('ecowayer_token='.length)
}

function verificarToken(token, segredo) {
    if (!token || !segredo) return null
    try {
        return jwt.verify(token, segredo, { algorithms: ['HS256'] })
    } catch {
        return null
    }
}

async function consultarSessao(usuario, segredo) {
    if (!usuario.jti || !usuario.versaoConta) return false
    const conta = await db('tbl_usuario as u')
        .join('tbl_status_usuario as s', 's.id', 'u.id_status_usuario')
        .join('tbl_email as e', 'e.id_usuario', 'u.id')
        .join('tbl_conta as c', 'c.id_email', 'e.id')
        .leftJoin('tbl_sessao_usuario_revogada as r', function () {
            this.onVal('r.id_token', usuario.jti)
        })
        .where({ 'u.id': usuario.id, 'e.email': usuario.email, 's.status': 'ativo' })
        .whereNull('r.id_token')
        .first('e.email', 'c.senha')
    return Boolean(conta && assinaturaConta(conta.email, conta.senha, segredo) === usuario.versaoConta)
}

async function revogarSessao(usuario) {
    if (usuario?.tipo !== 'usuario' || !usuario.jti) return
    await db('tbl_sessao_usuario_revogada').insert({
        id_token: usuario.jti,
        expira_em: new Date(usuario.exp * 1000)
    }).onConflict('id_token').ignore()
    await db('tbl_sessao_usuario_revogada').where('expira_em', '<=', db.fn.now()).del()
}

module.exports = { emitirToken, lerToken, verificarToken, consultarSessao, revogarSessao }
