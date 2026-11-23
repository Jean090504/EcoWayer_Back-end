/****************************************************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas de Mensagens
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 *****************************************************************************************************/
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const bodyParserJSON = bodyParser.json()

const controlerMensagens = require('../controller/mensagens/mensagens_controler.js')

const conexoesPorUsuario = new Map()

router.get('/eventos', (request, response) => {
    const id = Number(request.usuario.id)
    const conexoes = conexoesPorUsuario.get(id) || new Set()
    if (conexoes.size >= 5) return response.status(429).end()

    response.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
    })
    response.flushHeaders()
    response.write('retry: 3000\n\n')
    conexoes.add(response)
    conexoesPorUsuario.set(id, conexoes)

    const heartbeat = setInterval(() => response.write(': keep-alive\n\n'), 15000)
    const restante = Number(request.usuario.exp) * 1000 - Date.now()
    const revalidar = setTimeout(() => response.end(), Math.min(120000, Math.max(0, restante)))
    response.once('close', () => {
        clearInterval(heartbeat)
        clearTimeout(revalidar)
        conexoes.delete(response)
        if (!conexoes.size) conexoesPorUsuario.delete(id)
    })
})

// Enviar nova mensagem (também gera a notificação para a outra pessoa da conversa)
router.post('/', bodyParserJSON, async function (request, response) {
    let dados = { ...request.body, id_remetente: request.usuario.id }
    let contentType = request.headers['content-type']

    let result = await controlerMensagens.inserirNovaMensagem(dados, contentType)

    response.status(result.status_code)
    response.json(result)
    if (result.status_code === 201) {
        const mensagem = result.response?.mensagem
        const destinatario = Number(mensagem?.id_interessado) === Number(dados.id_remetente)
            ? Number(mensagem?.id_anunciante)
            : Number(mensagem?.id_interessado)
        for (const conexao of conexoesPorUsuario.get(destinatario) || []) {
            if (!conexao.writableEnded && !conexao.destroyed && !conexao.writableNeedDrain) {
                conexao.write('event: mensagem\ndata: nova\n\n')
            }
        }
    }
})

// Listar as mensagens de uma conversa (ANTES do /:id). Obrigatório: ?id_conversa=1
router.get('/', async function (request, response) {
    let idConversa = request.query.id_conversa

    let result = await controlerMensagens.listarMensagem(idConversa, request.usuario.id)

    response.status(result.status_code)
    response.json(result)
})

// Buscar mensagem por ID
router.get('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMensagens.buscarMensagem(id, request.usuario.id)

    response.status(result.status_code)
    response.json(result)
})

// Marcar mensagem como lida: PUT com { "lida": true }
router.put('/lidas', bodyParserJSON, async function (request, response) {
    const result = await controlerMensagens.marcarConversaLida(request.body?.id_conversa, request.body?.ate_id, request.usuario.id)
    response.status(result.status_code).json(result)
})

router.put('/:id', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let id = request.params.id
    let mensagem = request.body

    let result = await controlerMensagens.atualizarMensagem(mensagem, id, contentType, request.usuario.id)

    response.status(result.status_code)
    response.json(result)
})

// Excluir mensagem por ID
router.delete('/:id', async function (request, response) {
    let id = request.params.id
    let result = await controlerMensagens.excluirMensagem(id, request.usuario.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
