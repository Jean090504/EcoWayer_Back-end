/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_modalidade no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertModalidade = async function (modalidade) {
    try {
        let sql = `insert into tbl_modalidade (nome, id_tipo_modalidade) values (?, ?)`
        let result = await knexConex.raw(sql, [modalidade.nome, modalidade.id_tipo_modalidade])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateModalidade = async function (modalidade) {
    try {
        let sql = `update tbl_modalidade set nome = ?, id_tipo_modalidade = ? where id = ?`
        let result = await knexConex.raw(sql, [modalidade.nome, modalidade.id_tipo_modalidade, modalidade.id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllModalidades = async function () {
    try {
        let result = await knexConex.raw(`select id, nome, id_tipo_modalidade from tbl_modalidade order by id`)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectModalidadeById = async function (id) {
    try {
        let result = await knexConex.raw(`select id, nome, id_tipo_modalidade from tbl_modalidade where id = ?`, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Verifica se o nome já existe em outra modalidade (ignora o próprio na atualização)
const selectModalidadePorNome = async function (nome, idIgnorar = 0) {
    try {
        let result = await knexConex.raw(`select id from tbl_modalidade where nome = ? and id <> ?`, [nome, idIgnorar])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Confere se o tipo de modalidade existe
const selectTipoModalidadeExiste = async function (id) {
    try {
        let result = await knexConex.raw(`select id from tbl_tipo_modalidade where id = ?`, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos anúncios usam a modalidade. Usado antes de excluir.
const countAnunciosDaModalidade = async function (id) {
    try {
        let result = await knexConex.raw(`select count(*) as total from tbl_anuncio where id_modalidade = ?`, [id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteModalidade = async function (id) {
    try {
        let result = await knexConex.raw(`delete from tbl_modalidade where id = ?`, [id])

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
    insertModalidade,
    updateModalidade,
    selectAllModalidades,
    selectModalidadeById,
    selectModalidadePorNome,
    selectTipoModalidadeExiste,
    countAnunciosDaModalidade,
    deleteModalidade
}