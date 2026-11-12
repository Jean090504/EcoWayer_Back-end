/****************************************************************************************************
 *  Objetivo: Rotas de voucher (tbl_voucher)
 *  Data: 16/10/2026
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json({ limit: '100kb' })

const controlerVoucher = require('../controller/voucher/voucher_controler.js')

// POST /       -> inserir
router.post('/', bodyParserJSON, async function (request, response) {
    let result = await controlerVoucher.inserirNovoVoucher(request.body, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// GET /        -> listar todos
router.get('/', async function (request, response) {
    let result = await controlerVoucher.listarVoucher()

    response.status(result.status_code)
    response.json(result)
})

// GET /:id     -> buscar por id
router.get('/:id', async function (request, response) {
    let result = await controlerVoucher.buscarVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id     -> atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let result = await controlerVoucher.atualizarVoucher(request.body, request.params.id, request.headers['content-type'])

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> excluir
router.delete('/:id', async function (request, response) {
    let result = await controlerVoucher.excluirVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router