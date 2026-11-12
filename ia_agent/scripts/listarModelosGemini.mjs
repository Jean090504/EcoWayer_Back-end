import 'dotenv/config'

const chave = process.env.GEMINI_API_KEY
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models'

if (!chave) {
  console.error('Defina GEMINI_API_KEY no arquivo .env do ia_agent.')
  process.exitCode = 1
} else {
  try {
    const resposta = await fetch(`${endpoint}?pageSize=1000`, {
      headers: { 'x-goog-api-key': chave }
    })
    const dados = await resposta.json()
    if (!resposta.ok) throw new Error(dados?.error?.message || `Gemini HTTP ${resposta.status}`)

    const modelos = (dados.models || [])
      .filter((modelo) => modelo.supportedGenerationMethods?.includes('generateContent'))
      .map((modelo) => ({
        nome: modelo.name?.replace('models/', ''),
        descricao: modelo.description,
        entrada: modelo.inputTokenLimit,
        saida: modelo.outputTokenLimit,
        recomendado: /flash/i.test(modelo.name || '')
      }))

    console.table(modelos)
    console.log('\nObservação: a API lista capacidade e limites, mas não informa sozinha quais modelos são gratuitos. Verifique preços e limites no Google AI Studio/Google Cloud antes de escolher o modelo.')
  } catch (erro) {
    console.error(`Não foi possível listar os modelos Gemini: ${erro.message}`)
    process.exitCode = 1
  }
}
