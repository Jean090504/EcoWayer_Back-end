/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_denuncias
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerDenuncias = require('../controller/denuncias/denuncias_controler.js')
const { exigirProprietario, listarSomenteProprietario } = require('../middleware/proprietario.js')

const router = express.Router()

// POST /  -> registra uma denúncia
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerDenuncias.inserirNovaDenuncia({ ...request.body, id_usuario: request.usuario.id }, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as denúncias
router.get('/', listarSomenteProprietario(controllerDenuncias.listarDenuncias, 'denuncia'))

// GET /:id  -> busca uma denúncia pelo id
router.get('/:id', exigirProprietario(controllerDenuncias.buscarDenuncia, 'denuncia'), async function (request, response) {
    let result = await controllerDenuncias.buscarDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza uma denúncia (id na URL, body no segundo argumento)
router.put('/:id', exigirProprietario(controllerDenuncias.buscarDenuncia, 'denuncia'), bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerDenuncias.atualizarDenuncia(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui uma denúncia (bloqueada se houver moderação vinculada)
router.delete('/:id', exigirProprietario(controllerDenuncias.buscarDenuncia, 'denuncia'), async function (request, response) {
    let result = await controllerDenuncias.excluirDenuncia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
