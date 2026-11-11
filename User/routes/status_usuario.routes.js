/****************************************************************************************************
 *  Objetivo: Rotas de Status de Usuário
 *  Data: 10/11/2026
 *  Autor: Maxw
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")
const bodyParserJSON = bodyParser.json({ limit: "100kb" })
// const verificarJWT = require("../middleware/verificarJWT.js")   // se o projeto já tiver

const controlerStatusUsuario = require("../controller/status_usuario/controler_status_usuario.js")

// Listar (estática: ANTES de /:id)
router.get("/listar", async function (request, response) {
    let limit = Math.min(Math.max(parseInt(request.query.limit) || 50, 1), 100)
    let offset = Math.max(parseInt(request.query.offset) || 0, 0)
    let result = await controlerStatusUsuario.listarStatusUsuario(limit, offset)
    response.status(result.status_code)
    response.json(result)
})

// Inserir
router.post("/inserir", /* verificarJWT, */ bodyParserJSON, async function (request, response) {
    let result = await controlerStatusUsuario.inserirNovoStatusUsuario(request.body, request.headers["content-type"])
    response.status(result.status_code)
    response.json(result)
})

// Atualizar
router.put("/atualizar/:id", /* verificarJWT, */ bodyParserJSON, async function (request, response) {
    let result = await controlerStatusUsuario.atualizarStatusUsuario(request.body, request.params.id, request.headers["content-type"])
    response.status(result.status_code)
    response.json(result)
})

// Excluir
router.delete("/delete/:id", /* verificarJWT, */ async function (request, response) {
    let result = await controlerStatusUsuario.excluirStatusUsuario(request.params.id)
    response.status(result.status_code)
    response.json(result)
})

// Buscar por ID (dinâmica: por último)
router.get("/:id", async function (request, response) {
    let result = await controlerStatusUsuario.buscarStatusUsuario(request.params.id)
    response.status(result.status_code)
    response.json(result)
})

module.exports = router