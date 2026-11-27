import { env } from '../config/env.js'

type GeminiPart = { text: string } | { inlineData: { mimeType: string, data: string } }

function imageMimeType(data: Buffer): string {
  if (data.subarray(0, 3).toString('hex') === 'ffd8ff') return 'image/jpeg'
  if (data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png'
  if (data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  throw new Error('Formato de imagem não suportado. Envie JPEG, PNG ou WebP.')
}

export class GeminiService {
  private static readonly fallbackModels = ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-3.7-flash']
  static isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY)
  }

  static async generate(prompt: string, history: Array<{ role: 'user' | 'model', text: string }> = [], imageBuffer?: Buffer, signal?: AbortSignal): Promise<string> {
    if (!this.isConfigured()) throw new Error('GEMINI_API_KEY não configurada')

    const parts: GeminiPart[] = [{ text: prompt }]
    if (imageBuffer?.length) {
      parts.push({ inlineData: { mimeType: imageMimeType(imageBuffer), data: imageBuffer.toString('base64') } })
    }

    const contents = [
      ...history.map((item) => ({ role: item.role, parts: [{ text: item.text }] })),
      { role: 'user', parts }
    ]
    const models = [...new Set([env.GEMINI_MODEL, ...this.fallbackModels])]
    let lastError = 'Gemini não retornou texto'
    for (const model of models) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.2 } }),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000)
      })
      const data = await response.json().catch(() => ({})) as any
      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim()
        if (text) return text
        lastError = 'Gemini não retornou texto'
        continue
      }
      lastError = data?.error?.message || `Gemini HTTP ${response.status}`
      if (![404, 503].includes(response.status) && !/no longer available/i.test(lastError)) break
    }
    throw new Error(lastError)
  }

  static async analyzeListing(title: string, description: string, imageBuffer?: Buffer, signal?: AbortSignal): Promise<{ approved: boolean, category: string, condition: string, confidence: number, reasons: string[] }> {
    const text = await this.generate(
      `Você é um revisor de anúncios de um mercado de usados, trocas e doações. Examine a imagem enviada e compare-a com o título e a descrição. Responda SOMENTE JSON válido no formato {"approved":true,"category":"categoria curta do objeto visível","condition":"novo|ótimo estado|usado|danificado","confidence":0.0,"reasons":[]}. Só aprove se o objeto principal for reconhecível, compatível com o anúncio e a imagem não contiver conteúdo proibido. Se a foto estiver ilegível, inconclusiva ou divergente, use approved=false, confidence abaixo de 0.85 e explique o motivo. Não infira detalhes invisíveis, como marca, funcionamento ou defeitos internos. Título: ${title}. Descrição: ${description}`,
      [],
      imageBuffer,
      signal
    )
    const json = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''))
    if (typeof json.approved !== 'boolean' || !Number.isFinite(Number(json.confidence)) || !String(json.category || '').trim()) {
      throw new Error('Resposta de classificação visual inválida')
    }
    const condition = ['novo', 'ótimo estado', 'usado', 'danificado'].includes(json.condition) ? json.condition : 'usado'
    return {
      approved: Boolean(json.approved),
      category: String(json.category || 'Não Identificado'),
      condition,
      confidence: Math.max(0, Math.min(1, Number(json.confidence) || 0)),
      reasons: Array.isArray(json.reasons) ? json.reasons.map(String) : []
    }
  }
}
