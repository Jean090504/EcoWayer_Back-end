const express = require('express')
const rateLimit = require('express-rate-limit')

const router = express.Router()

router.post('/assistant-chat', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), express.json(), async function (request, response) {
    const message = request.body?.message
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
        return response.status(400).json({ message: 'Informe uma mensagem de até 2000 caracteres.' })
    }
    const aiUrl = String(process.env.AI_AGENT_URL || 'http://localhost:3333/api/v1/ai').replace(/\/$/, '')
    const aiToken = process.env.AI_SECRET_TOKEN
    if (!aiToken) return response.status(503).json({ message: 'Assistente de IA não configurado no servidor.' })

    try {
        const aiResponse = await fetch(`${aiUrl}/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-ai-token': aiToken },
            body: JSON.stringify({
                message: message.trim(),
                history: Array.isArray(request.body.history) ? request.body.history.slice(-10) : [],
                audience: 'user'
            }),
            signal: AbortSignal.timeout(20000)
        })
        const data = await aiResponse.json().catch(() => ({}))
        return response.status(aiResponse.status).json(data)
    } catch {
        return response.status(502).json({ message: 'Assistente de IA indisponível.' })
    }
})

module.exports = router
