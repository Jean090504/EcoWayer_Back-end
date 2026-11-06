const dao = require('../../model/DAO/usuario/usuario');
const guardarImagem = require('../../utils/guardar_imagem');
const { invalidRequest } = require('../../utils/usuario_helpers');

// Processa e salva uma nova foto de perfil.
const atualizarAvatar = async (request, response) => {
    if (!request.file) throw invalidRequest('Envie uma imagem no campo file.');

    const imageUrl = await guardarImagem(request.file.buffer, Number(request.auth.sub), 'avatar');
    await dao.updateAvatar(Number(request.auth.sub), imageUrl);

    response.json({ mensagem: 'Foto de perfil atualizada.', avatar: imageUrl });
};

module.exports = { atualizarAvatar };
