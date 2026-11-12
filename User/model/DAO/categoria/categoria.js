/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela de Categoria
 * Autor : [SEU NOME]
 * Versão : 1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Insere uma nova categoria e devolve o insertId (ou false)
const insertCategoria = async function (categoria) {
    try {
        let sql = `INSERT INTO tbl_categoria (nome, pontos, id_tipo_categoria, img, cor) VALUES (?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            categoria.nome,
            categoria.pontos,
            categoria.id_tipo_categoria,
            categoria.img,
            categoria.cor
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

// Atualiza uma categoria (o controller já garantiu que o ID existe)
const updateCategoria = async function (categoria) {
    try {
        let sql = `UPDATE tbl_categoria
                   SET nome = ?, pontos = ?, id_tipo_categoria = ?, img = ?, cor = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            categoria.nome,
            categoria.pontos,
            categoria.id_tipo_categoria,
            categoria.img,
            categoria.cor,
            categoria.id
        ])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Lista todas as categorias
const selectAllCategoria = async function () {
    try {
        let sql = `SELECT id, nome, pontos, id_tipo_categoria, img, cor FROM tbl_categoria ORDER BY id;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca uma categoria pelo ID
const selectByIdCategoria = async function (id) {
    try {
        let sql = `SELECT id, nome, pontos, id_tipo_categoria, img, cor FROM tbl_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Busca pelo nome (a coluna nome é UNIQUE: usada para evitar duplicidade antes de gravar)
const selectByNomeCategoria = async function (nome) {
    try {
        let sql = `SELECT id, nome FROM tbl_categoria WHERE nome = ?;`
        let result = await knexConex.raw(sql, [nome])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Exclui uma categoria pelo ID (os vínculos com item são apagados antes, pelo controller)
const deleteCategoria = async function (id) {
    try {
        let sql = `DELETE FROM tbl_categoria WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// Conta quantos registros de OUTRAS tabelas usam a categoria (FK), para não estourar erro no DELETE:
// anúncios, pontos de coleta, pontos do usuário e regra de pontuação
const countVinculosByIdCategoria = async function (id) {
    try {
        let sql = `SELECT
                       (SELECT COUNT(*) FROM tbl_anuncio WHERE id_categoria = ?) +
                       (SELECT COUNT(*) FROM tbl_ponto_coleta WHERE id_categoria = ?) +
                       (SELECT COUNT(*) FROM tbl_pontos WHERE id_categoria = ?) +
                       (SELECT COUNT(*) FROM tbl_regra_pontuacao WHERE id_categoria = ?) AS total;`
        let result = await knexConex.raw(sql, [id, id, id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertCategoria,
    updateCategoria,
    selectAllCategoria,
    selectByIdCategoria,
    selectByNomeCategoria,
    deleteCategoria,
    countVinculosByIdCategoria
}