import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { env } from '../config/env'
import { AiInferenceModel } from '../models/AiInferenceModel'
import { AIAuditLog } from '../models/AIAuditLog'
import { AICatalogModel } from '../models/AICatalogModel'
import { GeminiService } from '../services/geminiService.js'

export const apiRoutes = Router()
const inferenceEngine = new AiInferenceModel()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_BYTES }
})

// Middleware de validação do Token de Segurança 
const requireAiToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-ai-token']
  if (!token || token !== env.AI_SECRET_TOKEN) {
    res.status(401).json({ error: 'Acesso não autorizado: x-ai-token inválido ou ausente.' })
    return
  }
  next()
}

apiRoutes.use(requireAiToken)

apiRoutes.post('/assistant/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history = [], audience = 'user', context = null } = req.body
    if (!String(message || '').trim()) {
      res.status(400).json({ error: 'O campo message é obrigatório.' })
      return
    }
    const pergunta = String(message).toLocaleLowerCase('pt-BR')
    if (context?.pontosUltimosDoisDias != null && /ponto|pontua/.test(pergunta) && /(últimos|ultimos|dois|2)/.test(pergunta)) {
      const total = Number(context.pontosUltimosDoisDias || 0).toLocaleString('pt-BR')
      res.json({ resposta: `Nos últimos 2 dias, foram gerados ${total} pontos no EcoWayer.`, model: 'painel-ecowayer', provider: 'dashboard' })
      return
    }
    const dadosDoPainel = context ? `Dados reais disponíveis do painel: ${JSON.stringify(context).slice(0, 4000)}. Use esses dados quando responder. Nunca diga que não tem acesso ao painel quando a informação estiver nesses dados.` : 'Nenhum dado do painel foi fornecido para esta pergunta; não invente números.'
    const prompt = `Você é a Eco, assistente do EcoWayer. Responda exclusivamente em português do Brasil, com naturalidade, clareza e objetividade. Vá direto ao ponto: use no máximo 3 frases curtas ou até 3 bullets quando uma lista realmente ajudar. Não faça apresentações longas, não repita o contexto e não liste todos os módulos sem que isso seja pedido. Fale apenas sobre a plataforma EcoWayer e não invente dados, produtos, regras ou endereços. Se o assunto for externo ao EcoWayer, diga em uma frase que só pode ajudar com a plataforma. ${dadosDoPainel} Mensagem: ${String(message).slice(0, 2000)}`
    const contexto = audience === 'admin'
      ? 'Você atende um administrador do EcoWayer. Oriente sobre o painel, categorias, regras de pontuação, itens, usuários, chamados, pontos de coleta e relatórios. Não sugira compras.'
      : 'Você atende um usuário do EcoWayer. Ajude a encontrar produtos recicláveis e a entender categorias, pontos de coleta e o funcionamento da plataforma.'
    const resposta = await GeminiService.generate(`${contexto} ${prompt}`, Array.isArray(history) ? history.slice(-10) : [])
    res.json({ resposta, model: env.GEMINI_MODEL, provider: 'gemini' })
  } catch (err: any) {
    console.error('Falha temporária no assistente Gemini:', err?.message || err)
    res.status(200).json({
      resposta: req.body?.audience === 'admin'
        ? 'No momento não consigo consultar a IA. Tente novamente em alguns instantes; posso ajudar com as operações do painel EcoWayer.'
        : 'No momento não consigo consultar a IA. Tente novamente em alguns instantes; posso ajudar com produtos e com o funcionamento do EcoWayer.',
      model: env.GEMINI_MODEL,
      provider: 'fallback'
    })
  }
})

async function ensureDefaultAiModelId(): Promise<number> {
  const active = await AICatalogModel.findActiveProductionModel()
  if (active && active.id) return active.id

  try {
    return await AICatalogModel.register({
      nome: 'EcoWayer-VisionMod-Core',
      versao: 'v1.4.2-onnx',
      provedor: 'ONNX_LOCAL',
      status: 'EM_PRODUCAO',
      acuracia_aprovada: 0.9200
    })
  } catch {
    return 1
  }
}


apiRoutes.post('/moderation/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId, senderId, text } = req.body

    if (!messageId || !text) {
      res.status(400).json({ error: 'Os campos messageId e text são obrigatórios.' })
      return
    }

    const decision = await inferenceEngine.executeInference(String(messageId), String(text))

    if (decision.humanReviewRequired || !decision.moderation?.isApproved) {
      const idIa = await ensureDefaultAiModelId()
      const motivo = decision.internalNote || decision.moderation?.reasons.join('; ') || 'Suspeita detetada pela IA'
      const acao = !decision.verifiedByAi ? 'CONFERENCIA_HUMANA' : 'BLOQUEADO'

      await AIAuditLog.record({
        id_ia: idIa,
        id_usuario: null, // Evita falha de Foreign Key caso o senderId 102 ainda não exista em tbl_usuario
        tipo_alvo: 'CHAT_MENSAGEM',
        id_alvo: String(messageId),
        motivo,
        status: 'PENDENTE',
        acao
      })
    }

    res.status(200).json(decision)
  } catch (err) {
    next(err)
  }
})

apiRoutes.post('/moderation/listing', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId, title, description } = req.body
    const imageBuffer = req.file?.buffer

    if (!listingId || !title) {
      res.status(400).json({ error: 'Os campos listingId e title são obrigatórios.' })
      return
    }

    const combinedText = `${title} ${description || ''}`
    const decision = await inferenceEngine.executeInference(String(listingId), combinedText, imageBuffer)

    if (decision.humanReviewRequired) {
      const idIa = await ensureDefaultAiModelId()
      const motivo = decision.internalNote || decision.moderation?.reasons.join('; ') || 'Confiança abaixo de 85%'
      const acao = !decision.verifiedByAi ? 'CONFERENCIA_HUMANA' : 'REVISAO_QUALIDADE'

      await AIAuditLog.record({
        id_ia: idIa,
        id_usuario: null,
        tipo_alvo: 'ANUNCIO_ITEM',
        id_alvo: String(listingId),
        motivo,
        status: 'PENDENTE',
        acao
      })
    }

    res.status(200).json(decision)
  } catch (err) {
    next(err)
  }
})
