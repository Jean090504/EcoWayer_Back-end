/**
 * Dados exibidos na Home do painel administrativo.
 * A Home e o dashboard usam a mesma fonte para manter os indicadores
 * consistentes entre as telas.
 */

const express = require('express')
const router = express.Router()

const controlerPontos = require('../controller/pontos/pontos_controler.js')

// GET /meraki/ecowayer/admin/home?period=diario|semanal|mensal
// GET /meraki/ecowayer/admin/home/dashboard?period=diario|semanal|mensal
router.get(['/', '/dashboard'], async function (request, response) {
    const result = await controlerPontos.buscarDashboardPontos(request.query.period)
    response.status(result.status_code)
    response.json(result)
})

module.exports = router
