const fs = require('fs')
const path = require('path')
const knex = require('knex')(require('../model/database_config_knex/knexFile.js').development)

// Anúncios fictícios para apresentação local. Nunca usar em produção como ofertas reais.
const anuncios = [
  { nome: 'Mesa lateral de madeira maciça', descricao: 'Mesa de apoio com uma gaveta e prateleira inferior. Estrutura firme; há marcas superficiais no tampo, visíveis nas fotos. Medidas aproximadas: 55 x 45 x 60 cm. Retirada combinada no bairro.', categoria: 'Móveis', modalidade: 'Venda', condicao: 'Bom', preco: 180, cidade: 'São Paulo', uf: 'SP', perfil: '390.533.447-05', foto: 'mesa-lateral.webp' },
  { nome: 'Bicicleta urbana com cestinha', descricao: 'Bicicleta de uso urbano, aro 26, com cesta dianteira. Pneus e freios em funcionamento; pintura com pequenos sinais de uso. Recomendo revisão antes de trajetos longos. Retirada em local público.', categoria: 'Bicicletas', modalidade: 'Venda', condicao: 'Bom', preco: 420, cidade: 'Campinas', uf: 'SP', perfil: '111.444.777-35', foto: 'bicicleta-urbana.webp' },
  { nome: 'Estante de madeira com cinco prateleiras', descricao: 'Estante desmontável para livros e objetos leves. Madeira preservada, com desgaste discreto nas bordas. Medidas aproximadas: 170 x 75 x 30 cm. Entrego desmontada; transporte por conta de quem retirar.', categoria: 'Móveis', modalidade: 'Venda', condicao: 'Bom', preco: 260, cidade: 'Curitiba', uf: 'PR', perfil: '529.982.247-25', foto: 'estante-madeira.webp' },
  { nome: 'Cafeteira elétrica com jarra térmica', descricao: 'Cafeteira elétrica usada e funcionando. Acompanha jarra, porta-filtro e cabo originais. Limpa e testada antes do anúncio. Troco por utensílios domésticos em bom estado.', categoria: 'Eletrodomésticos', modalidade: 'Troca', condicao: 'Bom', preco: null, cidade: 'Florianópolis', uf: 'SC', perfil: '168.995.350-09', foto: 'cafeteira.webp' },
  { nome: 'Par de mesas de cabeceira', descricao: 'Duas mesas de cabeceira de madeira clara, vendidas juntas. Gavetas abrem normalmente; uma peça apresenta risco pequeno na lateral. Medidas aproximadas de cada uma: 42 x 35 x 55 cm.', categoria: 'Móveis', modalidade: 'Venda', condicao: 'Bom', preco: 290, cidade: 'Belo Horizonte', uf: 'MG', perfil: '746.971.314-01', foto: 'criados-mudos.webp' },
  { nome: 'Carrinho infantil compacto', descricao: 'Carrinho dobrável para criança pequena, com cinto e rodas funcionando. Tecido higienizado; sinais normais de uso no apoio dos pés. Conferir medidas e adequação para a idade antes de usar.', categoria: 'Infantil', modalidade: 'Doação', condicao: 'Bom', preco: null, cidade: 'Santos', uf: 'SP', perfil: '935.411.347-80', foto: 'carrinho-bebe.webp' },
  { nome: 'Coleção de livros infantis ilustrados', descricao: 'Lote com seis livros de histórias infantis em capa dura. Páginas completas, sem rasgos; algumas capas têm marcas de manuseio. Troco por livros para leitores de 8 a 12 anos.', categoria: 'Livros', modalidade: 'Troca', condicao: 'Bom', preco: null, cidade: 'Niterói', uf: 'RJ', perfil: '276.532.146-90', foto: 'livros-infantis.webp' },
  { nome: 'Violão acústico com capa', descricao: 'Violão acústico de seis cordas acompanhado de capa simples. Braço íntegro e som regular; cordas usadas podem precisar de troca. Posso mostrar o instrumento em funcionamento na retirada.', categoria: 'Instrumentos musicais', modalidade: 'Venda', condicao: 'Bom', preco: 310, cidade: 'Recife', uf: 'PE', perfil: '813.267.504-53', foto: 'violao.webp' },
  { nome: 'Luminária de piso para sala', descricao: 'Luminária de piso com cúpula de tecido claro e interruptor no cabo. Funcionando com lâmpada LED padrão, não inclusa. Base estável; pequeno desgaste próximo ao soquete.', categoria: 'Casa e decoração', modalidade: 'Venda', condicao: 'Bom', preco: 145, cidade: 'Rio de Janeiro', uf: 'RJ', perfil: '452.391.870-88', foto: 'luminaria.webp' },
  { nome: 'Três plantas de interior em vasos', descricao: 'Conjunto de três plantas saudáveis em vasos de barro. Acompanha os vasos mostrados nas fotos. Preferem luz indireta e regas moderadas. Retirada presencial para evitar danos no transporte.', categoria: 'Plantas', modalidade: 'Doação', condicao: 'Excelente', preco: null, cidade: 'Porto Alegre', uf: 'RS', perfil: '704.182.563-90', foto: 'plantas.webp' }
]

