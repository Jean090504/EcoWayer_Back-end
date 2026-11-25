/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de acesso
 * Local: routes/acesso.routes.js
 *
 * Registro no app:
 *   const acessoRouter = require('./routes/acesso.routes.js') //Rotas responsaveis pelos acessos dos usuarios
 *   app.use('/meraki/ecowayer/admin/acesso', cors(corsOptions), acessoRouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerAcesso = require('../controller/acesso/acesso_controler.js')
const loginLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false
})

// POST /login -> autenticar administrador e emitir JWT
router.post('/login', loginLimiter, bodyParserJSON, async function (request, response) {
    let result = await controlerAcesso.loginAdministrador(request.body, request.headers['content-type'])

    if (result.status_code === 200 && result.response?.token) {
        response.cookie('ecowayer_admin_token', result.response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/meraki/ecowayer/admin'
        })
        delete result.response.token
    }

    response.status(result.status_code)
    response.json(result)
})

router.post('/logout', function (_request, response) {
    response.clearCookie('ecowayer_admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/meraki/ecowayer/admin'
    })
    response.status(204).end()
})

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerAcesso.inserirNovoAcesso(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerAcesso.listarAcesso()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerAcesso.buscarAcesso(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerAcesso.atualizarAcesso(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerAcesso.excluirAcesso(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
