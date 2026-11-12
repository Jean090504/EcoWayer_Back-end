/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_missao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerMissao = require('../controller/missao/missao_controler.js')

const router = express.Router()

// POST /  -> cria uma missão
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerMissao.inserirNovaMissao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as missões
router.get('/', async function (request, response) {
    let result = await controllerMissao.listarMissoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma missão pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerMissao.buscarMissao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma missão (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerMissao.atualizarMissao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma missão (bloqueada se houver usuários participando)
router.delete('/:id', async function (request, response) {
    let result = await controllerMissao.excluirMissao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router