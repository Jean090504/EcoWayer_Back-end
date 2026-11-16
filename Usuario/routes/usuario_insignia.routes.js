/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_usuario_insignia
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerUsuarioInsignia = require('../controller/usuario_insignia/usuario_insignia_controler.js')
const { exigirProprietario, listarSomenteProprietario } = require('../middleware/proprietario.js')

const router = express.Router()

// POST /  -> associa um usuário a uma insígnia
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerUsuarioInsignia.inserirNovoUsuarioInsignia({ ...request.body, id_usuario: request.usuario.id }, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista as conquistas e progressos
router.get('/', listarSomenteProprietario(controllerUsuarioInsignia.listarUsuarioInsignias, 'usuario_insignia'))

// GET /:id  -> busca um registro pelo id
router.get('/:id', exigirProprietario(controllerUsuarioInsignia.buscarUsuarioInsignia, 'usuario_insignia'), async function (request, response) {
    let result = await controllerUsuarioInsignia.buscarUsuarioInsignia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um registro (id na URL, body no segundo argumento)
router.put('/:id', exigirProprietario(controllerUsuarioInsignia.buscarUsuarioInsignia, 'usuario_insignia'), bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerUsuarioInsignia.atualizarUsuarioInsignia(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um registro
router.delete('/:id', exigirProprietario(controllerUsuarioInsignia.buscarUsuarioInsignia, 'usuario_insignia'), async function (request, response) {
    let result = await controllerUsuarioInsignia.excluirUsuarioInsignia(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
