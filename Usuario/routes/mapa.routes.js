const express = require('express')
const controller = require('../controller/mapa/mapa_controller.js')

const router = express.Router()

router.post('/geocodificar', express.json({ limit: '8kb' }), controller.geocodificar)
router.post('/locais-reciclagem', express.json({ limit: '8kb' }), controller.buscarLocaisReciclagem)

module.exports = router
