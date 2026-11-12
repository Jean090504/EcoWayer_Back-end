/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Material Aceito
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Retorna o ID gerado (number) ou false
const insertMaterialAceito = async function (material) {
    try {
        let sql = `INSERT INTO tbl_material_aceito (nome, icone) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [material.nome, material.icone])

        if (Array.isArray(result) && result[0].affectedRows > 0) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateMaterialAceito = async function (material) {
    try {
        let sql = `UPDATE tbl_material_aceito SET nome = ?, icone = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [material.nome, material.icone, material.id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdMaterialAceito = async function (id) {
    try {
        let sql = `SELECT id, nome, icone FROM tbl_material_aceito WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllMaterialAceito = async function () {
    try {
        let sql = `SELECT id, nome, icone FROM tbl_material_aceito ORDER BY id;`
        let result = await knexConex.raw(sql)

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// Retorna true | false | 'EM_USO' (material referenciado por outra tabela - FK)
const deleteMaterialAceito = async function (id) {
    try {
        let sql = `DELETE FROM tbl_material_aceito WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)

        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return 'EM_USO'
        }
        return false
    }
}

module.exports = {
    insertMaterialAceito,
    updateMaterialAceito,
    selectByIdMaterialAceito,
    selectAllMaterialAceito,
    deleteMaterialAceito
}