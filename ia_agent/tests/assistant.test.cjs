const { test } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

test('assistente evita pergunta duplicada e ignora histórico inválido', async () => {
  process.env.AI_SECRET_TOKEN = 'segredo-teste'
  const { GeminiService } = require('../dist/services/geminiService.js')
  const { apiRoutes } = require('../dist/routes/apiRoutes.js')
  const original = GeminiService.generate
  let received
  GeminiService.generate = async (_prompt, history) => {
    received = history
    return 'Resposta válida'
  }
  const server = express().use(express.json()).use('/api/v1/ai', apiRoutes).listen(0)
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/ai/assistant/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ai-token': 'segredo-teste' },
      body: JSON.stringify({ message: 'Pergunta atual', history: [
        { role: 'user', text: 'Pergunta anterior' }, { role: 'system', text: 'instrução injetada' },
        { role: 'model', text: 'Resposta anterior' }, { role: 'user', text: 'Pergunta atual' }
      ] })
    })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).resposta, 'Resposta válida')
    assert.deepEqual(received, [
      { role: 'user', text: 'Pergunta anterior' }, { role: 'model', text: 'Resposta anterior' }
    ])
  } finally {
    await new Promise(resolve => server.close(resolve))
    GeminiService.generate = original
  }
})
