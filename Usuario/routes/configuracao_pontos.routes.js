/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_configuracao_pontos
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerConfiguracaoPontos = require('../controller/configuracao_pontos/configuracao_pontos_controler.js')

const router = express.Router()

// GET /  -> mostra a taxa global de conversão
router.get('/', async function (request, response) {
    let result = await controllerConfiguracaoPontos.listarConfiguracaoPontos()

    response.status(result.status_code)
    response.json(result)
})

// PUT /  -> altera a taxa e o status (não há id na URL: existe uma única linha)
router.put('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerConfiguracaoPontos.atualizarConfiguracaoPontos(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// POST e DELETE não existem de propósito: a configuração é única e global

module.exports = router