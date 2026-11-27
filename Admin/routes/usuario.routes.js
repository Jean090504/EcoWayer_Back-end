/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Usuário
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerUsuario = require('../controller/usuario/usuario_controler.js')

// O cadastro completo, com verificação dos contatos, pertence à API de usuário.
router.post('/', bodyParserJSON, function (_request, response) {
    response.status(409).json({ status: false, status_code: 409, message: 'Crie a conta pelo fluxo de cadastro com validação de e-mail e telefone.' })
})

// GET /        -> listar todos (ids em ordem decrescente)
router.get('/', async function (request, response) {
    let result = await controlerUsuario.listarUsuario()

    response.status(result.status_code)
    response.json(result)
})

router.get('/gestao', async function (request, response) {
    const pagina = Number(request.query.pagina || 1)
    const limite = Number(request.query.limite || 20)
    const busca = String(request.query.busca || '').trim()
    const status = String(request.query.status || '').trim()
    if (!Number.isInteger(pagina) || pagina < 1 || !Number.isInteger(limite) || limite < 1 || limite > 100 || busca.length > 120 || !['', 'ativo', 'desativado'].includes(status)) {
        return response.status(400).json({ status: false, status_code: 400, message: 'Filtros de usuários inválidos.' })
    }
    try {
        const dados = await require('../model/DAO/usuario/usuario.js').listarUsuariosAdmin({ busca, status, pagina, limite })
        return response.status(200).json({ status: true, status_code: 200, response: dados })
    } catch (error) {
        console.error(error)
        return response.status(500).json({ status: false, status_code: 500, message: 'Erro ao listar usuários.' })
    }
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerUsuario.buscarUsuario(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerUsuario.atualizarUsuario(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

router.patch('/:id/status', bodyParserJSON, async function (request, response) {
    const result = await controlerUsuario.alterarStatusUsuario(request.params.id, request.body?.status)
    response.status(result.status_code).json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerUsuario.excluirUsuario(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