// Conversas entre os perfis cadastrados no seed. Nenhum pedido ou entrega é criado.
const contatos = [
  ['Olá! A gaveta da mesa abre normalmente? Pode me passar as medidas?', 'Oi! Abre sim. Ela mede aproximadamente 55 x 45 x 60 cm e está disponível para retirada.'],
  ['Boa tarde! A bicicleta está disponível? Os freios precisam de algum ajuste?', 'Está disponível. Os freios funcionam, mas recomendo uma revisão antes de usar todos os dias.'],
  ['Olá, a estante pode ser desmontada para transportar?', 'Pode sim. Ela vai desmontada e as peças estão completas.'],
  ['Oi! Você aceitaria trocar a cafeteira por um jogo de panelas em bom estado?', 'Olá! Posso avaliar. Você consegue mandar fotos das panelas pelo chat?'],
  ['Boa tarde! As duas mesas são vendidas juntas? Há algum reparo necessário?', 'Sim, o valor é pelo par. Estão firmes; só há um pequeno risco em uma lateral.'],
  ['Olá! O carrinho ainda está disponível para doação? O cinto funciona?', 'Está disponível. O cinto e as rodas estão funcionando. Podemos combinar a retirada.'],
  ['Oi! Quais são os títulos dos livros? Estão com todas as páginas?', 'Olá! São seis livros infantis ilustrados, todos completos. Posso enviar a lista dos títulos.'],
  ['Boa noite! Posso ver o violão funcionando antes de decidir?', 'Claro. Podemos combinar um horário para você testar o instrumento pessoalmente.'],
  ['Olá, a luminária está funcionando? Qual é a altura aproximada?', 'Está funcionando. Mede cerca de 1,55 m e usa lâmpada LED comum.'],
  ['Oi! As plantas ainda estão disponíveis? Elas precisam de sol direto?', 'Estão disponíveis. Preferem luz indireta; podemos combinar um horário para retirada.']
]

const antigos = new Map([
  [1, 'Celular Samsung Galaxy S8 para peças'], [2, 'Notebook Dell Inspiron 15 funcionando'],
  [3, 'Garrafas de vidro âmbar (20 unidades)'], [4, 'Garrafas PET 2L limpas (50 unidades)'],
  [5, 'Caixas de papelão grandes'], [6, 'Óleo de fritura usado - 10 litros'],
  [7, 'Latas de alumínio prensadas - 8 kg'], [8, 'Teclado e mouse sem fio'],
  [9, 'Potes de margarina e sorvete'], [10, 'Revistas e jornais (30 kg)'],
  [11, 'iPhone 11 128GB com garantia'], [12, 'Potes de conserva com tampa'],
  [13, 'Fios de cobre e panelas velhas'], [14, 'Embalagens de shampoo e detergente'],
  [15, 'Óleo de cozinha usado - 5 litros'], [17, 'Celular'],
  [23, 'Garrafa Termica Stanley'], [24, 'Tijolo De Construção'], [52, 'Garrafas Pet 500ml']
])

async function prepararColunas() {
  if (!await knex.schema.hasColumn('tbl_anuncio', 'cidade')) await knex.schema.alterTable('tbl_anuncio', tabela => tabela.string('cidade', 100).nullable())
  if (!await knex.schema.hasColumn('tbl_anuncio', 'uf')) await knex.schema.alterTable('tbl_anuncio', tabela => tabela.string('uf', 2).nullable())
  if (!await knex.schema.hasColumn('tbl_anuncio', 'demonstracao')) await knex.schema.alterTable('tbl_anuncio', tabela => tabela.boolean('demonstracao').notNullable().defaultTo(false))
}

