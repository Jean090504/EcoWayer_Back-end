/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_tipo_denuncias
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerTipoDenuncias = require('../controller/tipo_denuncias/tipo_denuncias_controler.js')

const router = express.Router()

// POST /  -> cria um tipo de denúncia
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTipoDenuncias.inserirNovoTipoDenuncia(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os tipos
router.get('/', async function (request, response) {
    let result = await controllerTipoDenuncias.listarTiposDenuncia()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um tipo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerTipoDenuncias.buscarTipoDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um tipo (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerTipoDenuncias.atualizarTipoDenuncia(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um tipo (bloqueado se houver denúncias usando)
router.delete('/:id', async function (request, response) {
    let result = await controllerTipoDenuncias.excluirTipoDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router