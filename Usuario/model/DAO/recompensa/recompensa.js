const database = require('../../../database/database');

const listarAtivas = (connection = database) => connection('tbl_catalogo_voucher')
    .select('id', 'nome_parceiro', 'beneficio', 'pontos_necessarios', 'validade_dias')
    .where({ ativo: true })
    .orderBy('id');

const buscarAtiva = (id, connection = database) => connection('tbl_catalogo_voucher')
    .where({ id, ativo: true })
    .first();

// Emite um voucher individual e registra quantos pontos foram gastos.
const resgatar = async ({ reward, userId, code, redeemedAt, expiresAt }, connection) => {
    const [voucherId] = await connection('tbl_voucher').insert({
        nome_parceiro: reward.nome_parceiro,
        beneficio: reward.beneficio,
        codigo: code,
        data_resgate: redeemedAt,
        data_expiracao: expiresAt,
        status: 'ativo',
        pontos_utilizados: reward.pontos_necessarios,
        id_usuario: userId,
    });

    return connection('tbl_voucher').where({ id: voucherId }).first();
};

module.exports = { listarAtivas, buscarAtiva, resgatar };
