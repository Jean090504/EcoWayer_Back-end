/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Endereço
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEndereco = async function (endereco) {
    try {
        let sql = `INSERT INTO tbl_endereco (cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo, latitude, longitude)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            endereco.cep, endereco.rua, endereco.numero, endereco.complemento,
            endereco.bairro, endereco.cidade, endereco.estado, endereco.sigla,
            endereco.id_externo, endereco.latitude, endereco.longitude
        ])

        // devolve o id gerado (result[0] é o ResultSetHeader do MySQL)
        return result ? result[0].insertId : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateEndereco = async function (endereco) {
    try {
        let sql = `UPDATE tbl_endereco
                   SET cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?,
                       estado = ?, sigla = ?, id_externo = ?, latitude = ?, longitude = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            endereco.cep, endereco.rua, endereco.numero, endereco.complemento,
            endereco.bairro, endereco.cidade, endereco.estado, endereco.sigla,
            endereco.id_externo, endereco.latitude, endereco.longitude, endereco.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdEndereco = async function (id) {
    try {
        let sql = `SELECT id, cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo, latitude, longitude
                   FROM tbl_endereco WHERE id = ?;`
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

const selectAllEndereco = async function () {
    try {
        let sql = `SELECT id, cep, rua, numero, complemento, bairro, cidade, estado, sigla, id_externo, latitude, longitude
                   FROM tbl_endereco;`
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

// Quantos vínculos o endereço tem (usuário + ponto de coleta). Usado antes de excluir.
const selectEnderecoEmUso = async function (id) {
    try {
        let sql = `SELECT
                       (SELECT COUNT(*) FROM tbl_endereco_usuario WHERE id_endereco = ?) +
                       (SELECT COUNT(*) FROM tbl_endereco_ponto_coleta WHERE id_endereco = ?) AS total;`
        let result = await knexConex.raw(sql, [id, id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const deleteEndereco = async function (id) {
    try {
        let sql = `DELETE FROM tbl_endereco WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        return false
    }
}

module.exports = {
    insertEndereco,
    updateEndereco,
    selectByIdEndereco,
    selectAllEndereco,
    selectEnderecoEmUso,
    deleteEndereco
}