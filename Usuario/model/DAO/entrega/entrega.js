/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_entrega no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEntrega = async function (entrega) {
    try {
        let sql = `insert into tbl_entrega (peso_estimado, status, data_entrega, id_anuncio, id_usuario)
                   values (?, ?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            entrega.peso_estimado,
            entrega.status,
            entrega.data_entrega,
            entrega.id_anuncio,
            entrega.id_usuario
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

const updateEntrega = async function (entrega) {
    try {
        let sql = `update tbl_entrega
                      set peso_estimado = ?,
                          status = ?,
                          data_entrega = ?,
                          id_anuncio = ?,
                          id_usuario = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            entrega.peso_estimado,
            entrega.status,
            entrega.data_entrega,
            entrega.id_anuncio,
            entrega.id_usuario,
            entrega.id
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

const selectAllEntregas = async function () {
    try {
        let sql = `select * from tbl_entrega order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de entregas
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectEntregaById = async function (id) {
    try {
        let sql = `select * from tbl_entrega where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com a entrega encontrada (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteEntrega = async function (id) {
    try {
        let sql = `delete from tbl_entrega where id = ?`

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
    insertEntrega,
    updateEntrega,
    selectAllEntregas,
    selectEntregaById,
    deleteEntrega
}
