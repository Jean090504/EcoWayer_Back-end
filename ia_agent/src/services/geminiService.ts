import { env } from '../config/env.js'

type GeminiPart = { text: string } | { inlineData: { mimeType: string, data: string } }

export class GeminiService {
  private static readonly fallbackModels = ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-3.7-flash']
  static isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY)
  }

  static async generate(prompt: string, history: Array<{ role: 'user' | 'model', text: string }> = [], imageBuffer?: Buffer): Promise<string> {
    if (!this.isConfigured()) throw new Error('GEMINI_API_KEY não configurada')

    const parts: GeminiPart[] = [{ text: prompt }]
    if (imageBuffer?.length) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } })
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
        signal: AbortSignal.timeout(15000)
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

  static async analyzeListing(title: string, description: string, imageBuffer?: Buffer): Promise<{ approved: boolean, category: string, condition: string, confidence: number, reasons: string[] }> {
    const text = await this.generate(
      `Analise este anúncio de reciclagem. Responda SOMENTE JSON válido no formato {"approved":true,"category":"...","condition":"novo|ótimo estado|usado|danificado","confidence":0.0,"reasons":[]}. Categorias permitidas: Vidro e Garrafas, Plásticos e Polímeros, Papel e Papelão, Metais, Eletrônicos e Baterias, Não Identificado. Título: ${title}. Descrição: ${description}`,
      [],
      imageBuffer
    )
    const json = JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''))
    return {
      approved: Boolean(json.approved),
      category: String(json.category || 'Não Identificado'),
      condition: String(json.condition || 'usado'),
      confidence: Math.max(0, Math.min(1, Number(json.confidence) || 0)),
      reasons: Array.isArray(json.reasons) ? json.reasons.map(String) : []
    }
  }
}
