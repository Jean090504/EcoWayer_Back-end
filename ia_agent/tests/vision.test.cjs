const { test } = require('node:test')
const assert = require('node:assert/strict')
const { AiInferenceModel } = require('../dist/models/AiInferenceModel.js')
const { GeminiService } = require('../dist/services/geminiService.js')

test('classificação visual real aprova imagem compatível e rejeita falha do provedor', async () => {
  const configured = GeminiService.isConfigured
  const analyze = GeminiService.analyzeListing
  const model = new AiInferenceModel()
  const image = Buffer.from('imagem de teste')
  try {
    GeminiService.isConfigured = () => true
    GeminiService.analyzeListing = async () => ({
      approved: true, category: 'Bicicleta', condition: 'usado', confidence: 0.93, reasons: []
    })
    const approved = await model.executeInference('teste', 'Bicicleta urbana', image)
    assert.equal(approved.verifiedByAi, true)
    assert.equal(approved.humanReviewRequired, false)
    assert.equal(approved.classification.category, 'Bicicleta')

    GeminiService.analyzeListing = async () => { throw new Error('Provedor indisponível') }
    const failed = await model.executeInference('teste', 'Bicicleta urbana', image)
    assert.equal(failed.verifiedByAi, false)
    assert.equal(failed.humanReviewRequired, true)
    assert.equal(failed.classification, undefined)
  } finally {
    GeminiService.isConfigured = configured
    GeminiService.analyzeListing = analyze
  }
})
