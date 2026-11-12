/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_telefone_verificacao
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerTelefoneVerificacao = require('../controller/telefone_verificacao/telefone_verificacao_controler.js')

const router = express.Router()

// POST /  -> vincula um telefone a uma verificação
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTelefoneVerificacao.inserirNovoTelefoneVerificacao(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os vínculos
router.get('/', async function (request, response) {
    let result = await controllerTelefoneVerificacao.listarTelefoneVerificacoes()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um vínculo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerTelefoneVerificacao.buscarTelefoneVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um vínculo (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTelefoneVerificacao.atualizarTelefoneVerificacao(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um vínculo
router.delete('/:id', async function (request, response) {
    let result = await controllerTelefoneVerificacao.excluirTelefoneVerificacao(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router