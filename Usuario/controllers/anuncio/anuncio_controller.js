const dao = require('../../model/DAO/anuncio/anuncio');
const userDAO = require('../../model/DAO/usuario/usuario');
const database = require('../../database/database');
const AppError = require('../../utils/AppError');
const guardarImagem = require('../../utils/guardar_imagem');

const erroValidacao = (message) => new AppError(message, 400, 'VALIDATION_ERROR');

// Usa a função de distância que acompanha o banco.
const calcularDistanciaKm = async (origem, destino) => {
    const [rows] = await database.raw(
        'SELECT fn_calcular_distancia_km(?, ?, ?, ?) AS distancia_km',
        [origem.latitude, origem.longitude, destino.latitude, destino.longitude]
    );
    return Number(rows[0]?.distancia_km || 0);
};

// Valida os dados e publica um anúncio.
const criarAnuncio = async (request, response) => {
    const nome = String(request.body.nome || '').trim();
    const descricao = String(request.body.descricao || '').trim();
    const idCategoria = Number(request.body.id_categoria);
    const idModalidade = Number(request.body.id_modalidade);
    const idCondicao = request.body.id_condicao_item
        ? Number(request.body.id_condicao_item)
        : null;
    const valor = Number(request.body.valor);

    // Confere os campos do anúncio antes de consultar o banco.
    if (nome.length < 2 || nome.length > 100 || !Number.isFinite(valor) || valor < 0) {
        throw erroValidacao('Informe nome e valor válido para o anúncio.');
    }
    if (!Number.isInteger(idCategoria) || !Number.isInteger(idModalidade)) {
        throw erroValidacao('Categoria ou modalidade inválida.');
    }

    const categoriaExiste = await dao.existeReferencia('tbl_categoria', idCategoria);
    const modalidadeExiste = await dao.existeReferencia('tbl_modalidade', idModalidade);
    if (!categoriaExiste || !modalidadeExiste) {
        throw erroValidacao('Categoria ou modalidade não encontrada.');
    }

    // Usa a condição padrão quando ela não vier na requisição.
    const condicao = idCondicao
        ? await dao.existeReferencia('tbl_condicao_item', idCondicao)
        : await database('tbl_condicao_item').where('nome', 'Usado').first();
    if (!condicao) throw erroValidacao('Condição do item não encontrada.');

    // Salva a imagem antes de registrar o anúncio.
    const urlImagem = request.file
        ? await guardarImagem(request.file.buffer, Number(request.auth.sub), 'anuncio')
        : null;

    // Salva o anúncio e a imagem juntos para evitar dados incompletos.
    const idAnuncio = await userDAO.transaction((transaction) => dao.criar({
        nome,
        descricao,
        valor,
        id_usuario: Number(request.auth.sub),
        id_categoria: idCategoria,
        id_modalidade: idModalidade,
        id_condicao_item: idCondicao || condicao.id,
    }, urlImagem, transaction));

    const anuncio = await dao.buscarPorId(idAnuncio);
    response.status(201).json({ mensagem: 'Anúncio criado.', anuncio });
};

// Lista anúncios ativos e aplica os filtros solicitados.
const listarAnuncios = async (request, response) => {
    const idCategoria = request.query.id_categoria
        ? Number(request.query.id_categoria)
        : null;
    const distanciaMaxima = request.query.distancia_km
        ? Number(request.query.distancia_km)
        : null;

    if (idCategoria !== null && (!Number.isInteger(idCategoria) || idCategoria < 1)) {
        throw erroValidacao('Categoria inválida.');
    }
    if (distanciaMaxima !== null && (!Number.isFinite(distanciaMaxima) || distanciaMaxima <= 0 || distanciaMaxima > 500)) {
        throw erroValidacao('Distância inválida.');
    }

    // Busca coordenadas do usuário apenas quando há filtro por distância.
    let coordenadasOrigem = null;
    if (distanciaMaxima !== null) {
        coordenadasOrigem = await userDAO.getCoordinates(Number(request.auth.sub));
        if (!coordenadasOrigem) {
            throw new AppError(
                'Cadastre latitude e longitude no seu endereço para filtrar por distância.',
                422,
                'LOCATION_REQUIRED'
            );
        }
    }

    const anuncios = await dao.listarAtivos({
        id_categoria: idCategoria,
        modalidade: request.query.modalidade,
    });

    // Calcula e aplica o limite de distância quando solicitado.
    const anunciosComDistancia = await Promise.all(anuncios.map(async (anuncio) => {
        if (!coordenadasOrigem) return anuncio;

        const coordenadasAnunciante = await dao.buscarCoordsDoAnunciante(anuncio.id_usuario);
        if (!coordenadasAnunciante) return null;

        const distanciaKm = await calcularDistanciaKm(coordenadasOrigem, coordenadasAnunciante);
        return {
            ...anuncio,
            distancia_km: distanciaKm,
        };
    }));

    const resultado = anunciosComDistancia.filter((anuncio) => (
        anuncio && (distanciaMaxima === null || anuncio.distancia_km <= distanciaMaxima)
    ));
    response.json({ count: resultado.length, anuncios: resultado });
};

// Mostra os detalhes de um anúncio e suas imagens.
const buscarAnuncio = async (request, response) => {
    const ad = await dao.buscarPorId(Number(request.params.id));
    const status = ad ? await dao.buscarStatus(ad.id) : null;
    if (!ad || status === 'apagado' || (status !== 'ativo' && Number(ad.id_usuario) !== Number(request.auth.sub))) {
        throw new AppError('Anúncio não encontrado.', 404, 'AD_NOT_FOUND');
    }
    // Retorna também as imagens relacionadas ao anúncio.
    const images = await database('tbl_imagem_anuncio as link')
        .join('tbl_imagem as image', 'image.id', 'link.id_imagem')
        .select('image.url')
        .where('link.id_anuncio', ad.id);
    response.json({ anuncio: { ...ad, imagens: images.map((image) => image.url) } });
};

// Altera o status de um anúncio pertencente ao usuário autenticado.
const alterarStatus = async (request, response) => {
    const idAnuncio = Number(request.params.id);
    const anuncio = await dao.buscarPorId(idAnuncio);
    if (!anuncio) throw new AppError('Anúncio não encontrado.', 404, 'AD_NOT_FOUND');
    if (Number(anuncio.id_usuario) !== Number(request.auth.sub)) {
        throw new AppError('Você não pode alterar este anúncio.', 403, 'FORBIDDEN');
    }

    const status = String(request.body.status || '');
    if (!['ativo', 'desativado', 'apagado'].includes(status)) {
        throw erroValidacao('Status deve ser ativo, desativado ou apagado.');
    }

    await dao.atualizarStatus(idAnuncio, status, String(request.body.motivo || '').slice(0, 1000));
    response.json({ mensagem: 'Status do anúncio atualizado.', id_anuncio: idAnuncio, status });
};

module.exports = { criarAnuncio, listarAnuncios, buscarAnuncio, alterarStatus };
