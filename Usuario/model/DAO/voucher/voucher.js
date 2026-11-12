/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_voucher no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertVoucher = async function (voucher) {
    try {
        let sql = `insert into tbl_voucher (nome_parceiro, beneficio, codigo, data_resgate, data_expiracao,
                                            status, pontos_utilizados, id_usuario, id_voucher_catalogo)
                   values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            voucher.nome_parceiro, voucher.beneficio, voucher.codigo, voucher.data_resgate,
            voucher.data_expiracao, voucher.status, voucher.pontos_utilizados,
            voucher.id_usuario, voucher.id_voucher_catalogo
        ])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateVoucher = async function (voucher) {
    try {
        let sql = `update tbl_voucher
                      set nome_parceiro = ?, beneficio = ?, codigo = ?, data_resgate = ?,
                          data_expiracao = ?, status = ?, pontos_utilizados = ?,
                          id_usuario = ?, id_voucher_catalogo = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            voucher.nome_parceiro, voucher.beneficio, voucher.codigo, voucher.data_resgate,
            voucher.data_expiracao, voucher.status, voucher.pontos_utilizados,
            voucher.id_usuario, voucher.id_voucher_catalogo, voucher.id
        ])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllVouchers = async function () {
    try {
        let sql = `select * from tbl_voucher order by id`
        let result = await knexConex.raw(sql)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectVoucherById = async function (id) {
    try {
        let sql = `select * from tbl_voucher where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Verifica se o código já existe em outro voucher (ignora o próprio na atualização)
const selectVoucherByCodigo = async function (codigo, idIgnorar = 0) {
    try {
        let sql = `select id from tbl_voucher where codigo = ? and id <> ?`
        let result = await knexConex.raw(sql, [codigo, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectUsuarioExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_usuario where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Confere se o item existe no catálogo de vouchers (tbl_voucher_catalogo)
const selectVoucherCatalogoExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_voucher_catalogo where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos QR Codes estão ligados ao voucher. Usado antes de excluir.
const countDependenciasVoucher = async function (id) {
    try {
        let sql = `select (select count(*) from tbl_qr_code_voucher where id_voucher = ?) as total`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteVoucher = async function (id) {
    try {
        let sql = `delete from tbl_voucher where id = ?`
        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertVoucher,
    updateVoucher,
    selectAllVouchers,
    selectVoucherById,
    selectVoucherByCodigo,
    selectUsuarioExiste,
    selectVoucherCatalogoExiste,
    countDependenciasVoucher,
    deleteVoucher
}