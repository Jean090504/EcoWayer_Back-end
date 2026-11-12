/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_horario_ponto_coleta no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertHorarioPontoColeta = async function (horario) {
    try {
        let sql = `insert into tbl_horario_ponto_coleta (id_ponto_coleta, dia_semana, abre, fecha)
                   values (?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            horario.id_ponto_coleta,
            horario.dia_semana,
            horario.abre,
            horario.fecha
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

const updateHorarioPontoColeta = async function (horario) {
    try {
        let sql = `update tbl_horario_ponto_coleta
                      set id_ponto_coleta = ?,
                          dia_semana = ?,
                          abre = ?,
                          fecha = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            horario.id_ponto_coleta,
            horario.dia_semana,
            horario.abre,
            horario.fecha,
            horario.id
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

const selectAllHorariosPontoColeta = async function () {
    try {
        let sql = `select * from tbl_horario_ponto_coleta order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de horários
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectHorarioPontoColetaById = async function (id) {
    try {
        let sql = `select * from tbl_horario_ponto_coleta where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com o horário encontrado (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteHorarioPontoColeta = async function (id) {
    try {
        let sql = `delete from tbl_horario_ponto_coleta where id = ?`

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
    insertHorarioPontoColeta,
    updateHorarioPontoColeta,
    selectAllHorariosPontoColeta,
    selectHorarioPontoColetaById,
    deleteHorarioPontoColeta
}