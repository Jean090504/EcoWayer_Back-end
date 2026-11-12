/************************************************************************************
 * Objetivo: CRUD no MySQL na tabela tbl_voucher (SQL sempre com bindings)
 * Data: 16/10/2026
 * Autor: Maxwillian Santana
 * Versão: 1.0
 ************************************************************************************/
const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Colunas dos SELECTs: o id_usuario vira o nome do usuário (JOIN) e as datas saem como texto
const colunasSelect = `v.id, v.nome_parceiro, v.beneficio, v.codigo,
                       v.id_gift_card, g.nome AS gift_card,
                       DATE_FORMAT(v.data_resgate, '%Y-%m-%d %H:%i:%s') AS data_resgate,
                       DATE_FORMAT(v.data_expiracao, '%Y-%m-%d %H:%i:%s') AS data_expiracao,
                       v.status, v.pontos_utilizados, u.nome AS usuario`

// INSERT: retorna o insertId em caso de sucesso, ou false
const insertVoucher = async function (voucher) {
    try {
        let sql = `INSERT INTO tbl_voucher
                    (nome_parceiro, beneficio, codigo, data_resgate, data_expiracao, status, pontos_utilizados, id_usuario)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            voucher.nome_parceiro,
            voucher.beneficio,
            voucher.codigo,
            voucher.data_resgate,
            voucher.data_expiracao,
            voucher.status,
            voucher.pontos_utilizados,
            voucher.id_usuario
        ])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// UPDATE: retorna true ou false
const updateVoucher = async function (voucher) {
    try {
        let sql = `UPDATE tbl_voucher SET
                    nome_parceiro = ?,
                    beneficio = ?,
                    codigo = ?,
                    data_resgate = ?,
                    data_expiracao = ?,
                    status = ?,
                    pontos_utilizados = ?,
                    id_usuario = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            voucher.nome_parceiro,
            voucher.beneficio,
            voucher.codigo,
            voucher.data_resgate,
            voucher.data_expiracao,
            voucher.status,
            voucher.pontos_utilizados,
            voucher.id_usuario,
            voucher.id
        ])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT por ID: retorna array (pode ser vazio) ou false
const selectByIdVoucher = async function (id) {
    try {
        let sql = `SELECT ${colunasSelect}
                   FROM tbl_voucher v
                   LEFT JOIN tbl_usuario u ON u.id = v.id_usuario
                   LEFT JOIN tbl_gift_card g ON g.id = v.id_gift_card
                   WHERE v.id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// SELECT ALL: maior id primeiro
const selectAllVoucher = async function () {
    try {
        let sql = `SELECT ${colunasSelect}
                   FROM tbl_voucher v
                   LEFT JOIN tbl_usuario u ON u.id = v.id_usuario
                   LEFT JOIN tbl_gift_card g ON g.id = v.id_gift_card
                   ORDER BY v.id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// DELETE: retorna true ou false
const deleteVoucher = async function (id) {
    try {
        let sql = `DELETE FROM tbl_voucher WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

// Resgate atômico: valida o gift card, confere o saldo e grava o débito
// na mesma transação para impedir resgates concorrentes acima do saldo.
const insertVoucherComDebito = async function (voucher) {
    try {
        return await knexConex.transaction(async (trx) => {
            const [usuario] = await trx.raw('SELECT id FROM tbl_usuario WHERE id = ? FOR UPDATE', [voucher.id_usuario])
            if (!usuario || usuario.length === 0) return { ok: false, motivo: 'USUARIO_NAO_ENCONTRADO' }

            const [giftCards] = await trx.raw(
                "SELECT id, nome FROM tbl_gift_card WHERE id = ? AND status = 'ativo' FOR UPDATE",
                [voucher.id_gift_card]
            )
            if (!giftCards || giftCards.length === 0) return { ok: false, motivo: 'GIFT_CARD_INATIVO' }

            const [ganhos] = await trx.raw(
                'SELECT COALESCE(SUM(qntd_pontos), 0) AS total FROM tbl_pontos WHERE id_usuario = ?',
                [voucher.id_usuario]
            )
            const [gastos] = await trx.raw(
                "SELECT COALESCE(SUM(pontos_utilizados), 0) AS total FROM tbl_voucher WHERE id_usuario = ? AND status <> 'cancelado'",
                [voucher.id_usuario]
            )
            const saldo = Number(ganhos?.[0]?.total || 0) - Number(gastos?.[0]?.total || 0)
            if (saldo < Number(voucher.pontos_utilizados)) {
                return { ok: false, motivo: 'SALDO_INSUFICIENTE', saldo, necessario: Number(voucher.pontos_utilizados) }
            }

            const [result] = await trx.raw(`INSERT INTO tbl_voucher
                (nome_parceiro, beneficio, codigo, data_resgate, data_expiracao, status, pontos_utilizados, id_usuario, id_gift_card)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                voucher.nome_parceiro, voucher.beneficio, voucher.codigo,
                voucher.data_resgate, voucher.data_expiracao, voucher.status,
                voucher.pontos_utilizados, voucher.id_usuario, voucher.id_gift_card
            ])
            return { ok: Boolean(result?.insertId), id: result?.insertId, saldoRestante: saldo - Number(voucher.pontos_utilizados) }
        })
    } catch (error) {
        console.log(error)
        return { ok: false, motivo: 'ERRO_BANCO' }
    }
}

module.exports = {
    insertVoucher,
    updateVoucher,
    selectByIdVoucher,
    selectAllVoucher,
    deleteVoucher
    ,insertVoucherComDebito
}
