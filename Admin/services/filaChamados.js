const knex = require('knex')(require('../model/database_config_knex/knexFile.js').development)

// A fila mostra apenas os dados necessários para a triagem. Os detalhes completos
// são carregados quando o administrador abre um chamado.
async function listarFila() {
    const [linhas] = await knex.raw(`
        SELECT a.id, a.motivo, a.status, a.acao, a.tipo_alvo, a.id_alvo, a.criado_em,
               a.id_usuario, u.nome AS usuario_nome,
               d.id AS denuncia_id, d.descricao AS denuncia_descricao,
               td.tipo AS denuncia_tipo,
               m.id AS mensagem_id, m.texto AS mensagem_texto,
               an.id AS anuncio_id, an.nome AS anuncio_nome
        FROM tbl_alertas a
        LEFT JOIN tbl_usuario u ON u.id = a.id_usuario
        LEFT JOIN tbl_alertas_denuncias ad ON ad.id_alertas = a.id
        LEFT JOIN tbl_denuncias d ON d.id = ad.id_denuncias
        LEFT JOIN tbl_tipo_denuncias td ON td.id = d.id_tipo_denuncias
        LEFT JOIN tbl_denuncias_mensagens dm ON dm.id_denuncias = d.id
        LEFT JOIN tbl_mensagens m ON m.id = dm.id_mensagens
        LEFT JOIN tbl_alertas_anuncio aa ON aa.id_alerta = a.id
        LEFT JOIN tbl_anuncio an ON an.id = aa.id_anuncio
        WHERE UPPER(a.status) = 'PENDENTE'
        ORDER BY a.id DESC
    `)

    const porId = new Map()
    for (const linha of linhas) {
        let alerta = porId.get(linha.id)
        if (!alerta) {
            alerta = {
                id: linha.id, motivo: linha.motivo, status: linha.status,
                acao: linha.acao, tipo_alvo: linha.tipo_alvo,
                id_alvo: linha.id_alvo, criado_em: linha.criado_em,
                usuario: linha.id_usuario ? { id: linha.id_usuario, nome: linha.usuario_nome } : null,
                denuncia: [], anuncio: [], mensagem: []
            }
            porId.set(linha.id, alerta)
        }
        if (linha.denuncia_id && !alerta.denuncia.some(item => item.id === linha.denuncia_id)) {
            alerta.denuncia.push({
                id: linha.denuncia_id,
                descricao: linha.denuncia_descricao,
                tipo_denuncia: { tipo: linha.denuncia_tipo },
                mensagem: []
            })
        }
        if (linha.mensagem_id) {
            const denuncia = alerta.denuncia.find(item => item.id === linha.denuncia_id)
            if (denuncia && !denuncia.mensagem.some(item => item.id === linha.mensagem_id)) {
                denuncia.mensagem.push({ id: linha.mensagem_id, texto: linha.mensagem_texto })
            }
        }
        if (linha.anuncio_id && !alerta.anuncio.some(item => item.id === linha.anuncio_id)) {
            alerta.anuncio.push({ id: linha.anuncio_id, nome: linha.anuncio_nome })
        }
    }
    return [...porId.values()]
}

module.exports = { listarFila }
