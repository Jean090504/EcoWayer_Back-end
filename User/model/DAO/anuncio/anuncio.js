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

const updateAnuncio = async function (anuncio) {
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
                    where id = ?`

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
            anuncio.id
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

const selectAllAnuncios = async function () {
    try {
        let sql = `select * from tbl_anuncio order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de anúncios
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAnuncioById = async function (id) {
    try {
        let sql = `select * from tbl_anuncio where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com o anúncio encontrado (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteAnuncio = async function (id) {
    try {
        let sql = `delete from tbl_anuncio where id = ?`

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
    insertAnuncio,
    updateAnuncio,
    selectAllAnuncios,
    selectAnuncioById,
    deleteAnuncio
}