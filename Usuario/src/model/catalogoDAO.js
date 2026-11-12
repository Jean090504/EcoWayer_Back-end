const db = require('../../database/database');

const baseQuery = (query = '', categoria = '') => {
  const busca = String(query || '').trim();
  const builder = db('tbl_anuncio as a')
    .join('tbl_usuario as u', 'u.id', 'a.id_usuario')
    .join('tbl_categoria as c', 'c.id', 'a.id_categoria')
    .join('tbl_modalidade as m', 'm.id', 'a.id_modalidade')
    .join('tbl_condicao_item as ci', 'ci.id', 'a.id_condicao_item')
    .leftJoin('tbl_imagem as im', 'im.id', 'u.id_imagem')
    .select(
      'a.id', 'a.nome', 'a.descricao', 'a.data_publicacao',
      'u.id as usuario_id', 'u.nome as usuario_nome', 'im.url as imagem_url',
      'c.id as categoria_id', 'c.nome as categoria_nome', 'c.pontos as categoria_pontos',
      'm.nome as modalidade_nome', 'ci.nome as condicao_nome'
    )
    .orderBy('a.id', 'desc');

  if (busca) {
    builder.where((where) => where
      .where('a.nome', 'like', `%${busca}%`)
      .orWhere('a.descricao', 'like', `%${busca}%`)
      .orWhere('c.nome', 'like', `%${busca}%`));
  }

  if (String(categoria || '').trim()) builder.where('c.nome', String(categoria).trim());

  return builder;
};

exports.listar = (query, categoria) => baseQuery(query, categoria);
exports.listarCategorias = () => db('tbl_categoria')
  .select('id', 'nome', 'pontos', 'img', 'cor')
  .where('status', 'ativo')
  .orderBy('nome', 'asc');
