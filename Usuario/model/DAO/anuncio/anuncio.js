/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_anuncio no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertAnuncio = async function (anuncio) {
    try {
        let sql = `insert into tbl_anuncio (nome, descricao, data_publicacao, id_usuario, id_categoria,
                                            id_modalidade, id_condicao_item, preco, peso_kg, status)
                   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.data_publicacao,
            anuncio.id_usuario,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item,
            anuncio.preco,
            anuncio.peso_kg,
            anuncio.status
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

const updateAnuncio = async function (anuncio, idUsuario) {
    try {
        let sql = `update tbl_anuncio
                      set nome = ?,
                          descricao = ?,
                          data_publicacao = ?,
                          id_usuario = ?,
                          id_categoria = ?,
                          id_modalidade = ?,
                          id_condicao_item = ?,
                          preco = ?,
                          peso_kg = ?,
                          status = ?
                    where id = ? and id_usuario = ?`

        let result = await knexConex.raw(sql, [
            anuncio.nome,
            anuncio.descricao,
            anuncio.data_publicacao,
            anuncio.id_usuario,
            anuncio.id_categoria,
            anuncio.id_modalidade,
            anuncio.id_condicao_item,
            anuncio.preco,
            anuncio.peso_kg,
            anuncio.status,
            anuncio.id,
            idUsuario
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

const selectAllAnuncios = async function () {
    try {
        let sql = `SELECT a.*,
    (SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = a.id ORDER BY ia.ordem IS NULL, ia.ordem, ia.id LIMIT 1) AS imagem,
    (SELECT c.nome FROM tbl_categoria c WHERE c.id = a.id_categoria) AS categoria,
    (SELECT m.nome FROM tbl_modalidade m WHERE m.id = a.id_modalidade) AS modalidade_nome
    FROM tbl_anuncio a ORDER BY a.id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de anúncios
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAnuncioById = async function (id) {
    try {
        let sql = `SELECT a.*,
    (SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = a.id ORDER BY ia.ordem IS NULL, ia.ordem, ia.id LIMIT 1) AS imagem,
    (SELECT c.nome FROM tbl_categoria c WHERE c.id = a.id_categoria) AS categoria,
    (SELECT m.nome FROM tbl_modalidade m WHERE m.id = a.id_modalidade) AS modalidade_nome
    FROM tbl_anuncio a WHERE a.id = ?`

        let result = await knexConex.raw(sql, [id])

        if (!result) return false
        if (result[0].length) {
            const [imagens] = await knexConex.raw(
                'SELECT i.url FROM tbl_imagem_anuncio ia JOIN tbl_imagem i ON i.id = ia.id_imagem WHERE ia.id_anuncio = ? ORDER BY ia.ordem IS NULL, ia.ordem, ia.id', [id]
            )
            result[0][0].imagens = imagens.map(imagem => imagem.url)
            // Somente dados públicos do proprietário do anúncio; não usa a rota privada de perfil.
            const [vendedores] = await knexConex.raw(`
                SELECT u.id, u.nome, i.url AS foto,
                    DATE_FORMAT(u.data_cadastro, '%Y-%m-%d') AS membroDesde,
                    (SELECT COUNT(*) FROM tbl_anuncio publicados
                     WHERE publicados.id_usuario = u.id AND publicados.status = 'ativo') AS anunciosAtivos
                FROM tbl_usuario u
                LEFT JOIN tbl_imagem i ON i.id = u.id_imagem
                WHERE u.id = ? LIMIT 1`, [result[0][0].id_usuario])
            result[0][0].vendedor = vendedores[0] || null

        }
        return result[0]
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteAnuncio = async function (id, idUsuario) {
    try {
        let sql = `delete from tbl_anuncio where id = ? and id_usuario = ?`

        let result = await knexConex.raw(sql, [id, idUsuario])

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
    insertAnuncio,
    updateAnuncio,
    selectAllAnuncios,
    selectAnuncioById,
    deleteAnuncio
}
