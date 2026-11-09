/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Material Aceito
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo material aceito e devolve o insertId (ou false)
const insertMaterialAceito = async function (material) {
    try {
        let sql = `INSERT INTO tbl_material_aceito (nome, icone) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [material.nome, material.icone])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza nome e ícone de um material aceito (o controller já garantiu que o ID existe)
const updateMaterialAceito = async function (material) {
    try {
        let sql = `UPDATE tbl_material_aceito SET nome = ?, icone = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [material.nome, material.icone, material.id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os materiais aceitos
const selectAllMaterialAceito = async function () {
    try {
        let sql = `SELECT id, nome, icone FROM tbl_material_aceito ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um material aceito pelo ID
const selectByIdMaterialAceito = async function (id) {
    try {
        let sql = `SELECT id, nome, icone FROM tbl_material_aceito WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca pelo nome (a coluna nome é UNIQUE: usada para evitar duplicidade antes de gravar)
const selectByNomeMaterialAceito = async function (nome) {
    try {
        let sql = `SELECT id, nome, icone FROM tbl_material_aceito WHERE nome = ?;`
        let result = await knexConex.raw(sql, [nome])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um material aceito pelo ID
const deleteMaterialAceito = async function (id) {
    try {
        let sql = `DELETE FROM tbl_material_aceito WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Conta os pontos de coleta que aceitam o material (FK em tbl_ponto_coleta_material_aceito), para não estourar erro no DELETE
const countPontoColetaByIdMaterialAceito = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_ponto_coleta_material_aceito WHERE id_material_aceito = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertMaterialAceito,
    updateMaterialAceito,
    selectAllMaterialAceito,
    selectByIdMaterialAceito,
    selectByNomeMaterialAceito,
    deleteMaterialAceito,
    countPontoColetaByIdMaterialAceito
}