/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_usuario_missao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerUsuarioMissao = require('../controller/usuario_missao/usuario_missao_controler.js')

const router = express.Router()

// POST /  -> associa um usuário a uma missão
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerUsuarioMissao.inserirNovoUsuarioMissao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as participações
router.get('/', async function (request, response) {
    let result = await controllerUsuarioMissao.listarUsuarioMissoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma participação pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerUsuarioMissao.buscarUsuarioMissao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma participação (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerUsuarioMissao.atualizarUsuarioMissao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma participação
router.delete('/:id', async function (request, response) {
    let result = await controllerUsuarioMissao.excluirUsuarioMissao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router