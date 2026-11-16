const express = require('express')

const router = express.Router()

router.post('/assistant-chat', express.json(), async function (request, response) {
    const aiUrl = String(process.env.AI_AGENT_URL || 'http://localhost:3333/api/v1/ai').replace(/\/$/, '')
    const aiToken = process.env.AI_SECRET_TOKEN
    if (!aiToken) return response.status(503).json({ message: 'Assistente de IA não configurado no servidor.' })

    try {
        const aiResponse = await fetch(`${aiUrl}/assistant/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-ai-token': aiToken },
            body: JSON.stringify({ ...request.body, audience: 'user' })
        })
        const data = await aiResponse.json().catch(() => ({}))
        return response.status(aiResponse.status).json(data)
    } catch {
        return response.status(502).json({ message: 'Assistente de IA indisponível.' })
    }
})

module.exports = router
