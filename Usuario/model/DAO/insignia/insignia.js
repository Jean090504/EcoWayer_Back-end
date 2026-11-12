/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_insignia no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertInsignia = async function (insignia) {
    try {
        let sql = `insert into tbl_insignia (nome, descricao, meta, unidade)
                   values (?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            insignia.nome, insignia.descricao, insignia.meta, insignia.unidade
        ])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateInsignia = async function (insignia) {
    try {
        let sql = `update tbl_insignia
                      set nome = ?, descricao = ?, meta = ?, unidade = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            insignia.nome, insignia.descricao, insignia.meta, insignia.unidade, insignia.id
        ])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllInsignias = async function () {
    try {
        let sql = `select * from tbl_insignia order by id`
        let result = await knexConex.raw(sql)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectInsigniaById = async function (id) {
    try {
        let sql = `select * from tbl_insignia where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos usuários já conquistaram ou estão progredindo nesta insígnia. Usado antes de excluir.
const countDependenciasInsignia = async function (id) {
    try {
        let sql = `select (select count(*) from tbl_usuario_insignia where id_insignia = ?) as total`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteInsignia = async function (id) {
    try {
        let sql = `delete from tbl_insignia where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertInsignia,
    updateInsignia,
    selectAllInsignias,
    selectInsigniaById,
    countDependenciasInsignia,
    deleteInsignia
}