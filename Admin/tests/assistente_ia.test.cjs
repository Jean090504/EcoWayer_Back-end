const { test } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const controllerPath = require.resolve('../controller/ia/ia_controler.js')
require.cache[controllerPath] = { id: controllerPath, filename: controllerPath, loaded: true, exports: {} }
for (const [path, exports] of [
    ['../model/DAO/pontos/pontos.js', { dbContexto: {} }],
    ['../controller/pontos/pontos_controler.js', { buscarDashboardPontos: async () => ({}) }],
    ['../services/contextoAssistente.js', { obterContextoPainel: async () => ({ pontosUltimosDoisDias: 99 }) }]
]) {
    const id = require.resolve(path)
    require.cache[id] = { id, filename: id, loaded: true, exports }
}
const router = require('../routes/ia.routes.js')
delete require.cache[controllerPath]

test('chat administrativo encaminha mensagem, contexto e credencial ao agente de IA', async () => {
    const originalFetch = global.fetch
    const originalToken = process.env.AI_SECRET_TOKEN
    process.env.AI_SECRET_TOKEN = 'segredo-teste'
    let forwarded
    global.fetch = async (url, options) => {
        forwarded = { url, options }
        return { status: 200, json: async () => ({ resposta: 'Resposta do agente' }) }
    }
    const app = express().use('/ia', router)
    const server = app.listen(0)
    try {
        const address = server.address()
        const response = await originalFetch(`http://127.0.0.1:${address.port}/ia/assistant-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: ' Quantos pontos? ', audience: 'user', history: [], context: { pontosUltimosDoisDias: 12 } })
        })
        assert.equal(response.status, 200)
        assert.equal((await response.json()).resposta, 'Resposta do agente')
        assert.match(forwarded.url, /\/assistant\/chat$/)
        assert.equal(forwarded.options.headers['x-ai-token'], 'segredo-teste')
        assert.deepEqual(JSON.parse(forwarded.options.body), {
            message: 'Quantos pontos?', history: [], context: { pontosUltimosDoisDias: 99 }, audience: 'admin'
        })
    } finally {
        await new Promise(resolve => server.close(resolve))
        global.fetch = originalFetch
        if (originalToken === undefined) delete process.env.AI_SECRET_TOKEN
        else process.env.AI_SECRET_TOKEN = originalToken
    }
})
