const express = require('express')
const controller = require('../controller/carteira/carteira_controller.js')

const router = express.Router()

router.get('/', controller.buscarCarteira)

module.exports = router
