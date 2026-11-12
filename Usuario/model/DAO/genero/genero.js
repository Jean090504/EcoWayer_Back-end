/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Gênero
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere um novo gênero e devolve o insertId (ou false)
const insertGenero = async function (genero) {
    try {
        let sql = `INSERT INTO tbl_genero (nome, sigla) VALUES (?, ?);`
        let result = await knexConex.raw(sql, [genero.nome, genero.sigla])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza nome e sigla de um gênero (o controller já garantiu que o ID existe)
const updateGenero = async function (genero) {
    try {
        let sql = `UPDATE tbl_genero SET nome = ?, sigla = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [genero.nome, genero.sigla, genero.id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todos os gêneros
const selectAllGenero = async function () {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca um gênero pelo ID
const selectByIdGenero = async function (id) {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui um gênero pelo ID
const deleteGenero = async function (id) {
    try {
        let sql = `DELETE FROM tbl_genero WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca pelo nome (a coluna nome é UNIQUE: usada para evitar duplicidade antes de gravar)
const selectByNomeGenero = async function (nome) {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero WHERE nome = ?;`
        let result = await knexConex.raw(sql, [nome])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca pela sigla (a coluna sigla é UNIQUE: usada para evitar duplicidade antes de gravar)
const selectBySiglaGenero = async function (sigla) {
    try {
        let sql = `SELECT id, nome, sigla FROM tbl_genero WHERE sigla = ?;`
        let result = await knexConex.raw(sql, [sigla])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Conta os usuários que usam o gênero (usada antes do DELETE por causa da FK em tbl_usuario)
const countUsuarioByIdGenero = async function (id) {
    try {
        let sql = `SELECT COUNT(*) AS total FROM tbl_usuario WHERE id_genero = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertGenero,
    updateGenero,
    selectAllGenero,
    selectByIdGenero,
    deleteGenero,
    selectByNomeGenero,
    selectBySiglaGenero,
    countUsuarioByIdGenero
}