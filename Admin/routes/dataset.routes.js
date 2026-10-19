/**************************************************************************************
 * Objetivo: Rotas (endpoints) do CRUD de dataset
 * Local: routes/dataset.routes.js
 *
 * Registro no app:
 *   const datasetRouter = require('./routes/dataset.routes.js') //Rotas responsaveis pelo dataset
 *   app.use('/meraki/ecowayer/admin/dataset', cors(corsOptions), datasetRouter)
 **************************************************************************************/

const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerDataset = require('../controller/dataset/dataset_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerDataset.inserirNovoDataset(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerDataset.listarDataset()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerDataset.buscarDataset(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerDataset.atualizarDataset(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerDataset.excluirDataset(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router