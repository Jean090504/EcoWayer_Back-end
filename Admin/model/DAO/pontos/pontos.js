/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_pontos no banco de dados MySQL
 * Local: model/DAO/pontos/pontos.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// SELECT base com os JOINs das chaves estrangeiras (usado no listar e no buscar por id)
const sqlBase = `
    SELECT
        p.id, p.qntd_pontos, p.data_registro,

        u.id   AS usuario_id,
        u.nome AS usuario_nome,
        i.id   AS imagem_id,
        i.url  AS imagem_url,
        ti.id  AS tipo_imagem_id,
        ti.tipo AS tipo_imagem_tipo,

        c.id     AS categoria_id,
        c.nome   AS categoria_nome,
        c.pontos AS categoria_pontos,
        tc.id    AS tipo_categoria_id,
        tc.nome  AS tipo_categoria_nome
    FROM tbl_pontos p
        INNER JOIN tbl_usuario u         ON u.id  = p.id_usuario
        LEFT  JOIN tbl_imagem i          ON i.id  = u.id_imagem
        LEFT  JOIN tbl_tipo_imagem ti    ON ti.id = i.id_tipo_imagem
        INNER JOIN tbl_categoria c       ON c.id  = p.id_categoria
        INNER JOIN tbl_tipo_categoria tc ON tc.id = c.id_tipo_categoria
`

