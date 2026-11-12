/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_qr_code_voucher no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertQrCodeVoucher = async function (vinculo) {
    try {
        let sql = `insert into tbl_qr_code_voucher (id_qr_code, id_voucher)
                   values (?, ?)`

        let result = await knexConex.raw(sql, [
            vinculo.id_qr_code,
            vinculo.id_voucher
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

const updateQrCodeVoucher = async function (vinculo) {
    try {
        let sql = `update tbl_qr_code_voucher
                      set id_qr_code = ?,
                          id_voucher = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            vinculo.id_qr_code,
            vinculo.id_voucher,
            vinculo.id
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

const selectAllQrCodeVouchers = async function () {
    try {
        let sql = `select * from tbl_qr_code_voucher order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de vínculos
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectQrCodeVoucherById = async function (id) {
    try {
        let sql = `select * from tbl_qr_code_voucher where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com o vínculo encontrado (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteQrCodeVoucher = async function (id) {
    try {
        let sql = `delete from tbl_qr_code_voucher where id = ?`

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
    insertQrCodeVoucher,
    updateQrCodeVoucher,
    selectAllQrCodeVouchers,
    selectQrCodeVoucherById,
    deleteQrCodeVoucher
}