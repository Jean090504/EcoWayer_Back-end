/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_imagem_anuncio
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerImagemAnuncio = require('../controller/imagem_anuncio/imagem_anuncio_controler.js')

const router = express.Router()

// POST /  -> vincula uma imagem a um anúncio
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerImagemAnuncio.inserirNovaImagemAnuncio(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os vínculos
router.get('/', async function (request, response) {
    let result = await controllerImagemAnuncio.listarImagensAnuncio()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um vínculo pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerImagemAnuncio.buscarImagemAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um vínculo
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerImagemAnuncio.atualizarImagemAnuncio(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um vínculo
router.delete('/:id', async function (request, response) {
    let result = await controllerImagemAnuncio.excluirImagemAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router