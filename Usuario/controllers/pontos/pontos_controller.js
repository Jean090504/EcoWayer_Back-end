const dao = require('../../model/DAO/pontos/pontos');

// Consulta o saldo de pontos válido para o usuário autenticado.
const buscarSaldo = async (request, response) => {
    const saldo = await dao.buscarSaldo(Number(request.auth.sub));
    response.json({ saldo_pontos: saldo });
};

module.exports = { buscarSaldo };
