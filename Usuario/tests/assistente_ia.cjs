const { test } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const router = require('../routes/ia.routes.js')

test('chat do usuário não encaminha contexto administrativo ao agente', async () => {
    const originalFetch = global.fetch
    const originalToken = process.env.AI_SECRET_TOKEN
    process.env.AI_SECRET_TOKEN = 'segredo-teste'
    let forwarded
    global.fetch = async (_url, options) => {
        forwarded = JSON.parse(options.body)
        return { status: 200, json: async () => ({ resposta: 'Tudo bem' }) }
    }
    const server = express().use('/ia', router).listen(0)
    try {
        const response = await originalFetch(`http://127.0.0.1:${server.address().port}/ia/assistant-chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: ' Olá ', audience: 'admin', context: { pontosUltimosDoisDias: 999 }, history: [] })
        })
        assert.equal(response.status, 200)
        assert.deepEqual(forwarded, { message: 'Olá', history: [], audience: 'user' })
    } finally {
        await new Promise(resolve => server.close(resolve))
        global.fetch = originalFetch
        if (originalToken === undefined) delete process.env.AI_SECRET_TOKEN
        else process.env.AI_SECRET_TOKEN = originalToken
    }
})
