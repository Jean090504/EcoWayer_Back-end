/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Usuário
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const rateLimit = require('express-rate-limit')
const bodyParserJSON = bodyParser.json()

const controlerUsuario = require('../controller/usuario/usuario_controler.js')
const { lerToken, verificarToken, revogarSessao } = require('../model/sessaoUsuario.js')
const verificacao = require('../services/verificacaoContato.js')
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development' && process.env.DISABLE_LOGIN_RATE_LIMIT === 'true'
})
const verificacaoLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false })
function responderErro(response, falha) {
    if (!falha.status) console.error('Falha na verificação de contato:', falha.code || falha.name)
    response.status(falha.status || 503).json({ status: false, message: falha.status ? falha.message : 'Verificação temporariamente indisponível.' })
}
async function registrarLogin(request, usuario) {
    if (!Number.isInteger(Number(usuario?.id)) || Number(usuario.id) <= 0) return
    try {
        await request.app.locals.dbPublicacao('tbl_acesso').insert({
            id_usuario: Number(usuario.id),
            data_acesso: request.app.locals.dbPublicacao.fn.now()
        })
    } catch (falha) {
        console.error('Falha ao registrar acesso do usuário:', falha.code || falha.name)
    }
}
router.post('/verificacao/iniciar', verificacaoLimiter, bodyParserJSON, async (request, response) => {
    try { response.json(await verificacao.iniciar(request.app.locals.dbPublicacao, request.body)) }
    catch (falha) { responderErro(response, falha) }
})
router.post('/verificacao/reenviar', verificacaoLimiter, bodyParserJSON, async (request, response) => {
    try { response.json(await verificacao.reenviar(request.app.locals.dbPublicacao, request.body?.desafio)) }
    catch (falha) { responderErro(response, falha) }
})
router.post('/verificacao/confirmar', verificacaoLimiter, bodyParserJSON, async (request, response) => {
    try { response.json(await verificacao.confirmar(request.app.locals.dbPublicacao, request.body?.desafio, request.body?.codigo)) }
    catch (falha) { responderErro(response, falha) }
})
router.post('/recuperar-senha', verificacaoLimiter, bodyParserJSON, async (request, response) => {
    try {
        await verificacao.recuperarSenha(request.app.locals.dbPublicacao, request.body?.desafio_email, request.body?.nova_senha)
        response.json({ status: true, message: 'Senha alterada. Entre novamente.' })
    } catch (falha) { responderErro(response, falha) }
})

router.post('/login', loginLimiter, bodyParserJSON, async function (request, response) {
    let result = await controlerUsuario.loginUsuario(request.body?.email, request.body?.senha)
    if (result.status_code === 200 && result.response?.token) {
        await registrarLogin(request, result.response.usuario)
        response.cookie('ecowayer_token', result.response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        })
        delete result.response.token
    }
    response.status(result.status_code).json(result)
})

router.post('/login/google', loginLimiter, bodyParserJSON, async function (request, response) {
    let result = await controlerUsuario.loginGoogle(request.body?.credential)
    if (result.status_code === 200 && result.response?.token) {
        await registrarLogin(request, result.response.usuario)
        response.cookie('ecowayer_token', result.response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        })
        delete result.response.token
    }
    response.status(result.status_code).json(result)
})

router.post('/logout', async function (request, response) {
    response.clearCookie('ecowayer_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' })
    try {
        await revogarSessao(verificarToken(lerToken(request), process.env.JWT_SECRET))
        response.status(204).end()
    } catch (erro) {
        console.error('Falha ao revogar sessão:', erro.code || erro.name)
        response.status(503).json({ message: 'Não foi possível revogar a sessão agora.' })
    }
})

// Cadastrar novo usuário (cria também e-mail, telefone, conta e vínculo com o endereço)
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = request.body
    let contentType = request.headers['content-type']
    const db = request.app.locals.dbPublicacao
    try {
        await db.transaction(async trx => {
            await verificacao.exigirConfirmado(trx, dados?.desafio_email, 'email', dados?.email)
            await verificacao.exigirConfirmado(trx, dados?.desafio_telefone, 'telefone', dados?.telefone)
            const ids = [dados.desafio_email, dados.desafio_telefone]
            const alterados = await trx('tbl_desafio_contato').whereIn('id', ids).whereNull('consumido_em').update({ consumido_em: new Date() })
            if (alterados !== 2) throw Object.assign(new Error('Verifique os contatos novamente.'), { status: 400 })
        })
    } catch (falha) { return responderErro(response, falha) }
    let result
    try { result = await controlerUsuario.inserirNovoUsuario(dados, contentType) }
    catch (falha) { result = { status: false, status_code: 500, message: 'Não foi possível criar a conta.' } }
    if (result.status_code !== 201) {
        try { await db('tbl_desafio_contato').whereIn('id', [dados.desafio_email, dados.desafio_telefone]).update({ consumido_em: null }) }
        catch (falha) { console.error('Falha ao liberar verificação após cadastro:', falha.code || falha.name) }
    }

    response.status(result.status_code)
    response.json(result)
})

// Listar todos os usuários (ANTES do /:id)
router.get('/', async function (request, response) {
    let result = await controlerUsuario.buscarUsuario(request.usuario.id)

    response.status(result.status_code)
    response.json(result)
})

// Buscar usuário por ID (inclui os endereços)
router.get('/:id', async function (request, response) {
    if (Number(request.params.id) !== Number(request.usuario.id)) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode acessar o próprio perfil.' })
    }
    let id = request.params.id
    let result = await controlerUsuario.buscarUsuario(id)

    response.status(result.status_code)
    response.json(result)
})

// Atualizar perfil do usuário por ID
router.put('/:id', bodyParserJSON, async function (request, response) {
    if (Number(request.params.id) !== Number(request.usuario.id)) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode alterar o próprio perfil.' })
    }
    let contentType = request.headers['content-type']
    let id = request.params.id
    let usuario = request.body

    let result = await controlerUsuario.atualizarUsuario(request.body, request.params.id, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Desativar (excluir) usuário por ID
router.delete('/:id', async function (request, response) {
    if (Number(request.params.id) !== Number(request.usuario.id)) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode excluir o próprio perfil.' })
    }
    let id = request.params.id
    let result = await controlerUsuario.excluirUsuario(id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
