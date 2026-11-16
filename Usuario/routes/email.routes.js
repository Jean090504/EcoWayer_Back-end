/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_email
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerEmail = require('../controller/email/email_controler.js')
const { exigirProprietario, listarSomenteProprietario } = require('../middleware/proprietario.js')

const router = express.Router()


// GET /  -> lista os e-mails
router.get('/', listarSomenteProprietario(controllerEmail.listarEmails, 'email'))

// GET /:id  -> busca um e-mail pelo id
router.get('/:id', exigirProprietario(controllerEmail.buscarEmail, 'email'), async function (request, response) {
    let result = await controllerEmail.buscarEmail(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um e-mail (id na URL, body no segundo argumento)
router.put('/:id', exigirProprietario(controllerEmail.buscarEmail, 'email'), bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerEmail.atualizarEmail(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um e-mail
router.delete('/:id', exigirProprietario(controllerEmail.buscarEmail, 'email'), async function (request, response) {
    let result = await controllerEmail.excluirEmail(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
