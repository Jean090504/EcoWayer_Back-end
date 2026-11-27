const { test } = require('node:test')
const assert = require('node:assert/strict')
const { obterContextoPainel } = require('../services/contextoAssistente')
function consulta(resultado) {
    const q = {}
    for (const metodo of ['leftJoin', 'select', 'count', 'groupBy', 'orderBy', 'limit']) q[metodo] = () => q
    q.then = (ok, erro) => resultado.then(ok, erro)
    return q
}
test('contexto mantém fontes válidas e identifica falhas sem inventar zeros', async () => {
    const context = await obterContextoPainel({
        db: tabela => consulta(tabela === 'tbl_alertas' ? Promise.reject(new Error('offline')) : Promise.resolve([{ nome: 'Metal', anuncios: 5 }])),
        buscarDashboard: async () => ({ status_code: 500 })
    })
    assert.deepEqual(context.indisponiveis, ['indicadores', 'moderacao'])
    assert.deepEqual(context.categoriasMaisAnuncios, [{ nome: 'Metal', anuncios: 5 }])
    assert.equal(context.pontosUltimosDoisDias, undefined)
})
test('contexto preserva resultados vazios e restringe dados pessoais do dashboard', async () => {
    const context = await obterContextoPainel({
        db: () => consulta(Promise.resolve([])),
        buscarDashboard: async () => ({ status_code: 200, response: {
            metricas: { pontosGerados: { valor: 5 } }, dashboard: {
                ranking: [{ nome: 'Dado pessoal' }], evolucaoPontos: [{ pontos: 2 }, { pontos: 3 }]
            }
        } })
    })
    assert.deepEqual(context.indisponiveis, [])
    assert.deepEqual(context.moderacao, [])
    assert.equal(context.pontosUltimosDoisDias, 5)
    assert.equal(JSON.stringify(context).includes('Dado pessoal'), false)
})
