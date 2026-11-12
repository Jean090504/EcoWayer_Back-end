/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_qr_code_entrega no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertQrCodeEntrega = async function (vinculo) {
    try {
        let sql = `insert into tbl_qr_code_entrega (id_qr_code, id_anuncio, id_entrega)
                   values (?, ?, ?)`

        let result = await knexConex.raw(sql, [
            vinculo.id_qr_code,
            vinculo.id_anuncio,
            vinculo.id_entrega
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

const updateQrCodeEntrega = async function (vinculo) {
    try {
        let sql = `update tbl_qr_code_entrega
                      set id_qr_code = ?,
                          id_anuncio = ?,
                          id_entrega = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            vinculo.id_qr_code,
            vinculo.id_anuncio,
            vinculo.id_entrega,
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

const selectAllQrCodeEntregas = async function () {
    try {
        let sql = `select * from tbl_qr_code_entrega order by id`

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

const selectQrCodeEntregaById = async function (id) {
    try {
        let sql = `select * from tbl_qr_code_entrega where id = ?`

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

const deleteQrCodeEntrega = async function (id) {
    try {
        let sql = `delete from tbl_qr_code_entrega where id = ?`

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
    insertQrCodeEntrega,
    updateQrCodeEntrega,
    selectAllQrCodeEntregas,
    selectQrCodeEntregaById,
    deleteQrCodeEntrega
}