const express = require('express')
const controller = require('../controller/rota/rota_controller.js')

const router = express.Router()

router.post('/', express.json({ limit: '16kb' }), controller.calcularRota)

module.exports = router
