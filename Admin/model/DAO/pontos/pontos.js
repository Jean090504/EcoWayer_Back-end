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

module.exports = {
    insertPontos,
    updatePontos,
    selectByIdPontos,
    selectAllPontos,
    deletePontos
}