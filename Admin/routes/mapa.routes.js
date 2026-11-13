const express = require('express')
const bodyParser = require('body-parser')
const controller = require('../controller/mapa/mapa_controler.js')

const router = express.Router()
const bodyParserJSON = bodyParser.json({ limit: '32kb' })

router.post('/geocodificar', bodyParserJSON, controller.geocodificar)
router.post('/geocodificar-reverso', bodyParserJSON, controller.geocodificarReverso)

module.exports = router
