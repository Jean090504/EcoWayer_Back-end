const crypto = require('node:crypto');
const rewardDAO = require('../../model/DAO/recompensa/recompensa');
const pointsDAO = require('../../model/DAO/pontos/pontos');
const userDAO = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');

// Lista recompensas disponíveis e o custo em pontos.
const listarRecompensas = async (_request, response) => {
    const recompensas = await rewardDAO.listarAtivas();
    response.json({ count: recompensas.length, recompensas });
};

// Troca pontos por um voucher do catálogo.
const resgatarVoucher = async (request, response) => {
    const rewardId = Number(request.params.id);
    const userId = Number(request.auth.sub);

    if (!Number.isInteger(rewardId) || rewardId < 1) {
        throw new AppError('Recompensa inválida.', 400, 'VALIDATION_ERROR');
    }

    const voucher = await userDAO.transaction(async (transaction) => {
        // Serializa resgates do mesmo usuário para impedir saldo negativo.
        const user = await transaction('tbl_usuario')
            .select('id')
            .where({ id: userId })
            .forUpdate()
            .first();
        if (!user) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');

        const reward = await rewardDAO.buscarAtiva(rewardId, transaction);
        if (!reward) throw new AppError('Recompensa não encontrada.', 404, 'REWARD_NOT_FOUND');

        const balance = await pointsDAO.buscarSaldo(userId, transaction);
        if (balance < Number(reward.pontos_necessarios)) {
            throw new AppError('Saldo de pontos insuficiente.', 409, 'INSUFFICIENT_POINTS');
        }

        const resgatadoEm = new Date();
        const expiraEm = new Date(
            resgatadoEm.getTime() + Number(reward.validade_dias) * 24 * 60 * 60 * 1000
        );
        const codigo = `ECO-VOUCHER-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

        return rewardDAO.resgatar({
            reward,
            userId,
            code: codigo,
            redeemedAt: resgatadoEm,
            expiresAt: expiraEm,
        }, transaction);
    });

    response.status(201).json({ mensagem: 'Voucher resgatado.', voucher });
};

module.exports = { listarRecompensas, resgatarVoucher };
