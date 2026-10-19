/**************************************************************************************
 * Objetivo: DAO responsável pelo CRUD da tabela tbl_alertas no banco de dados MySQL
 * Local: model/DAO/alertas/alertas.js
 **************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um alerta e retorna o id gerado (ou false)
const insertAlerta = async function (alerta) {
    try {
        let sql = `INSERT INTO tbl_alertas (motivo, status, acao, id_ia, id_usuario)
                   VALUES (?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [alerta.motivo, alerta.status, alerta.acao, alerta.id_ia, alerta.id_usuario])

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

// Atualiza motivo, status e acao (não altera a IA nem o usuário do registro)
const updateAlerta = async function (alerta) {
    try {
        let sql = `UPDATE tbl_alertas SET motivo = ?, status = ?, acao = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [alerta.motivo, alerta.status, alerta.acao, alerta.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um registro pelo id
const selectByIdAlerta = async function (id) {
    try {
        let sql = `SELECT id, motivo, status, acao, id_ia, id_usuario
                   FROM tbl_alertas WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os registros (mais recente primeiro)
const selectAllAlertas = async function () {
    try {
        let sql = `SELECT id, motivo, status, acao, id_ia, id_usuario
                   FROM tbl_alertas ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um registro pelo id
const deleteAlerta = async function (id) {
    try {
        let sql = `DELETE FROM tbl_alertas WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertAlerta,
    updateAlerta,
    selectByIdAlerta,
    selectAllAlertas,
    deleteAlerta
}