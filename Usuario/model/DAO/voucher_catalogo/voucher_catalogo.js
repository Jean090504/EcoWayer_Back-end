/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_voucher_catalogo no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertVoucherCatalogo = async function (catalogo) {
    try {
        let sql = `insert into tbl_voucher_catalogo (nome_parceiro, beneficio, pontos_necessarios, validade_dias, ativo)
                   values (?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            catalogo.nome_parceiro, catalogo.beneficio, catalogo.pontos_necessarios,
            catalogo.validade_dias, catalogo.ativo
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

const updateVoucherCatalogo = async function (catalogo) {
    try {
        let sql = `update tbl_voucher_catalogo
                      set nome_parceiro = ?, beneficio = ?, pontos_necessarios = ?,
                          validade_dias = ?, ativo = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            catalogo.nome_parceiro, catalogo.beneficio, catalogo.pontos_necessarios,
            catalogo.validade_dias, catalogo.ativo, catalogo.id
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

const selectAllVoucherCatalogo = async function () {
    try {
        let sql = `select * from tbl_voucher_catalogo order by id`
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

const selectVoucherCatalogoById = async function (id) {
    try {
        let sql = `select * from tbl_voucher_catalogo where id = ?`
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

// Quantos vouchers usam este item do catálogo. Usado antes de excluir.
const countDependenciasVoucherCatalogo = async function (id) {
    try {
        let sql = `select (select count(*) from tbl_voucher where id_voucher_catalogo = ?) as total`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteVoucherCatalogo = async function (id) {
    try {
        let sql = `delete from tbl_voucher_catalogo where id = ?`
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
    insertVoucherCatalogo,
    updateVoucherCatalogo,
    selectAllVoucherCatalogo,
    selectVoucherCatalogoById,
    countDependenciasVoucherCatalogo,
    deleteVoucherCatalogo
}