const database = require('../../../database/database');

// Usa a função MySQL que desconta vouchers e considera a validade dos pontos.
const buscarSaldo = async (userId, connection = database) => {
    const [rows] = await connection.raw(
        'SELECT fn_calcular_saldo_pontos_valido(?) AS saldo',
        [userId]
    );

    return Number(rows[0]?.saldo || 0);
};

module.exports = { buscarSaldo };
