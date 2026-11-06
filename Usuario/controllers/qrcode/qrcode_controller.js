const crypto = require('node:crypto');
const qrDAO = require('../../model/DAO/qrcode/qrcode');
const userDAO = require('../../model/DAO/usuario/usuario');
const AppError = require('../../utils/AppError');

// Gera um código temporário para uma entrega pendente.
const gerarCodigo = async (request, response) => {
    const deliveryId = Number(request.body.id_entrega);
    const userId = Number(request.auth.sub);

    if (!Number.isInteger(deliveryId) || deliveryId < 1) {
        throw new AppError('Informe uma entrega válida.', 400, 'VALIDATION_ERROR');
    }

    const delivery = await qrDAO.buscarEntrega(deliveryId);
    if (!delivery) throw new AppError('Entrega não encontrada.', 404, 'DELIVERY_NOT_FOUND');

    const isParticipant = [delivery.id_recebedor, delivery.id_anunciante]
        .map(Number)
        .includes(userId);
    if (!isParticipant) {
        throw new AppError('Você não participa desta entrega.', 403, 'FORBIDDEN');
    }
    if (delivery.status_entrega !== 'pendente') {
        throw new AppError('A entrega não está pendente.', 409, 'DELIVERY_NOT_PENDING');
    }

    const ttlHours = Number(process.env.QR_CODE_TTL_HOURS || 24);
    if (!Number.isInteger(ttlHours) || ttlHours < 1 || ttlHours > 168) {
        throw new AppError('QR_CODE_TTL_HOURS precisa estar entre 1 e 168.', 500, 'INVALID_QR_CONFIGURATION');
    }

    const criadoEm = new Date();
    const expiraEm = new Date(criadoEm.getTime() + ttlHours * 60 * 60 * 1000);
    const codigo = `ECO-${crypto.randomBytes(18).toString('hex').toUpperCase()}`;

    await userDAO.transaction(async (transaction) => {
        await qrDAO.cancelarCodigosAtivos(deliveryId, transaction);
        await qrDAO.criar({
            code: codigo,
            createdAt: criadoEm,
            expiresAt: expiraEm,
            userId,
            delivery,
        }, transaction);
    });

    response.status(201).json({
        mensagem: 'QR code criado.',
        codigo_qr: codigo,
        id_entrega: deliveryId,
        expira_em: expiraEm,
    });
};

// Valida o código uma única vez; o trigger registra a conclusão e os pontos.
const validarCodigo = async (request, response) => {
    const codigo = String(request.body.codigo_qr || '').trim();
    const userId = Number(request.auth.sub);

    if (!codigo || codigo.length > 255) {
        throw new AppError('Informe um código QR válido.', 400, 'VALIDATION_ERROR');
    }

    const resultado = await userDAO.transaction(async (transaction) => {
        const qr = await qrDAO.buscarPorCodigoParaAtualizar(codigo, transaction);
        if (!qr) return { tipo: 'nao_encontrado' };

        const isParticipant = [qr.id_recebedor, qr.id_anunciante].map(Number).includes(userId);
        if (!isParticipant) return { tipo: 'nao_participante' };

        if (Number(qr.id_usuario_gerador) === userId) {
            await qrDAO.registrarLeitura({
                qrId: qr.id_qr_code,
                userId,
                status: 'invalida',
            }, transaction);
            return { tipo: 'mesmo_usuario' };
        }

        const codigoAtivo = await qrDAO.estaAtivo(codigo, transaction);
        if (qr.status_qr !== 'ativo') return { tipo: 'indisponivel' };

        if (!codigoAtivo && new Date(qr.data_expiracao) <= new Date()) {
            await transaction('tbl_qr_code')
                .where({ id: qr.id_qr_code, status: 'ativo' })
                .update({ status: 'expirado' });
            await qrDAO.registrarLeitura({
                qrId: qr.id_qr_code,
                userId,
                status: 'expirada',
            }, transaction);
            return { tipo: 'expirado' };
        }

        if (!codigoAtivo) return { tipo: 'indisponivel' };

        if (qr.status_entrega !== 'pendente') return { tipo: 'entrega_finalizada' };

        // Compara o ledger antes e depois do trigger para não repetir pontos antigos.
        const quantidadeAntes = await qrDAO.contarPontosCreditados(
            Number(qr.id_anunciante),
            Number(qr.id_categoria),
            transaction
        );

        await qrDAO.marcarComoUtilizado(qr.id_qr_code, transaction);
        await qrDAO.registrarLeitura({
            qrId: qr.id_qr_code,
            userId,
            status: 'valida',
        }, transaction);

        const quantidadeDepois = await qrDAO.contarPontosCreditados(
            Number(qr.id_anunciante),
            Number(qr.id_categoria),
            transaction
        );
        const pontos = quantidadeDepois > quantidadeAntes
            ? await qrDAO.buscarPontosCreditados(
                Number(qr.id_anunciante),
                Number(qr.id_categoria),
                transaction
            )
            : null;

        return {
            tipo: 'validado',
            idEntrega: Number(qr.id_entrega),
            pontos: Number(pontos?.qntd_pontos || 0),
        };
    });

    const errors = {
        nao_encontrado: [404, 'QR_NOT_FOUND', 'QR code não encontrado.'],
        nao_participante: [403, 'FORBIDDEN', 'Você não participa desta entrega.'],
        mesmo_usuario: [403, 'BILATERAL_CONFIRMATION_REQUIRED', 'A outra pessoa da entrega precisa validar o QR code.'],
        indisponivel: [409, 'QR_NOT_ACTIVE', 'Este QR code já foi utilizado ou cancelado.'],
        expirado: [410, 'QR_EXPIRED', 'Este QR code expirou. Gere um novo código.'],
        entrega_finalizada: [409, 'DELIVERY_NOT_PENDING', 'A entrega já foi finalizada.'],
    };

    if (resultado.tipo !== 'validado') {
        const [status, code, message] = errors[resultado.tipo];
        throw new AppError(message, status, code);
    }

    response.json({
        mensagem: 'Entrega confirmada.',
        id_entrega: resultado.idEntrega,
        pontos_creditados: resultado.pontos,
    });
};

module.exports = { gerarCodigo, validarCodigo };
