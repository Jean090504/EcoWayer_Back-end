/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_anuncio no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAnuncio = async function (anuncio) {
    try {
        let sql = `insert into tbl_anuncio (nome, descricao, data_publicacao, id_usuario, id_categoria,
                                            id_modalidade, id_condicao_item, preco, peso_kg, status)
                   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.data_publicacao,
            anuncio.id_usuario,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item,
            anuncio.preco,
            anuncio.peso_kg,
            anuncio.status
        ])

        if (result)
            return result[0].insertId // insertId do registro criado
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateAnuncio = async function (anuncio, idUsuario) {
    try {
        let sql = `update tbl_anuncio
                      set nome = ?,
                          descricao = ?,
                          data_publicacao = ?,
                          id_usuario = ?,
                          id_categoria = ?,
                          id_modalidade = ?,
                          id_condicao_item = ?,
                          preco = ?,
                          peso_kg = ?,
                          status = ?
                    where id = ? and id_usuario = ? and status <> 'excluido'`

        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.data_publicacao,
            anuncio.id_usuario,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item,
            anuncio.preco,
            anuncio.peso_kg,
            anuncio.status,
            anuncio.id,
            idUsuario
        ])

        return result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllAnuncios = async function (idUsuario) {
    try {
        let sql = `SELECT a.*,
    (SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = a.id ORDER BY ia.ordem IS NULL, ia.ordem, ia.id LIMIT 1) AS imagem,
    (SELECT c.nome FROM tbl_categoria c WHERE c.id = a.id_categoria) AS categoria,
    (SELECT m.nome FROM tbl_modalidade m WHERE m.id = a.id_modalidade) AS modalidade_nome,
    (SELECT ci.nome FROM tbl_condicao_item ci WHERE ci.id = a.id_condicao_item) AS condicao_nome,
    (SELECT u.nome FROM tbl_usuario u WHERE u.id = a.id_usuario) AS vendedor_nome,
    COALESCE(a.cidade, (SELECT e.cidade FROM tbl_endereco_usuario eu JOIN tbl_endereco e ON e.id = eu.id_endereco WHERE eu.id_usuario = a.id_usuario ORDER BY eu.id DESC LIMIT 1)) AS cidade_exibicao,
    COALESCE(a.uf, (SELECT e.sigla FROM tbl_endereco_usuario eu JOIN tbl_endereco e ON e.id = eu.id_endereco WHERE eu.id_usuario = a.id_usuario ORDER BY eu.id DESC LIMIT 1)) AS uf_exibicao
    FROM tbl_anuncio a WHERE ${idUsuario ? "(a.status = 'ativo' OR (a.id_usuario = ? AND a.status <> 'excluido'))" : "a.status = 'ativo'"} ORDER BY a.id`

        let result = await knexConex.raw(sql, idUsuario ? [idUsuario] : [])

        if (result)
            return result[0] // array de anúncios
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAnuncioById = async function (id, idUsuario) {
    try {
        let sql = `SELECT a.*,
    (SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = a.id ORDER BY ia.ordem IS NULL, ia.ordem, ia.id LIMIT 1) AS imagem,
    (SELECT c.nome FROM tbl_categoria c WHERE c.id = a.id_categoria) AS categoria,
    (SELECT m.nome FROM tbl_modalidade m WHERE m.id = a.id_modalidade) AS modalidade_nome,
    (SELECT ci.nome FROM tbl_condicao_item ci WHERE ci.id = a.id_condicao_item) AS condicao_nome,
    COALESCE(a.cidade, (SELECT e.cidade FROM tbl_endereco_usuario eu JOIN tbl_endereco e ON e.id = eu.id_endereco WHERE eu.id_usuario = a.id_usuario ORDER BY eu.id DESC LIMIT 1)) AS cidade_exibicao,
    COALESCE(a.uf, (SELECT e.sigla FROM tbl_endereco_usuario eu JOIN tbl_endereco e ON e.id = eu.id_endereco WHERE eu.id_usuario = a.id_usuario ORDER BY eu.id DESC LIMIT 1)) AS uf_exibicao
    FROM tbl_anuncio a WHERE a.id = ? AND (a.status = 'ativo' OR (a.id_usuario = ? AND a.status <> 'excluido'))`

        let result = await knexConex.raw(sql, [id, idUsuario || 0])

        if (!result) return false
        if (result[0].length) {
            const [imagens] = await knexConex.raw(
                'SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = ? ORDER BY ia.ordem IS NULL, ia.ordem, ia.id', [id]
            )
            result[0][0].imagens = imagens.map(imagem => imagem.url)
            // Somente dados públicos do proprietário do anúncio; não usa a rota privada de perfil.
            const [vendedores] = await knexConex.raw(`
                SELECT u.id, u.nome, i.url AS foto,
                    DATE_FORMAT(u.data_cadastro, '%Y-%m-%d') AS membroDesde,
                    (SELECT COUNT(*) FROM tbl_anuncio publicados
                     WHERE publicados.id_usuario = u.id AND publicados.status = 'ativo') AS anunciosAtivos
                FROM tbl_usuario u
                LEFT JOIN tbl_imagem i ON i.id = u.id_imagem
                WHERE u.id = ? LIMIT 1`, [result[0][0].id_usuario])
            result[0][0].vendedor = vendedores[0] || null

        }
        return result[0]
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteAnuncio = async function (id, idUsuario) {
    try {
        const [resultado] = await knexConex.raw(
            `UPDATE tbl_anuncio SET status = 'excluido'
             WHERE id = ? AND id_usuario = ? AND status <> 'excluido'`,
            [id, idUsuario]
        )
        return resultado.affectedRows
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAnuncio,
    updateAnuncio,
    selectAllAnuncios,
    selectAnuncioById,
    deleteAnuncio
}
