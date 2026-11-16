/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_tipo_denuncias no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertTipoDenuncia = async function (tipo) {
    try {
        let result = await knexConex.raw(`insert into tbl_tipo_denuncias (tipo) values (?)`, [tipo.tipo])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateTipoDenuncia = async function (tipo) {
    try {
        let result = await knexConex.raw(`update tbl_tipo_denuncias set tipo = ? where id = ?`, [tipo.tipo, tipo.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllTiposDenuncia = async function () {
    try {
        let result = await knexConex.raw(`select id, tipo from tbl_tipo_denuncias order by id`)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectTipoDenunciaById = async function (id) {
    try {
        let result = await knexConex.raw(`select id, tipo from tbl_tipo_denuncias where id = ?`, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Verifica se o tipo já existe em outro registro (ignora o próprio na atualização)
const selectTipoPorNome = async function (tipo, idIgnorar = 0) {
    try {
        let result = await knexConex.raw(`select id from tbl_tipo_denuncias where tipo = ? and id <> ?`, [tipo, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantas denúncias usam o tipo. Usado antes de excluir.
const countDenunciasDoTipo = async function (id) {
    try {
        let result = await knexConex.raw(`select count(*) as total from tbl_denuncias where id_tipo_denuncias = ?`, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteTipoDenuncia = async function (id) {
    try {
        let result = await knexConex.raw(`delete from tbl_tipo_denuncias where id = ?`, [id])

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
    insertTipoDenuncia,
    updateTipoDenuncia,
    selectAllTiposDenuncia,
    selectTipoDenunciaById,
    selectTipoPorNome,
    countDenunciasDoTipo,
    deleteTipoDenuncia
}