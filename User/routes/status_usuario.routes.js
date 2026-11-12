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

const controlerStatusUsuario = require("../controller/status_usuario/status_usuario_controler.js")

// Listar
router.get("/", async function (request, response) {
    let limit = Math.min(Math.max(parseInt(request.query.limit) || 50, 1), 100)
    let offset = Math.max(parseInt(request.query.offset) || 0, 0)
    let result = await controlerStatusUsuario.listarStatusUsuario(limit, offset)
    response.status(result.status_code)
    response.json(result)
})

// Inserir
router.post("/", bodyParserJSON, async function (request, response) {
    let result = await controlerStatusUsuario.inserirNovoStatusUsuario(request.body, request.headers["content-type"])
    response.status(result.status_code)
    response.json(result)
})

// Buscar por ID (estática acima; dinâmica por último)
router.get("/:id", async function (request, response) {
    let result = await controlerStatusUsuario.buscarStatusUsuario(request.params.id)
    response.status(result.status_code)
    response.json(result)
})

// Atualizar
router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controlerStatusUsuario.atualizarStatusUsuario(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// Excluir
router.delete("/:id", async function (request, response) {
    let result = await controlerStatusUsuario.excluirStatusUsuario(request.params.id)
    response.status(result.status_code)
    response.json(result)
})

module.exports = router