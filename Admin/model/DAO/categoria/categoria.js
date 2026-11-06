/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Categoria
 *           (inclui a tabela intermediária tbl_categoria_item como filha da categoria)
 * Autor : Maxwillian
 * Versão :1.2
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
            let sql = `INSERT INTO tbl_categoria (nome, pontos, id_tipo_categoria, img, status) VALUES (?, ?, ?, ?, ?);`
            let result = await trx.raw(sql, [
                categoria.nome,
                categoria.pontos,
                categoria.id_tipo_categoria,
                categoria.img === undefined ? null : categoria.img,
                categoria.status === undefined || categoria.status === null ? 'ativo' : String(categoria.status).toLowerCase()
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
// O status NÃO é alterado aqui (use updateStatusCategoria).
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
        let sql = `SELECT c.id, c.nome, c.pontos, c.img, c.status, c.id_tipo_categoria, t.nome AS tipo_categoria
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
        let sql = `SELECT c.id, c.nome, c.pontos, c.img, c.status, c.id_tipo_categoria, t.nome AS tipo_categoria
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

// Apaga regra de pontuação, vínculos, itens e a categoria, em transação.
// Retorna: { ok: true } | { ok: false, vinculos: true, mensagem } | { ok: false }
const deleteCategoria = async function (id) {
    try {
        let resultado = { ok: true }

        await knexConex.transaction(async function (trx) {
            const contar = async (tabela) => {
                const r = await trx.raw(`SELECT COUNT(*) AS total FROM ${tabela} WHERE id_categoria = ?;`, [id])
                return Number(r[0][0].total)
            }

            const anuncios = await contar('tbl_anuncio')
            const pontosColeta = await contar('tbl_ponto_coleta')
            const pontos = await contar('tbl_pontos')

            if (anuncios > 0 || pontosColeta > 0 || pontos > 0) {
                resultado = {
                    ok: false,
                    vinculos: true,
                    mensagem: `Categoria possui vínculos e não pode ser excluída (anúncios: ${anuncios}, pontos de coleta: ${pontosColeta}, registros de pontos: ${pontos}).`
                }
                return // sai da transação sem apagar nada
            }

            // regra de pontuação e seus multiplicadores
            const regras = (await trx.raw(`SELECT id FROM tbl_regra_pontuacao WHERE id_categoria = ?;`, [id]))[0].map(r => r.id)
            if (regras.length) {
                const marcadores = regras.map(() => '?').join(', ')
                await trx.raw(`DELETE FROM tbl_regra_pontuacao_condicao WHERE id_regra_pontuacao IN (${marcadores});`, regras)
                await trx.raw(`DELETE FROM tbl_regra_pontuacao WHERE id IN (${marcadores});`, regras)
            }

            // itens vinculados (ligação + itens)
            const itens = (await trx.raw(`SELECT id_item FROM tbl_categoria_item WHERE id_categoria = ?;`, [id]))[0].map(r => r.id_item)
            await trx.raw(`DELETE FROM tbl_categoria_item WHERE id_categoria = ?;`, [id])
            if (itens.length) {
                const marcadores = itens.map(() => '?').join(', ')
                await trx.raw(`DELETE FROM tbl_item WHERE id IN (${marcadores});`, itens)
            }

            await trx.raw(`DELETE FROM tbl_categoria WHERE id = ?;`, [id])
        })

        return resultado
    } catch (error) {
        console.log(error)
        return { ok: false }
    }
}

// Altera somente o status da categoria ('ativo' | 'inativo')
const updateStatusCategoria = async function (id, status) {
    try {
        await knexConex.raw(`UPDATE tbl_categoria SET status = ? WHERE id = ?;`, [status, id])
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
    deleteCategoria,
    updateStatusCategoria
}