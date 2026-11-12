/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_qr_code no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertQrCode = async function (qrCode) {
    try {
        let sql = `insert into tbl_qr_code (codigo, data_criacao, data_expiracao, status)
                   values (?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            qrCode.codigo,
            qrCode.data_criacao,
            qrCode.data_expiracao,
            qrCode.status
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

const updateQrCode = async function (qrCode) {
    try {
        let sql = `update tbl_qr_code
                      set codigo = ?,
                          data_criacao = ?,
                          data_expiracao = ?,
                          status = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            qrCode.codigo,
            qrCode.data_criacao,
            qrCode.data_expiracao,
            qrCode.status,
            qrCode.id
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

const selectAllQrCodes = async function () {
    try {
        let sql = `select * from tbl_qr_code order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de QR Codes
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectQrCodeById = async function (id) {
    try {
        let sql = `select * from tbl_qr_code where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com o QR Code encontrado (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteQrCode = async function (id) {
    try {
        let sql = `delete from tbl_qr_code where id = ?`

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
    insertQrCode,
    updateQrCode,
    selectAllQrCodes,
    selectQrCodeById,
    deleteQrCode
}