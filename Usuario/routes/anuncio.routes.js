/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_anuncio
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerAnuncio = require('../controller/anuncio/anuncio_controler.js')

const router = express.Router()

// POST /  -> cria um anúncio
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerAnuncio.inserirNovoAnuncio(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os anúncios
router.get('/', async function (request, response) {
    let result = await controllerAnuncio.listarAnuncios()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um anúncio pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerAnuncio.buscarAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um anúncio
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerAnuncio.atualizarAnuncio(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um anúncio
router.delete('/:id', async function (request, response) {
    let result = await controllerAnuncio.excluirAnuncio(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router