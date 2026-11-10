/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Imagem
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagem = async function (imagem) {
    try {
        let sql = `INSERT INTO tbl_imagem (url, id_tipo_imagem) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [imagem.url, imagem.id_tipo_imagem])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateImagem = async function (imagem) {
    try {
        let sql = `UPDATE tbl_imagem SET url = ?, id_tipo_imagem = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [imagem.url, imagem.id_tipo_imagem, imagem.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Traz também o nome do tipo (tbl_tipo_imagem.tipo) para o front não precisar de outra consulta.
const selectByIdImagem = async function (id) {
    try {
        let sql = `SELECT i.id, i.url, i.id_tipo_imagem, t.tipo
                   FROM tbl_imagem i
                   INNER JOIN tbl_tipo_imagem t ON t.id = i.id_tipo_imagem
                   WHERE i.id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const selectAllImagem = async function () {
    try {
        let sql = `SELECT i.id, i.url, i.id_tipo_imagem, t.tipo
                   FROM tbl_imagem i
                   INNER JOIN tbl_tipo_imagem t ON t.id = i.id_tipo_imagem;`
        let result = await knexConex.raw(sql)

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Quantos vínculos a imagem tem (usuário, anúncio, denúncia e entrega). Usado antes de excluir.
const selectImagemEmUso = async function (id) {
    try {
        let sql = `SELECT
                       (SELECT COUNT(*) FROM tbl_usuario WHERE id_imagem = ?) +
                       (SELECT COUNT(*) FROM tbl_imagem_anuncio WHERE id_imagem = ?) +
                       (SELECT COUNT(*) FROM tbl_imagem_denuncias WHERE id_imagem = ?) +
                       (SELECT COUNT(*) FROM tbl_imagem_entrega WHERE id_imagem = ?) AS total;`
        let result = await knexConex.raw(sql, [id, id, id, id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const deleteImagem = async function (id) {
    try {
        let sql = `DELETE FROM tbl_imagem WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertImagem,
    updateImagem,
    selectByIdImagem,
    selectAllImagem,
    selectImagemEmUso,
    deleteImagem
}