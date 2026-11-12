/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_email
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerEmail = require('../controller/email/email_controler.js')

const router = express.Router()


// GET /  -> lista os e-mails
router.get('/', async function (request, response) {
    let result = await controllerEmail.listarEmails()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um e-mail pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerEmail.buscarEmail(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um e-mail (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEmail.atualizarEmail(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um e-mail
router.delete('/:id', async function (request, response) {
    let result = await controllerEmail.excluirEmail(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router