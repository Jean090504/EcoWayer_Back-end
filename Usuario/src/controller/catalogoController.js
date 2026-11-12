const catalogoDAO = require('../model/catalogoDAO');

exports.listarAnuncios = async (req, res) => {
  const anuncios = await catalogoDAO.listar(req.query.q, req.query.categoria);
  res.json({
    total: anuncios.length,
    anuncios: anuncios.map((anuncio) => ({
      id: anuncio.id,
      nome: anuncio.nome,
      descricao: anuncio.descricao,
      data_publicacao: anuncio.data_publicacao,
      imagem: anuncio.imagem_url || null,
      usuario: { id: anuncio.usuario_id, nome: anuncio.usuario_nome },
      categoria: { id: anuncio.categoria_id, nome: anuncio.categoria_nome, pontos: anuncio.categoria_pontos },
      modalidade: anuncio.modalidade_nome,
      condicao: anuncio.condicao_nome,
    })),
  });
};

exports.listarCategorias = async (_req, res) => {
  const categorias = await catalogoDAO.listarCategorias();
  res.json({ total: categorias.length, categorias });
};
