const dao = require('../../model/DAO/denuncia/denuncia');
const adDAO = require('../../model/DAO/anuncio/anuncio');
const userDAO = require('../../model/DAO/usuario/usuario');
const guardarImagem = require('../../utils/guardar_imagem');
const AppError = require('../../utils/AppError');

// Registra denúncia de anúncio ou de usuário.
const criarDenuncia = async (request, response) => {
    const typeId = Number(request.body.id_tipo_denuncias);
    const adId = request.body.id_anuncio ? Number(request.body.id_anuncio) : null;
    const reportedUserId = request.body.id_usuario ? Number(request.body.id_usuario) : null;
    const reporterId = Number(request.auth.sub);
    const description = String(request.body.descricao || 'Denúncia enviada pelo usuário.').trim();

    if (
        !Number.isInteger(typeId) ||
        typeId < 1 ||
        description.length > 5000 ||
        (!adId && !reportedUserId)
    ) {
        throw new AppError(
            'Informe o tipo, a descrição e um anúncio ou usuário para denunciar.',
            400,
            'VALIDATION_ERROR'
        );
    }
    if (!(await dao.tipoExiste(typeId))) {
        throw new AppError('Tipo de denúncia não encontrado.', 400, 'INVALID_REPORT_TYPE');
    }
    if (adId && !(await adDAO.buscarPorId(adId))) {
        throw new AppError('Anúncio não encontrado.', 404, 'AD_NOT_FOUND');
    }
    if (reportedUserId) {
        if (reportedUserId === reporterId) {
            throw new AppError('Não é possível denunciar a própria conta.', 400, 'SELF_REPORT');
        }
        if (!(await userDAO.findById(reportedUserId))) {
            throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
        }
    }

    // Guarda a imagem de evidência, se foi enviada.
    const evidenceUrl = request.file
        ? await guardarImagem(request.file.buffer, reporterId, 'denuncia')
        : null;

    // Registra a denúncia e seus vínculos em uma transação.
    const reportId = await userDAO.transaction((transaction) => dao.criar({
        description,
        typeId,
        reporterId,
        adId,
        reportedUserId,
        evidenceUrl,
    }, transaction));

    response.status(201).json({ mensagem: 'Denúncia registrada.', id_denuncia: reportId });
};

module.exports = { criarDenuncia };
