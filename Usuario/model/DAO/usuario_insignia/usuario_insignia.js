/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_usuario_insignia no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertUsuarioInsignia = async function (vinculo) {
    try {
        let sql = `insert into tbl_usuario_insignia (progresso, status, id_usuario, id_insignia)
                   values (?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            vinculo.progresso, vinculo.status, vinculo.id_usuario, vinculo.id_insignia
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

const updateUsuarioInsignia = async function (vinculo) {
    try {
        let sql = `update tbl_usuario_insignia
                      set progresso = ?, status = ?, id_usuario = ?, id_insignia = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            vinculo.progresso, vinculo.status, vinculo.id_usuario, vinculo.id_insignia, vinculo.id
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

const selectAllUsuarioInsignias = async function () {
    try {
        let sql = `select * from tbl_usuario_insignia order by id`
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

const selectUsuarioInsigniaById = async function (id) {
    try {
        let sql = `select * from tbl_usuario_insignia where id = ?`
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

// Verifica se o par (usuário, insígnia) já existe, ignorando o próprio registro na atualização
const selectParUsuarioInsignia = async function (idUsuario, idInsignia, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_usuario_insignia
                   where id_usuario = ? and id_insignia = ? and id <> ?`
        let result = await knexConex.raw(sql, [idUsuario, idInsignia, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectUsuarioExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_usuario where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectInsigniaExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_insignia where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteUsuarioInsignia = async function (id) {
    try {
        let sql = `delete from tbl_usuario_insignia where id = ?`
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
    insertUsuarioInsignia,
    updateUsuarioInsignia,
    selectAllUsuarioInsignias,
    selectUsuarioInsigniaById,
    selectParUsuarioInsignia,
    selectUsuarioExiste,
    selectInsigniaExiste,
    deleteUsuarioInsignia
}