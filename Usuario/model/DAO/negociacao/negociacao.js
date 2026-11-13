/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Negociação
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere uma nova proposta e devolve o insertId (ou false); data_proposta é preenchida pelo banco
const insertNegociacao = async function (negociacao) {
    try {
        let sql = `INSERT INTO tbl_negociacao (id_conversa, id_usuario, valor, status) VALUES (?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            negociacao.id_conversa,
            negociacao.id_usuario,
            negociacao.valor,
            negociacao.status
        ])

        if (Array.isArray(result) && result[0].affectedRows > 0)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza valor e status de uma proposta (conversa e usuário não mudam; o controller já garantiu que o ID existe)
const updateNegociacao = async function (negociacao) {
    try {
        let sql = `UPDATE tbl_negociacao SET valor = ?, status = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [negociacao.valor, negociacao.status, negociacao.id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todas as negociações (valor vem como texto do mysql2: o controller converte)
const selectAllNegociacao = async function () {
    try {
        let sql = `SELECT id, id_conversa, id_usuario, valor, status, data_proposta
                   FROM tbl_negociacao
                   ORDER BY data_proposta DESC, id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca uma negociação pelo ID
const selectByIdNegociacao = async function (id) {
    try {
        let sql = `SELECT id, id_conversa, id_usuario, valor, status, data_proposta
                   FROM tbl_negociacao
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista o histórico de propostas de uma conversa (mais antigas primeiro, na ordem em que aconteceram)
const selectNegociacaoByIdConversa = async function (idConversa) {
    try {
        let sql = `SELECT id, id_conversa, id_usuario, valor, status, data_proposta
                   FROM tbl_negociacao
                   WHERE id_conversa = ?
                   ORDER BY data_proposta ASC, id ASC;`
        let result = await knexConex.raw(sql, [idConversa])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui uma negociação pelo ID (nenhuma outra tabela referencia tbl_negociacao)
const deleteNegociacao = async function (id) {
    try {
        let sql = `DELETE FROM tbl_negociacao WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertNegociacao,
    updateNegociacao,
    selectAllNegociacao,
    selectByIdNegociacao,
    selectNegociacaoByIdConversa,
    deleteNegociacao
}