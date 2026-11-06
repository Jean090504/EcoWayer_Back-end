const database = require('../../../database/database');

// Salva a denúncia e seus vínculos com anúncio, usuário e imagem.
const tipoExiste = (id, connection = database) => connection('tbl_tipo_denuncias').where({ id }).first();

const criar = async ({ description, typeId, reporterId, adId, reportedUserId, evidenceUrl }, connection) => {
    const [reportId] = await connection('tbl_denuncias').insert({
        descricao: description,
        id_tipo_denuncias: typeId,
        id_denunciante: reporterId,
    });

    if (adId) await connection('tbl_denuncias_anuncio').insert({ id_denuncias: reportId, id_anuncio: adId });
    if (reportedUserId) await connection('tbl_denuncias_usuario').insert({ id_denuncias: reportId, id_usuario: reportedUserId });

    if (evidenceUrl) {
        const imageType = await connection('tbl_tipo_imagem').select('id').where('tipo', 'Denúncia').first();
        if (!imageType) throw new Error('Tipo de imagem "Denúncia" não cadastrado.');
        const [imageId] = await connection('tbl_imagem').insert({ url: evidenceUrl, id_tipo_imagem: imageType.id });
        await connection('tbl_imagem_denuncias').insert({ id_imagem: imageId, id_denuncias: reportId });
    }

    return reportId;
};

module.exports = { tipoExiste, criar };
