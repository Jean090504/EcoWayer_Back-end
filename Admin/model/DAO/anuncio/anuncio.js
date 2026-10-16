/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_anuncio no banco de dados MySQL
 * Local: model/DAO/anuncio/anuncio.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// SELECT base com os JOINs das chaves estrangeiras (usado no listar e no buscar por id)
const sqlBase = `
    SELECT
        a.id, a.nome, a.descricao, a.data_publicacao,

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
        tc.nome  AS tipo_categoria_nome,

        m.id    AS modalidade_id,
        m.nome  AS modalidade_nome,
        tm.id   AS tipo_modalidade_id,
        tm.tipo AS tipo_modalidade_tipo,

        ci.id   AS condicao_item_id,
        ci.nome AS condicao_item_nome
    FROM tbl_anuncio a
        INNER JOIN tbl_usuario u         ON u.id  = a.id_usuario
        LEFT  JOIN tbl_imagem i          ON i.id  = u.id_imagem
        LEFT  JOIN tbl_tipo_imagem ti    ON ti.id = i.id_tipo_imagem
        INNER JOIN tbl_categoria c       ON c.id  = a.id_categoria
        INNER JOIN tbl_tipo_categoria tc ON tc.id = c.id_tipo_categoria
        INNER JOIN tbl_modalidade m      ON m.id  = a.id_modalidade
        INNER JOIN tbl_tipo_modalidade tm ON tm.id = m.id_tipo_modalidade
        INNER JOIN tbl_condicao_item ci  ON ci.id = a.id_condicao_item
`

// Insere um novo anúncio e retorna o id gerado (ou false). A data de publicação é gerada pelo banco.
const insertAnuncio = async function (anuncio) {
    try {
        let sql = `INSERT INTO tbl_anuncio
                    (nome, descricao, data_publicacao, id_usuario, id_categoria, id_modalidade, id_condicao_item)
                   VALUES (?, ?, NOW(), ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.id_usuario,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item
        ])

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

// Atualiza um anúncio existente (não altera data_publicacao nem o dono do anúncio)
const updateAnuncio = async function (anuncio) {
    try {
        let sql = `UPDATE tbl_anuncio
                   SET nome = ?, descricao = ?, id_categoria = ?, id_modalidade = ?, id_condicao_item = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item,
            anuncio.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um anúncio pelo id (já com as chaves estrangeiras expandidas)
const selectByIdAnuncio = async function (id) {
    try {
        let sql = `${sqlBase} WHERE a.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os anúncios (mais recente primeiro)
const selectAllAnuncio = async function () {
    try {
        let sql = `${sqlBase} ORDER BY a.id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um anúncio pelo id
const deleteAnuncio = async function (id) {
    try {
        let sql = `DELETE FROM tbl_anuncio WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAnuncio,
    updateAnuncio,
    selectByIdAnuncio,
    selectAllAnuncio,
    deleteAnuncio
}