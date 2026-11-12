/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Nivel Impacto
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertNivelImpacto = async function (nivelImpacto) {
    try {
        let sql = `INSERT INTO tbl_nivel_impacto (nome, numero, meta, unidade) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [nivelImpacto.nome, nivelImpacto.numero, nivelImpacto.meta, nivelImpacto.unidade])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateNivelImpacto = async function (nivelImpacto) {
    try {
        let sql = `UPDATE tbl_nivel_impacto SET nome = ?, numero = ?, meta = ?, unidade = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [nivelImpacto.nome, nivelImpacto.numero, nivelImpacto.meta, nivelImpacto.unidade, nivelImpacto.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdNivelImpacto = async function (id) {
    try {
        let sql = `SELECT id, nome, numero, meta, unidade FROM tbl_nivel_impacto WHERE id = ?;`
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

// Ordenado pelo número do nível (1, 2, 3...) para a lista já sair na ordem de progressão.
const selectAllNivelImpacto = async function () {
    try {
        let sql = `SELECT id, nome, numero, meta, unidade FROM tbl_nivel_impacto ORDER BY numero ASC;`
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

// Quantos usuários estão neste nível. Usado antes de excluir.
const selectNivelImpactoEmUso = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_usuario WHERE id_nivel_impacto = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const deleteNivelImpacto = async function (id) {
    try {
        let sql = `DELETE FROM tbl_nivel_impacto WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertNivelImpacto,
    updateNivelImpacto,
    selectByIdNivelImpacto,
    selectAllNivelImpacto,
    selectNivelImpactoEmUso,
    deleteNivelImpacto
}