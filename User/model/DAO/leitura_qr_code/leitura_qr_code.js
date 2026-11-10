/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_leitura_qr_code no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertLeituraQrCode = async function (leitura) {
    try {
        let sql = `insert into tbl_leitura_qr_code (data_leitura, status, id_qr_code, id_usuario)
                   values (?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            leitura.data_leitura,
            leitura.status,
            leitura.id_qr_code,
            leitura.id_usuario
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

const updateLeituraQrCode = async function (leitura) {
    try {
        let sql = `update tbl_leitura_qr_code
                      set data_leitura = ?,
                          status = ?,
                          id_qr_code = ?,
                          id_usuario = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            leitura.data_leitura,
            leitura.status,
            leitura.id_qr_code,
            leitura.id_usuario,
            leitura.id
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

const selectAllLeiturasQrCode = async function () {
    try {
        let sql = `select * from tbl_leitura_qr_code order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de leituras
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectLeituraQrCodeById = async function (id) {
    try {
        let sql = `select * from tbl_leitura_qr_code where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com a leitura encontrada (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteLeituraQrCode = async function (id) {
    try {
        let sql = `delete from tbl_leitura_qr_code where id = ?`

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
    insertLeituraQrCode,
    updateLeituraQrCode,
    selectAllLeiturasQrCode,
    selectLeituraQrCodeById,
    deleteLeituraQrCode
}