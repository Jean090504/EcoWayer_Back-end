/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_pontos no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertPontos = async function (pontos) {
    try {
        let sql = `insert into tbl_pontos (qntd_pontos, data_registro, id_categoria, id_usuario, id_entrega, id_regra_pontuacao)
                   values (?, ?, ?, ?, ?, ?)`
        let result = await knexConex.raw(sql, [
            pontos.qntd_pontos, pontos.data_registro, pontos.id_categoria,
            pontos.id_usuario, pontos.id_entrega, pontos.id_regra_pontuacao
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

const updatePontos = async function (pontos) {
    try {
        let sql = `update tbl_pontos
                      set qntd_pontos = ?, data_registro = ?, id_categoria = ?,
                          id_usuario = ?, id_entrega = ?, id_regra_pontuacao = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            pontos.qntd_pontos, pontos.data_registro, pontos.id_categoria,
            pontos.id_usuario, pontos.id_entrega, pontos.id_regra_pontuacao, pontos.id
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

const selectAllPontos = async function () {
    try {
        let sql = `select * from tbl_pontos order by id`
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

const selectPontosById = async function (id) {
    try {
        let sql = `select * from tbl_pontos where id = ?`
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

// Confere se um id existe numa tabela de referência (usuário, categoria, entrega ou regra)
const selectExiste = async function (tabela, id) {
    try {
        const tabelasPermitidas = ['tbl_usuario', 'tbl_categoria', 'tbl_entrega', 'tbl_regra_pontuacao']
        if (!tabelasPermitidas.includes(tabela)) return false

        let result = await knexConex.raw(`select id from ${tabela} where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertPontos,
    updatePontos,
    selectAllPontos,
    selectPontosById,
    selectExiste
}