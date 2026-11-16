/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_tipo_modalidade no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertTipoModalidade = async function (tipo) {
    try {
        let result = await knexConex.raw(`insert into tbl_tipo_modalidade (tipo) values (?)`, [tipo.tipo])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateTipoModalidade = async function (tipo) {
    try {
        let result = await knexConex.raw(`update tbl_tipo_modalidade set tipo = ? where id = ?`, [tipo.tipo, tipo.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllTiposModalidade = async function () {
    try {
        let result = await knexConex.raw(`select id, tipo from tbl_tipo_modalidade order by id`)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectTipoModalidadeById = async function (id) {
    try {
        let result = await knexConex.raw(`select id, tipo from tbl_tipo_modalidade where id = ?`, [id])

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
        let result = await knexConex.raw(`select id from tbl_tipo_modalidade where tipo = ? and id <> ?`, [tipo, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantas modalidades usam o tipo. Usado antes de excluir.
const countModalidadesDoTipo = async function (id) {
    try {
        let result = await knexConex.raw(`select count(*) as total from tbl_modalidade where id_tipo_modalidade = ?`, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteTipoModalidade = async function (id) {
    try {
        let result = await knexConex.raw(`delete from tbl_tipo_modalidade where id = ?`, [id])

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
    insertTipoModalidade,
    updateTipoModalidade,
    selectAllTiposModalidade,
    selectTipoModalidadeById,
    selectTipoPorNome,
    countModalidadesDoTipo,
    deleteTipoModalidade
}