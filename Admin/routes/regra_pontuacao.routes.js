/*****************************************************************************
 * Objetivo: Rotas de tbl_regra_pontuacao
 * Local: routes/regra_pontuacao.routes.js
 * No app.js:
 *   const regraPontuacaoRoutes = require('./routes/regra_pontuacao.routes.js')
 *   app.use('/meraki/ecowayer/admin/regra-pontuacao', regraPontuacaoRoutes)
 *****************************************************************************/

const express = require('express')
const bodyParser = require('body-parser')

const controller = require('../controller/regra_pontuacao/regra_pontuacao_controler.js')

const router = express.Router()
const bodyParserJSON = bodyParser.json()

const enviar = (response, resultado) => response.status(resultado.status_code).json(resultado)

router.post('/calcular', bodyParserJSON, async (request, response) => {
    enviar(response, await controller.calcularPontuacao(request.body, request.headers['content-type']))
})

// Inserir
router.post('/', bodyParserJSON, async (request, response) => {
    const resultado = await controller.inserirRegraPontuacao(request.body, request.headers['content-type'])
    enviar(response, resultado)
})

// Listar todas
router.get('/', async (request, response) => {
    enviar(response, await controller.listarRegraPontuacao())
})

// Buscar por id
router.get('/:id', async (request, response) => {
    enviar(response, await controller.buscarRegraPontuacao(request.params.id))
})

// Atualizar bônus/status
router.put('/:id', bodyParserJSON, async (request, response) => {
    const resultado = await controller.atualizarRegraPontuacao(request.body, request.params.id, request.headers['content-type'])
    enviar(response, resultado)
})

// Ativar / desativar
router.patch('/:id/status', bodyParserJSON, async (request, response) => {
    const resultado = await controller.atualizarStatusRegraPontuacao(request.body, request.params.id, request.headers['content-type'])
    enviar(response, resultado)
})

// Excluir
router.delete('/:id', async (request, response) => {
    enviar(response, await controller.excluirRegraPontuacao(request.params.id))
})

module.exports = router
