const knex = require('knex')
const knexConfig = require('../../model/database_config_knex/knexFile.js')

const db = knex(knexConfig.development)

async function buscarCarteira(request, response) {
    const idUsuario = Number(request.usuario?.id)

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return response.status(401).json({
            status: false,
            status_code: 401,
            message: 'Usuário não autenticado.'
        })
    }

    try {
        const [resumoRows, niveis, missoes, vouchers, extrato] = await Promise.all([
            db.raw(`
                SELECT COALESCE(SUM(qntd_pontos), 0) AS pontos
                FROM tbl_pontos
                WHERE id_usuario = ?
            `, [idUsuario]),
            db.raw(`
                SELECT n.id, n.nome, n.numero, n.meta, n.unidade
                FROM tbl_usuario u
                INNER JOIN tbl_nivel_impacto n ON n.id = u.id_nivel_impacto
                WHERE u.id = ?
                UNION ALL
                SELECT id, nome, numero, meta, unidade
                FROM tbl_nivel_impacto
                WHERE numero > COALESCE((SELECT n2.numero FROM tbl_usuario u2
                    INNER JOIN tbl_nivel_impacto n2 ON n2.id = u2.id_nivel_impacto
                    WHERE u2.id = ?), 0)
                ORDER BY numero ASC
            `, [idUsuario, idUsuario]),
            db.raw(`
                SELECT um.id, um.id_missao, m.titulo, m.descricao, m.meta,
                       m.periodo_dias, m.pontos_bonus, um.progresso,
                       um.status, um.data_inicio, um.data_fim
                FROM tbl_usuario_missao um
                INNER JOIN tbl_missao m ON m.id = um.id_missao
                WHERE um.id_usuario = ? AND m.ativo = 1
                ORDER BY um.status = 'concluida', um.id
            `, [idUsuario]),
            db.raw(`
                SELECT id, slug_api, nome, valor_reais, pontos_resgate,
                       imagem_url, categoria, status
                FROM tbl_gift_card
                WHERE status = 'ativo'
                ORDER BY pontos_resgate ASC, nome ASC, id ASC
            `),
            db.raw(`
                SELECT p.id, p.qntd_pontos, p.data_registro, p.id_categoria,
                       p.id_entrega, c.nome AS categoria_nome
                FROM tbl_pontos p
                LEFT JOIN tbl_categoria c ON c.id = p.id_categoria
                WHERE p.id_usuario = ?
                ORDER BY p.data_registro DESC, p.id DESC
                LIMIT 50
            `, [idUsuario])
        ])

        const totalPontos = Number(resumoRows[0][0]?.pontos || 0)
        const niveisOrdenados = niveis[0].sort((a, b) => Number(a.numero) - Number(b.numero))
        const nivelAtual = niveisOrdenados[0] || null
        const proximoNivel = niveisOrdenados[1] || null
        const metaProximo = Number(proximoNivel?.meta || 0)
        const progresso = metaProximo > 0 ? Math.min(totalPontos / metaProximo, 1) : 0

        return response.json({
            status: true,
            status_code: 200,
            response: {
                resumo: {
                    pontos: totalPontos,
                    nivel_atual: nivelAtual,
                    proximo_nivel: proximoNivel,
                    progresso,
                    pontos_para_proximo_nivel: Math.max(metaProximo - totalPontos, 0)
                },
                missoes: missoes[0],
                vouchers: vouchers[0],
                extrato: extrato[0]
            }
        })
    } catch (erro) {
        console.error('[CARTEIRA] Erro ao buscar carteira:', erro.message)
        return response.status(500).json({
            status: false,
            status_code: 500,
            message: 'Não foi possível carregar os dados da carteira.'
        })
    }
}

module.exports = { buscarCarteira }
