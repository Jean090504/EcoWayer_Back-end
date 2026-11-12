/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Ponto de Coleta
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo ponto de coleta e devolve o insertId (ou false)
const insertPontoColeta = async function (ponto) {
    try {
        let sql = `INSERT INTO tbl_ponto_coleta (nome, descricao, status, latitude, longitude, id_categoria)
                   VALUES (?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            ponto.nome,
            ponto.descricao,
            ponto.status,
            ponto.latitude,
            ponto.longitude,
            ponto.id_categoria
        ])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza um ponto de coleta (o controller já garantiu que o ID existe)
const updatePontoColeta = async function (ponto) {
    try {
        let sql = `UPDATE tbl_ponto_coleta
                   SET nome = ?, descricao = ?, status = ?, latitude = ?, longitude = ?, id_categoria = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            ponto.nome,
            ponto.descricao,
            ponto.status,
            ponto.latitude,
            ponto.longitude,
            ponto.id_categoria,
            ponto.id
        ])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os pontos de coleta (latitude e longitude vêm como texto do mysql2: o controller converte)
const selectAllPontoColeta = async function () {
    try {
        let sql = `SELECT id, nome, descricao, status, latitude, longitude, id_categoria
                   FROM tbl_ponto_coleta
                   ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um ponto de coleta pelo ID
const selectByIdPontoColeta = async function (id) {
    try {
        let sql = `SELECT id, nome, descricao, status, latitude, longitude, id_categoria
                   FROM tbl_ponto_coleta
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um ponto de coleta pelo ID (os vínculos com endereço e material aceito são apagados antes, pelo controller)
const deletePontoColeta = async function (id) {
    try {
        let sql = `DELETE FROM tbl_ponto_coleta WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Conta os horários de funcionamento do ponto (FK em tbl_horario_ponto_coleta), para não estourar erro no DELETE
const countHorarioByIdPontoColeta = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_horario_ponto_coleta WHERE id_ponto_coleta = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertPontoColeta,
    updatePontoColeta,
    selectAllPontoColeta,
    selectByIdPontoColeta,
    deletePontoColeta,
    countHorarioByIdPontoColeta
}