// Insere um registro de pontos e retorna o id gerado (ou false). data_registro é gerada pelo banco.
const insertPontos = async function (pontos) {
    try {
        let sql = `INSERT INTO tbl_pontos (qntd_pontos, data_registro, id_categoria, id_usuario)
                   VALUES (?, NOW(), ?, ?);`
        let result = await knexConex.raw(sql, [pontos.qntd_pontos, pontos.id_categoria, pontos.id_usuario])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza um registro de pontos (não altera data_registro nem o usuário)
const updatePontos = async function (pontos) {
    try {
        let sql = `UPDATE tbl_pontos SET qntd_pontos = ?, id_categoria = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [pontos.qntd_pontos, pontos.id_categoria, pontos.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id (já com as chaves estrangeiras expandidas)
const selectByIdPontos = async function (id) {
    try {
        let sql = `${sqlBase} WHERE p.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllPontos = async function () {
    try {
        let sql = `${sqlBase} ORDER BY p.id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deletePontos = async function (id) {
    try {
        let sql = `DELETE FROM tbl_pontos WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const formatarDataSql = (valor) => {
    const data = new Date(valor)
    return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}-${String(data.getUTCDate()).padStart(2, '0')}`
}

const deslocarDias = (valor, quantidade) => {
    const data = new Date(`${valor}T00:00:00Z`)
    data.setUTCDate(data.getUTCDate() + quantidade)
    return formatarDataSql(data)
}

const calcularJanela = (dataReferencia, periodo) => {
    const fim = formatarDataSql(dataReferencia)
    if (periodo === 'diario') return { inicio: fim, fim: deslocarDias(fim, 1) }
    if (periodo === 'mensal') {
        const data = new Date(`${fim}T00:00:00Z`)
        const inicio = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}-01`
        data.setUTCMonth(data.getUTCMonth() + 1, 1)
        const proximoMes = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}-01`
        return { inicio, fim: proximoMes }
    }
    return { inicio: deslocarDias(fim, -6), fim: deslocarDias(fim, 1) }
}

const selectDashboard = async function (period = 'semanal', grafico = '30d') {
    const [referencia] = await knexConex.raw(`
        SELECT COALESCE(
            GREATEST(
                (SELECT MAX(data_acesso) FROM tbl_acesso),
                (SELECT MAX(data_cadastro) FROM tbl_usuario),
                (SELECT MAX(data_publicacao) FROM tbl_anuncio),
                (SELECT MAX(criado_em) FROM tbl_alertas),
                (SELECT MAX(data_registro) FROM tbl_pontos)
            ), CURDATE()
        ) AS data_referencia
    `)
    const periodo = ['diario', 'semanal', 'mensal'].includes(period) ? period : 'semanal'
    const dataReferencia = referencia[0]?.data_referencia
    const janela = calcularJanela(dataReferencia, periodo)
    const janelaAnterior = periodo === 'mensal'
        ? (() => {
            const inicio = new Date(`${janela.inicio}T00:00:00Z`)
            inicio.setUTCMonth(inicio.getUTCMonth() - 1)
            const inicioAnterior = `${inicio.getUTCFullYear()}-${String(inicio.getUTCMonth() + 1).padStart(2, '0')}-01`
            const fimAnterior = janela.inicio
            return { inicio: inicioAnterior, fim: fimAnterior }
        })()
        : { inicio: deslocarDias(janela.inicio, periodo === 'diario' ? -1 : -7), fim: janela.inicio }

    const diasGrafico = { '7d': 7, '30d': 30, '90d': 90 }[grafico] || 30
    const graficoPeriodo = Object.prototype.hasOwnProperty.call({ '7d': 7, '30d': 30, '90d': 90 }, grafico) ? grafico : '30d'
    const dataInicioGrafico = deslocarDias(formatarDataSql(dataReferencia), -(diasGrafico - 1))
    const [pontosPorDia] = await knexConex.raw(`
        SELECT DATE(data_registro) AS dia, COALESCE(SUM(qntd_pontos), 0) AS pontos
          FROM tbl_pontos
         WHERE data_registro >= ? AND data_registro < ?
         GROUP BY DATE(data_registro)
         ORDER BY dia ASC
    `, [dataInicioGrafico, deslocarDias(formatarDataSql(dataReferencia), 1)])

    const pontosMap = new Map((pontosPorDia || []).map((item) => [formatarDataSql(item.dia), Number(item.pontos || 0)]))
    let acumulado = 0
    const evolucaoPontos = Array.from({ length: diasGrafico }, (_, index) => {
        const data = deslocarDias(dataInicioGrafico, index)
        const pontos = pontosMap.get(data) || 0
        acumulado += pontos
        return { data, pontos, acumulado }
    })

    const [totais] = await knexConex.raw(`
        SELECT
            (SELECT COUNT(*) FROM tbl_pontos WHERE data_registro >= ? AND data_registro < ?) AS itensValidados,
            COALESCE((SELECT SUM(qntd_pontos) FROM tbl_pontos WHERE data_registro >= ? AND data_registro < ?), 0) AS pontosGerados,
            (SELECT COUNT(*) FROM tbl_regra_pontuacao WHERE status = 1 OR status = 'ativo') AS regrasAtivas,
            (SELECT COUNT(DISTINCT a.id_usuario)
               FROM tbl_acesso a JOIN tbl_usuario u ON u.id = a.id_usuario
              WHERE a.data_acesso >= ? AND a.data_acesso < ? AND (u.id_status_usuario = 1 OR u.id_status_usuario = 'ativo')) AS usuariosAtivosHoje,
            (SELECT COUNT(*) FROM tbl_usuario WHERE data_cadastro >= ? AND data_cadastro < ?) AS usuariosCadastrados,
            (SELECT COUNT(*) FROM tbl_usuario) AS usuariosTotal,
            (SELECT COUNT(*) FROM tbl_anuncio a
              WHERE a.data_publicacao >= ? AND a.data_publicacao < ?
                AND (SELECT h.status FROM tbl_historico_anuncio h WHERE h.id_anuncio = a.id ORDER BY h.data_alteracao DESC, h.id DESC LIMIT 1) = 'ativo') AS anunciosAtivos,
            (SELECT COUNT(DISTINCT ad.id_denuncias) FROM tbl_alertas_denuncias ad
              JOIN tbl_alertas a ON a.id = ad.id_alertas
             WHERE a.criado_em >= ? AND a.criado_em < ?) AS denunciasNoMes,
            (SELECT COUNT(*) FROM tbl_voucher v
              WHERE v.data_resgate >= ? AND v.data_resgate < ? AND v.status <> 'cancelado'
                AND v.id_gift_card IS NOT NULL) AS giftCardsResgatados,
            (SELECT COUNT(DISTINCT CONCAT(v.nome_parceiro, '|', v.beneficio)) FROM tbl_voucher v
              WHERE v.data_resgate >= ? AND v.data_resgate < ? AND v.status <> 'cancelado') AS beneficiosResgatados,
            COALESCE((SELECT SUM(v.pontos_utilizados) FROM tbl_voucher v
              WHERE v.data_resgate >= ? AND v.data_resgate < ? AND v.status <> 'cancelado'), 0) AS pontosGastos
    `, [
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim,
        janela.inicio, janela.fim
    ])

    const [comparativos] = await knexConex.raw(`
        SELECT
          (SELECT COUNT(DISTINCT a.id_usuario) FROM tbl_acesso a
             WHERE a.data_acesso >= ? AND a.data_acesso < ?) AS ativosMesAnterior,
          (SELECT COUNT(*) FROM tbl_usuario
             WHERE data_cadastro >= ? AND data_cadastro < ?) AS cadastradosMesAnterior,
          (SELECT COUNT(*) FROM tbl_anuncio
             WHERE data_publicacao >= ? AND data_publicacao < ?) AS anunciosMesAnterior,
          (SELECT COUNT(DISTINCT ad.id_denuncias) FROM tbl_alertas_denuncias ad
             JOIN tbl_alertas a ON a.id = ad.id_alertas
            WHERE a.criado_em >= ? AND a.criado_em < ?) AS denunciasMesAnterior
    `, [
        janelaAnterior.inicio, janelaAnterior.fim,
        janelaAnterior.inicio, janelaAnterior.fim,
        janelaAnterior.inicio, janelaAnterior.fim,
        janelaAnterior.inicio, janelaAnterior.fim
    ])

    const [evolucao] = await knexConex.raw(`
        SELECT DATE_FORMAT(m.mes, '%Y-%m-01') AS mes,
               (SELECT COUNT(*) FROM tbl_usuario u
                 WHERE u.data_cadastro >= m.mes
                   AND u.data_cadastro < DATE_ADD(m.mes, INTERVAL 1 MONTH)) AS cadastrados,
               (SELECT COUNT(DISTINCT a.id_usuario) FROM tbl_acesso a
                 WHERE a.data_acesso >= m.mes
                   AND a.data_acesso < DATE_ADD(m.mes, INTERVAL 1 MONTH)) AS ativos
          FROM (
            SELECT DATE_FORMAT(DATE_SUB(DATE_FORMAT(?, '%Y-%m-01'), INTERVAL n MONTH), '%Y-%m-01') AS mes
              FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                    UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11) meses
          ) m ORDER BY m.mes
    `, [dataReferencia])

    const [ranking] = await knexConex.raw(`
        SELECT u.id, u.nome, COALESCE(i.url, '') AS fotoUrl, SUM(p.qntd_pontos) AS pontos
          FROM tbl_pontos p
          JOIN tbl_usuario u ON u.id = p.id_usuario
          LEFT JOIN tbl_imagem i ON i.id = u.id_imagem
         WHERE p.data_registro >= ? AND p.data_registro < ?
         GROUP BY u.id, u.nome, i.url
         ORDER BY pontos DESC, u.nome ASC
         LIMIT 10
    `, [janela.inicio, janela.fim])

    const percentual = (atual, anterior) => {
        const a = Number(atual || 0)
        const b = Number(anterior || 0)
        if (b === 0) return a === 0 ? '0%' : '+100%'
        const valor = Math.round(((a - b) / b) * 100)
        return `${valor >= 0 ? '+' : ''}${valor}%`
    }

    const [regras] = await knexConex.raw(`
        SELECT c.id, c.nome AS cat, c.pontos AS base, '#65BA69' AS cor,
               r.id AS regraId, COALESCE(r.status, 0) AS ativo,
               NULL AS exc, NULL AS bom, NULL AS reg
        FROM tbl_categoria c
        LEFT JOIN tbl_regra_pontuacao r ON r.id_categoria = c.id
        ORDER BY c.id DESC
    `)
    return {
        itensValidados: Number(totais[0]?.itensValidados || 0),
        pontosGerados: Number(totais[0]?.pontosGerados || 0),
        regrasAtivas: Number(totais[0]?.regrasAtivas || 0),
        regrasPontuacao: regras || [],
        dashboard: {
            dataReferencia,
            periodo,
            dataInicio: janela.inicio,
            dataFim: deslocarDias(janela.fim, -1),
            graficoPeriodo,
            evolucaoPontos,
            usuariosAtivosHoje: Number(totais[0]?.usuariosAtivosHoje || 0),
            usuariosCadastrados: Number(totais[0]?.usuariosCadastrados || 0),
            usuariosTotal: Number(totais[0]?.usuariosTotal || 0),
            anunciosAtivos: Number(totais[0]?.anunciosAtivos || 0),
            denunciasNoMes: Number(totais[0]?.denunciasNoMes || 0),
            giftCardsResgatados: Number(totais[0]?.giftCardsResgatados || 0),
            beneficiosResgatados: Number(totais[0]?.beneficiosResgatados || 0),
            pontosGastos: Number(totais[0]?.pontosGastos || 0),
            variacoes: {
                usuariosAtivosHoje: percentual(totais[0]?.usuariosAtivosHoje, comparativos[0]?.ativosMesAnterior),
                usuariosCadastrados: percentual(totais[0]?.usuariosCadastrados, comparativos[0]?.cadastradosMesAnterior),
                anunciosAtivos: percentual(totais[0]?.anunciosAtivos, comparativos[0]?.anunciosMesAnterior),
                denunciasNoMes: percentual(totais[0]?.denunciasNoMes, comparativos[0]?.denunciasMesAnterior)
            },
            evolucao: (evolucao || []).map(item => ({
                mes: item.mes,
                cadastrados: Number(item.cadastrados || 0),
                ativos: Number(item.ativos || 0)
            })),
            ranking: (ranking || []).map(item => ({
                id: item.id,
                nome: item.nome,
                pontos: Number(item.pontos || 0),
                fotoUrl: item.fotoUrl || null,
                variacao: ''
            }))
        }
    }
}

module.exports = {
    insertPontos,
    updatePontos,
    selectByIdPontos,
    selectAllPontos,
    deletePontos,
    selectDashboard
}
