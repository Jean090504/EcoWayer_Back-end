/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Categoria
 *           (inclui a tabela intermediária tbl_categoria_item como filha da categoria)
 * Autor : Maxwillian
 * Versão :1.1
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Grava os vínculos categoria -> item dentro da transação recebida
const insertItensCategoria = async function (trx, idCategoria, itens) {
    if (Array.isArray(itens) && itens.length > 0) {
        let valores = itens.map(() => '(?, ?)').join(', ')
        let parametros = []

        itens.forEach(function (idItem) {
            parametros.push(idCategoria, idItem)
        })

        await trx.raw(`INSERT INTO tbl_categoria_item (id_categoria, id_item) VALUES ${valores};`, parametros)
    }
}

const insertCategoria = async function (categoria) {
    try {
        let idInserido = false

        await knexConex.transaction(async function (trx) {
            let sql = `INSERT INTO tbl_categoria (nome, pontos, id_tipo_categoria, img) VALUES (?, ?, ?, ?);`
            let result = await trx.raw(sql, [
                categoria.nome,
                categoria.pontos,
                categoria.id_tipo_categoria,
                categoria.img === undefined ? null : categoria.img
            ])

            idInserido = result[0].insertId

            await insertItensCategoria(trx, idInserido, categoria.itens)
        })

        return idInserido ? idInserido : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Se "itens" vier no body (mesmo vazio), troca todos os vínculos. Se não vier, mantém os atuais.
const updateCategoria = async function (categoria) {
    try {
        await knexConex.transaction(async function (trx) {
            let sql = `UPDATE tbl_categoria SET nome = ?, pontos = ?, id_tipo_categoria = ?, img = ? WHERE id = ?;`
            await trx.raw(sql, [
                categoria.nome,
                categoria.pontos,
                categoria.id_tipo_categoria,
                categoria.img === undefined ? null : categoria.img,
                categoria.id
            ])

            if (Array.isArray(categoria.itens)) {
                await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_categoria = ?;`, [categoria.id])
                await insertItensCategoria(trx, categoria.id, categoria.itens)
            }
        })

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdCategoria = async function (id) {
    try {
        let sql = `SELECT c.id, c.nome, c.pontos, c.img, c.id_tipo_categoria, t.nome AS tipo_categoria
                   FROM tbl_categoria AS c
                   INNER JOIN tbl_tipo_categoria AS t ON t.id = c.id_tipo_categoria
                   WHERE c.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllCategoria = async function () {
    try {
        let sql = `SELECT c.id, c.nome, c.pontos, c.img, c.id_tipo_categoria, t.nome AS tipo_categoria
                   FROM tbl_categoria AS c
                   INNER JOIN tbl_tipo_categoria AS t ON t.id = c.id_tipo_categoria
                   ORDER BY c.nome;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Itens vinculados a uma categoria (usado pelo controller para montar o objeto)
const selectItensByCategoria = async function (idCategoria) {
    try {
        let sql = `SELECT i.id, i.nome, i.descricao, i.pontos_base, i.status
                   FROM tbl_categoria_item AS ci
                   INNER JOIN tbl_item AS i ON i.id = ci.id_item
                   WHERE ci.id_categoria = ?
                   ORDER BY i.nome;`
        let result = await knexConex.raw(sql, [idCategoria])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Devolve os ids que realmente existem em tbl_item (o controller compara com o que veio no body)
const selectItensExistentes = async function (ids) {
    try {
        let marcadores = ids.map(() => '?').join(', ')
        let result = await knexConex.raw(`SELECT id FROM tbl_item WHERE id IN (${marcadores});`, ids)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Apaga primeiro os vínculos com itens e depois a categoria, em transação.
// Se a categoria estiver em uso (tbl_anuncio, tbl_pontos, tbl_ponto_coleta), a FK impede a exclusão.
const deleteCategoria = async function (id) {
    try {
        await knexConex.transaction(async function (trx) {
            await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_categoria = ?;`, [id])
            await trx.raw(`DELETE FROM tbl_categoria WHERE id = ?;`, [id])
        })

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoria,
    updateCategoria,
    selectByIdCategoria,
    selectAllCategoria,
    selectItensByCategoria,
    selectItensExistentes,
    deleteCategoria
}