/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_horario_ponto_coleta
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerHorarioPontoColeta = require('../controller/horario_ponto_coleta/horario_ponto_coleta_controler.js')

const router = express.Router()

// POST /  -> cadastra um horário de funcionamento
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerHorarioPontoColeta.inserirNovoHorarioPontoColeta(request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista todos os horários
router.get('/', async function (request, response) {
    let result = await controllerHorarioPontoColeta.listarHorariosPontoColeta()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id  -> busca um horário pelo id
router.get('/:id', async function (request, response) {
    let result = await controllerHorarioPontoColeta.buscarHorarioPontoColeta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um horário
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerHorarioPontoColeta.atualizarHorarioPontoColeta(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um horário
router.delete('/:id', async function (request, response) {
    let result = await controllerHorarioPontoColeta.excluirHorarioPontoColeta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router