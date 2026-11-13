/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_telefone
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerTelefone = require('../controller/telefone/telefone_controler.js')

const router = express.Router()

// GET /  -> lista os telefones
router.get('/', async function (request, response) {
    let result = await controllerTelefone.listarTelefones()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um telefone pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerTelefone.buscarTelefone(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um telefone (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTelefone.atualizarTelefone(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um telefone
router.delete('/:id', async function (request, response) {
    let result = await controllerTelefone.excluirTelefone(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router