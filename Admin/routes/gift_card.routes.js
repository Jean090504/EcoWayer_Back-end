const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const controller = require('../controller/gift_card/gift_card_controler.js')

router.get('/', async (request, response) => response.status(200).json(await controller.listarGiftCards()))
router.post('/sincronizar', async (request, response) => {
    const result = await controller.sincronizarCatalogo()
    response.status(result.status_code).json(result)
})
router.post('/', bodyParser.json(), async (request, response) => {
    const result = await controller.inserirGiftCard(request.body)
    response.status(result.status_code).json(result)
})
router.put('/:id', bodyParser.json(), async (request, response) => {
    const result = await controller.atualizarGiftCard(request.body, request.params.id)
    response.status(result.status_code).json(result)
})
router.delete('/:id', async (request, response) => {
    const result = await controller.excluirGiftCard(request.params.id)
    response.status(result.status_code).json(result)
})

module.exports = router