async function executar() {
  const aplicar = process.argv.includes('--apply')
  const pastaFotos = path.resolve(__dirname, '../catalogo-demo')
  for (const anuncio of anuncios) {
    if (!fs.existsSync(path.join(pastaFotos, anuncio.foto))) throw new Error(`Imagem ausente: ${anuncio.foto}`)
  }
  const perfis = await knex('tbl_usuario').whereIn('cpf', anuncios.map(item => item.perfil)).select('id', 'cpf')
  if (perfis.length !== 10) throw new Error('Os dez perfis de demonstração não foram encontrados. Execute o seed antes do catálogo.')
  const atuais = await knex('tbl_anuncio').whereIn('id', [...antigos.keys()]).select('id', 'nome', 'status')
  const ocultar = atuais.filter(item => antigos.get(item.id) === item.nome && item.status === 'ativo')
  console.log(`Prévia: ${anuncios.length} anúncios de demonstração em ${new Set(anuncios.map(item => item.cidade)).size} cidades; ${ocultar.length} anúncios antigos identificados para ocultação.`)
  if (!aplicar) { console.log('Para aplicar: npm run catalogo:demo -- --apply'); return }

  await prepararColunas()
  await knex.transaction(async trx => {
    const statusAtivo = await trx('tbl_status_usuario').where({ status: 'ativo' }).first('id')
    if (!statusAtivo) throw new Error('Status de usuário ativo ausente.')
    // Corrige somente a primeira importação do seed antigo; não reativa contas depois de uma desativação manual.
    const violaoExistente = await trx('tbl_anuncio').where({ demonstracao: 1, nome: 'Violão acústico com capa' }).first('id')
    if (!violaoExistente) await trx('tbl_usuario').where({ cpf: '813.267.504-53' }).update({ id_status_usuario: statusAtivo.id })
    const pni = await trx('tbl_genero').where({ sigla: 'PNI' }).first('id')
    if (pni) await trx('tbl_genero').where({ id: pni.id }).update({ nome: 'Prefiro não dizer' })
    else await trx('tbl_genero').insert({ nome: 'Prefiro não dizer', sigla: 'PNI' })

    let tipo = await trx('tbl_tipo_categoria').where({ nome: 'Reuso' }).first('id')
    if (!tipo) { const [id] = await trx('tbl_tipo_categoria').insert({ nome: 'Reuso' }); tipo = { id } }
    const categorias = new Map()
    for (const nome of new Set(anuncios.map(item => item.categoria))) {
      let categoria = await trx('tbl_categoria').where({ nome }).first('id')
      if (!categoria) {
        const [id] = await trx('tbl_categoria').insert({ nome, pontos: 0, id_tipo_categoria: tipo.id, cor: '#724BC2', status: 'ativo' })
        categoria = { id }
      }
      categorias.set(nome, categoria.id)
    }
    const modalidades = new Map((await trx('tbl_modalidade').select('id', 'nome')).map(item => [item.nome, item.id]))
    const condicoes = new Map((await trx('tbl_condicao_item').select('id', 'nome')).map(item => [item.nome, item.id]))
    const perfilPorCpf = new Map(perfis.map(item => [item.cpf, item.id]))
    const tipoImagem = await trx('tbl_tipo_imagem').where('tipo', 'Anúncio').first('id')
    if (!tipoImagem) throw new Error('Tipo de imagem de anúncio ausente.')

    for (const [id, nome] of antigos) await trx('tbl_anuncio').where({ id, nome, status: 'ativo' }).update({ status: 'excluido' })
    for (const [indice, item] of anuncios.entries()) {
      const dados = {
        nome: item.nome, descricao: item.descricao, id_usuario: perfilPorCpf.get(item.perfil),
        id_categoria: categorias.get(item.categoria), id_modalidade: modalidades.get(item.modalidade),
        id_condicao_item: condicoes.get(item.condicao), preco: item.preco,
        cidade: item.cidade, uf: item.uf, demonstracao: 1, status: 'ativo'
      }
      if (!dados.id_modalidade || !dados.id_condicao_item) throw new Error(`Modalidade ou condição ausente: ${item.nome}`)
      let existente = await trx('tbl_anuncio').where({ demonstracao: 1, nome: item.nome }).first('id')
      if (existente) await trx('tbl_anuncio').where({ id: existente.id }).update(dados)
      else { const [id] = await trx('tbl_anuncio').insert({ ...dados, data_publicacao: new Date(Date.now() - (indice + 3) * 3600000) }); existente = { id } }

      const url = `/catalogo-demo/${item.foto}`
      let imagem = await trx('tbl_imagem').where({ url }).first('id')
      if (!imagem) { const [id] = await trx('tbl_imagem').insert({ url, id_tipo_imagem: tipoImagem.id }); imagem = { id } }
      const vinculo = await trx('tbl_imagem_anuncio').where({ id_anuncio: existente.id, id_imagem: imagem.id }).first('id')
      if (!vinculo) await trx('tbl_imagem_anuncio').insert({ id_anuncio: existente.id, id_imagem: imagem.id, ordem: 1 })

      const interessado = perfilPorCpf.get(anuncios[(indice + 1) % anuncios.length].perfil)
      const conversa = await trx('tbl_conversa').where({ id_anuncio: existente.id, id_usuario: interessado }).first('id')
      if (!conversa) {
        const [idConversa] = await trx('tbl_conversa').insert({ id_anuncio: existente.id, id_usuario: interessado })
        const base = Date.now() - (indice + 2) * 3600000
        await trx('tbl_mensagens').insert([
          { texto: contatos[indice][0], envio: new Date(base), lida: 1, id_conversa: idConversa, id_remetente: interessado },
          { texto: contatos[indice][1], envio: new Date(base + 600000), lida: 1, id_conversa: idConversa, id_remetente: dados.id_usuario }
        ])
      }
    }
  })
  console.log('Catálogo vinculado aos perfis e conversas de teste. Nenhum pedido foi criado.')
}

executar().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => knex.destroy())
