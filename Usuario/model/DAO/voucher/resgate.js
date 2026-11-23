const { createHash } = require('node:crypto')
const knex = require('knex')
const db = knex(require('../../database_config_knex/knexFile.js').development)

async function consultarSaldo(idUsuario, conexao = db) {
    const [[linha]] = await conexao.raw(`
        SELECT COALESCE((SELECT saldo_atual FROM tbl_saldo_pontos WHERE id_usuario = ?), 0)
             + COALESCE((SELECT SUM(p.qntd_pontos)
                         FROM tbl_pontos p
                         LEFT JOIN tbl_extrato_pontos e ON e.id_pontos = p.id
                         WHERE p.id_usuario = ? AND p.qntd_pontos > 0 AND e.id IS NULL), 0) AS saldo
    `, [idUsuario, idUsuario])
    return Number(linha.saldo)
}

async function resgatar(idUsuario, idCatalogo, solicitacao, pontosConfirmados) {
    const chave = `resgate:${idUsuario}:${solicitacao}`
    const codigo = `ECO-${createHash('sha256').update(chave).digest('hex').slice(0, 32).toUpperCase()}`

    return db.transaction(async trx => {
        // Serializa resgates da mesma conta, inclusive antes da criação da linha de saldo.
        const usuario = await trx('tbl_usuario').where({ id: idUsuario }).forUpdate().first('id')
        if (!usuario) return { erro: 'usuario' }

        const anterior = await trx('tbl_extrato_pontos as e')
            .join('tbl_voucher as v', 'v.id', 'e.id_voucher')
            .where({ 'e.id_usuario': idUsuario, 'e.chave_idempotencia': chave, 'e.tipo': 'debito' })
            .first('v.*')
        const saldo = await consultarSaldo(idUsuario, trx)
        if (anterior) {
            return Number(anterior.id_voucher_catalogo) === idCatalogo
                ? { voucher: anterior, saldo, repetido: true }
                : { erro: 'solicitacao' }
        }

        const item = await trx('tbl_voucher_catalogo').where({ id: idCatalogo, ativo: 1 }).forShare().first()
        if (!item) return { erro: 'catalogo' }
        const custo = Number(item.pontos_necessarios)
        const dias = Number(item.validade_dias)
        if (!Number.isSafeInteger(custo) || custo <= 0 || !Number.isSafeInteger(dias) || dias <= 0) return { erro: 'catalogo' }
        if (custo !== pontosConfirmados) return { erro: 'custo' }
        if (saldo < custo) return { erro: 'saldo' }

        // Importa créditos antigos ainda sem lançamento. Os triggers aplicam cada movimento ao saldo.
        await trx.raw(`
            INSERT INTO tbl_extrato_pontos
                (id_usuario, id_pontos, tipo, quantidade, descricao, data_movimentacao, chave_idempotencia)
            SELECT p.id_usuario, p.id, 'credito', p.qntd_pontos, 'Crédito de pontos', p.data_registro,
                   CONCAT('credito:pontos:', p.id)
            FROM tbl_pontos p
            LEFT JOIN tbl_extrato_pontos e ON e.id_pontos = p.id
            WHERE p.id_usuario = ? AND p.qntd_pontos > 0 AND e.id IS NULL
            ORDER BY p.id
        `, [idUsuario])

        const [idVoucher] = await trx('tbl_voucher').insert({
            id_usuario: idUsuario,
            id_voucher_catalogo: idCatalogo,
            nome_parceiro: item.nome_parceiro,
            beneficio: item.beneficio,
            codigo,
            data_resgate: trx.raw('UTC_TIMESTAMP()'),
            data_expiracao: trx.raw('TIMESTAMPADD(DAY, ?, UTC_TIMESTAMP())', [dias]),
            status: 'ativo',
            pontos_utilizados: custo
        })

        await trx('tbl_extrato_pontos').insert({
            id_usuario: idUsuario,
            id_voucher: idVoucher,
            tipo: 'debito',
            quantidade: custo,
            descricao: 'Resgate de benefício',
            chave_idempotencia: chave
        })

        const voucher = await trx('tbl_voucher').where({ id: idVoucher }).first()
        return { voucher, saldo: await consultarSaldo(idUsuario, trx) }
    })
}

module.exports = { consultarSaldo, resgatar }
