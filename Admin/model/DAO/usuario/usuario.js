/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Usuario
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// data_cadastro não entra no INSERT: o banco preenche com CURRENT_TIMESTAMP
const insertUsuario = async function (usuario) {
    try {
        let sql = `INSERT INTO tbl_usuario
                       (nome, cpf, data_nascimento, id_imagem, id_genero, id_status_usuario, id_nivel_impacto)
                   VALUES (?, ?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            usuario.nome,
            usuario.cpf,
            usuario.data_nascimento,
            usuario.id_imagem,
            usuario.id_genero,
            usuario.id_status_usuario,
            usuario.id_nivel_impacto
        ])

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

// data_cadastro também não entra no UPDATE: a data do cadastro não deve mudar
const updateUsuario = async function (usuario) {
    try {
        let sql = `UPDATE tbl_usuario SET
                       nome = ?, cpf = ?, data_nascimento = ?, id_imagem = ?,
                       id_genero = ?, id_status_usuario = ?, id_nivel_impacto = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            usuario.nome,
            usuario.cpf,
            usuario.data_nascimento,
            usuario.id_imagem,
            usuario.id_genero,
            usuario.id_status_usuario,
            usuario.id_nivel_impacto,
            usuario.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
// DATE_FORMAT evita que a data volte como "2000-05-10T03:00:00.000Z" (problema de fuso).
const selectByIdUsuario = async function (id) {
    try {
        let sql = `SELECT id, nome, cpf,
                          DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                          DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro,
                          id_imagem, id_genero, id_status_usuario, id_nivel_impacto
                   FROM tbl_usuario WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllUsuario = async function () {
    try {
        let sql = `SELECT id, nome, cpf,
                          DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                          DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro,
                          id_imagem, id_genero, id_status_usuario, id_nivel_impacto
                   FROM tbl_usuario ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Apaga primeiro os filhos (tbl_acesso, tbl_anuncio) e depois o usuário, em transação.
// Se existir outra tabela com FK para tbl_usuario, inclua o DELETE dela antes do último.
const deleteUsuario = async function (id) {
    try {
        await knexConex.transaction(async function (trx) {
            await trx.raw(`DELETE FROM tbl_acesso WHERE id_usuario = ?;`, [id])
            await trx.raw(`DELETE FROM tbl_anuncio WHERE id_usuario = ?;`, [id])
            await trx.raw(`DELETE FROM tbl_usuario WHERE id = ?;`, [id])
        })

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertUsuario,
    updateUsuario,
    selectByIdUsuario,
    selectAllUsuario,
    deleteUsuario
}