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
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development' && process.env.DISABLE_LOGIN_RATE_LIMIT === 'true'
})

router.post('/login', loginLimiter, bodyParserJSON, async function (request, response) {
    let result = await controlerUsuario.loginUsuario(request.body?.email, request.body?.senha)
    if (result.status_code === 200 && result.response?.token) {
        response.cookie('ecowayer_token', result.response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        })
        delete result.response.token
    }
    response.status(result.status_code).json(result)
})

router.post('/logout', async function (request, response) {
    response.clearCookie('ecowayer_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
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

    let result = await controlerUsuario.inserirNovoUsuario(dados, contentType)

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
