/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_insignia
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerInsignia = require('../controller/insignia/insignia_controler.js')

const router = express.Router()

// POST /  -> cria uma insígnia
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerInsignia.inserirNovaInsignia(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as insígnias
router.get('/', async function (request, response) {
    let result = await controllerInsignia.listarInsignias()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca uma insígnia pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerInsignia.buscarInsignia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma insígnia (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerInsignia.atualizarInsignia(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma insígnia (bloqueada se houver usuários com ela)
router.delete('/:id', async function (request, response) {
    let result = await controllerInsignia.excluirInsignia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router