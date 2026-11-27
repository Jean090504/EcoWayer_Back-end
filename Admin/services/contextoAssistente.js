// Apenas agregados administrativos: não encaminha dados pessoais ao agente.
async function obterContextoPainel({ db, buscarDashboard }) {
    const fontes = await Promise.allSettled([
        buscarDashboard('semanal', '7d').then(result => {
            if (result.status_code !== 200) throw new Error('Dashboard indisponível')
            const { metricas, dashboard: d } = result.response
            const dias = d.evolucaoPontos.slice(-2)
            return {
                periodo: d.periodo, dataInicio: d.dataInicio, dataFim: d.dataFim,
                metricas, usuariosTotal: d.usuariosTotal, usuariosAtivosTotal: d.usuariosAtivosTotal,
                usuariosCadastrados: d.usuariosCadastrados, usuariosComAcessoPeriodo: d.usuariosComAcessoPeriodo,
                anunciosAtivos: d.anunciosAtivos, denunciasNoPeriodo: d.denunciasNoMes,
                pontosUltimosDoisDias: dias.reduce((s, dia) => s + Number(dia.pontos), 0),
                detalhamentoUltimosDoisDias: dias
            }
        }),
        db('tbl_categoria as c').leftJoin('tbl_anuncio as a', 'a.id_categoria', 'c.id')
            .select('c.id', 'c.nome').count('a.id as anuncios').groupBy('c.id', 'c.nome')
            .orderBy('anuncios', 'desc').orderBy('c.id').limit(10),
        db('tbl_alertas').select('status', 'tipo_alvo').count('* as total').groupBy('status', 'tipo_alvo')
    ])
    const context = { consultadoEm: new Date().toISOString(), indisponiveis: [] }
    const nomes = ['indicadores', 'categoriasMaisAnuncios', 'moderacao']
    fontes.forEach((resultado, i) => {
        if (resultado.status === 'fulfilled') context[nomes[i]] = resultado.value
        else context.indisponiveis.push(nomes[i])
    })
    if (context.indicadores) {
        context.pontosUltimosDoisDias = context.indicadores.pontosUltimosDoisDias
    }
    context.escopo = 'Indicadores dos últimos 7 dias; categorias: top 10 de todos os anúncios cadastrados, incluindo inativos; moderação: alertas registrados por status e tipo de alvo, sem análise nova de conteúdos. Alertas não comprovam infrações. Ausência de alertas não comprova ausência de conteúdo inadequado. Fontes indisponíveis não significam zero.'
    return context
}
module.exports = { obterContextoPainel }
