/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_imagem_anuncio no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertImagemAnuncio = async function (vinculo) {
    try {
        let sql = `insert into tbl_imagem_anuncio (id_imagem, id_anuncio)
                   values (?, ?)`

        let result = await knexConex.raw(sql, [
            vinculo.id_imagem,
            vinculo.id_anuncio
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

const updateImagemAnuncio = async function (vinculo) {
    try {
        let sql = `update tbl_imagem_anuncio
                      set id_imagem = ?,
                          id_anuncio = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            vinculo.id_imagem,
            vinculo.id_anuncio,
            vinculo.id
        ])

        if (result)
            return true
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllImagensAnuncio = async function () {
    try {
        let sql = `select * from tbl_imagem_anuncio order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de vínculos
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectImagemAnuncioById = async function (id) {
    try {
        let sql = `select * from tbl_imagem_anuncio where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com o registro encontrado (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteImagemAnuncio = async function (id) {
    try {
        let sql = `delete from tbl_imagem_anuncio where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return true
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertImagemAnuncio,
    updateImagemAnuncio,
    selectAllImagensAnuncio,
    selectImagemAnuncioById,
    deleteImagemAnuncio
}