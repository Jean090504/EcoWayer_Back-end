const assert = require('node:assert/strict')
const { test } = require('node:test')
const jwt = require('jsonwebtoken')
const autenticacaoAdmin = require('../middleware/autenticacaoAdmin.js')

const segredoTeste = 'segredo-apenas-para-testes'
process.env.JWT_SECRET = segredoTeste

function executarMiddleware(cookie) {
    const request = {
        path: '/pontos',
        headers: { cookie }
    }
    const response = {
        statusCode: null,
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this }
    }
    let continuou = false
    autenticacaoAdmin(request, response, () => { continuou = true })
    return { request, response, continuou }
}

test('autentica a sessão administrativa pelo cookie HttpOnly', () => {
    const token = jwt.sign({ id: 7, tipo: 'admin' }, segredoTeste, { expiresIn: '1m', algorithm: 'HS256' })
    const resultado = executarMiddleware(`ecowayer_admin_token=${token}`)

    assert.equal(resultado.continuou, true)
    assert.equal(resultado.request.usuario.id, 7)
})

test('rejeita cookie sem privilégios administrativos', () => {
    const token = jwt.sign({ id: 7, tipo: 'usuario' }, segredoTeste, { expiresIn: '1m', algorithm: 'HS256' })
    const resultado = executarMiddleware(`ecowayer_admin_token=${token}`)

    assert.equal(resultado.continuou, false)
    assert.equal(resultado.response.statusCode, 403)
})
