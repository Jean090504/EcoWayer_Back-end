/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_conta
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const controllerConta = require('../controller/conta/conta_controler.js')
const contaDAO = require('../model/DAO/conta/conta.js')

const router = express.Router()

// GET /  -> lista as contas (sem senha)
router.get('/', async function (request, response) {
    let result = await contaDAO.selectContaByUsuario(request.usuario.id)
    if (result === false) return response.status(500).json({ status: false, status_code: 500, message: 'Erro ao consultar a conta.' })

    response.status(200).json({ status: true, status_code: 200, response: { conta: result } })
})

// GET /:id  -> busca uma conta pelo id (sem senha)
router.get('/:id', async function (request, response) {
    const contas = await contaDAO.selectContaByUsuario(request.usuario.id)
    if (!contas || !contas.some((conta) => Number(conta.id) === Number(request.params.id))) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode acessar a própria conta.' })
    }
    let result = await controllerConta.buscarConta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> troca a senha da conta (id na URL, body no segundo argumento)
router.put('/:id', bodyParserJSON, async function (request, response) {
    const contas = await contaDAO.selectContaByUsuario(request.usuario.id)
    if (!contas || !contas.some((conta) => Number(conta.id) === Number(request.params.id))) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode alterar a própria conta.' })
    }
    let contentType = request.headers['content-type']
    let result = await controllerConta.atualizarConta(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui a conta
router.delete('/:id', async function (request, response) {
    const contas = await contaDAO.selectContaByUsuario(request.usuario.id)
    if (!contas || !contas.some((conta) => Number(conta.id) === Number(request.params.id))) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você só pode excluir a própria conta.' })
    }
    let result = await controllerConta.excluirConta(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
