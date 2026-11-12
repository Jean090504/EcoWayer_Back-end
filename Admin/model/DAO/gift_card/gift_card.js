const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const colunas = `id, slug_api, nome, valor_reais, pontos_resgate, imagem_url, categoria, status,
                 DATE_FORMAT(criado_em, '%Y-%m-%d %H:%i:%s') AS criado_em,
                 DATE_FORMAT(atualizado_em, '%Y-%m-%d %H:%i:%s') AS atualizado_em`

const selectAllGiftCard = async function () {
    try {
        const [rows] = await knexConex.raw(`SELECT ${colunas} FROM tbl_gift_card ORDER BY nome ASC, valor_reais ASC`)
        return rows
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdGiftCard = async function (id) {
    try {
        const [rows] = await knexConex.raw(`SELECT ${colunas} FROM tbl_gift_card WHERE id = ?`, [id])
        return rows
    } catch (error) {
        console.log(error)
        return false
    }
}

const insertGiftCard = async function (giftCard) {
    try {
        const [result] = await knexConex.raw(`
            INSERT INTO tbl_gift_card
                (slug_api, nome, valor_reais, pontos_resgate, imagem_url, categoria, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [giftCard.slug_api, giftCard.nome, giftCard.valor_reais, giftCard.pontos_resgate,
            giftCard.imagem_url, giftCard.categoria, giftCard.status])
        return result.insertId || false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateGiftCard = async function (giftCard) {
    try {
        const [result] = await knexConex.raw(`
            UPDATE tbl_gift_card SET
                nome = ?, valor_reais = ?, pontos_resgate = ?, imagem_url = ?, categoria = ?, status = ?
            WHERE id = ?
        `, [giftCard.nome, giftCard.valor_reais, giftCard.pontos_resgate, giftCard.imagem_url,
            giftCard.categoria, giftCard.status, giftCard.id])
        return result.affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteGiftCard = async function (id) {
    try {
        const [result] = await knexConex.raw('DELETE FROM tbl_gift_card WHERE id = ?', [id])
        return result.affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const upsertGiftCards = async function (giftCards) {
    if (!giftCards.length) return true
    const valores = []
    const placeholders = giftCards.map((giftCard) => {
        valores.push(giftCard.slug_api, giftCard.nome, giftCard.valor_reais, giftCard.pontos_resgate,
            giftCard.imagem_url, giftCard.categoria, giftCard.status)
        return '(?, ?, ?, ?, ?, ?, ?)'
    }).join(', ')

    try {
        await knexConex.raw(`
            INSERT INTO tbl_gift_card
                (slug_api, nome, valor_reais, pontos_resgate, imagem_url, categoria, status)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE
                nome = VALUES(nome), imagem_url = VALUES(imagem_url), categoria = VALUES(categoria)
        `, valores)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    selectAllGiftCard,
    selectByIdGiftCard,
    insertGiftCard,
    updateGiftCard,
    deleteGiftCard,
    upsertGiftCards
}
