/**********************************
 * Autor:Maxwillian Santana (git:maxsz06)
 * Date: 06/out/2026
 * -> Arquivo responsavel por iniciar a api e gerenciar suas rotas
 *********************************/

const express = require("express")
const cors = require("cors")
const app = express();

const corsOptions = {
    origin: "*",
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"],
}
app.use(cors(corsOptions))

// ----------------- [ Rotas da API] --------------

const administradorRouter = require('./routes/administrador.routes.js')   // Rotas Responsaveis pela gerencia de ADMIN
app.use('/meraki/ecowayer/admin/gerenciar', cors(corsOptions), administradorRouter)

const tipoCategoriaRouter = require('./routes/tipo_categoria.routes.js') // Rotas Responsaveis pela gerencia de TIPO CATEGORIA
app.use('/meraki/ecowayer/admin/tipo-categoria', cors(corsOptions), tipoCategoriaRouter)

const categoriaRouter = require('./routes/categoria.routes.js')     // Rotas Responsaveis pela gerencia CATEGORIA
app.use('/meraki/ecowayer/admin/categoria', cors(corsOptions), categoriaRouter)

const enderecoRouter = require('./routes/endereco.routes.js')   // Rotas Responsaveis pelo endereço
app.use('/meraki/ecowayer/admin/endereco', cors(corsOptions), enderecoRouter)

const pontoColetaRouter = require('./routes/ponto_coleta.routes.js') // Rotas Responseveis pelo PONTO DE COLETA
app.use('/meraki/ecowayer/admin/ponto-coleta', cors(corsOptions), pontoColetaRouter)

const materialAceitoRouter = require('./routes/material_aceito.routes.js')   // Rotas responsaveis pela gerencia de MATERIAL ACEITO
app.use('/meraki/ecowayer/admin/material-aceito', cors(corsOptions), materialAceitoRouter)

const statusUsuarioRouter = require('./routes/status_usuario.routes.js') /// Rotas responsaveis pelo Status do Usuario
app.use('/meraki/ecowayer/admin/status-usuario', cors(corsOptions), statusUsuarioRouter)

const generoRouter = require('./routes/genero.routes.js')   // Rotas resonsaveis pelo genero
app.use('/meraki/ecowayer/admin/genero', cors(corsOptions), generoRouter)
  
const tipoImagemRouter = require('./routes/tipo_imagem.routes.js') // Rotas responsaveis pelo tipo_imagem
app.use('/meraki/ecowayer/admin/tipo-imagem', cors(corsOptions), tipoImagemRouter)

const nivelImpactoRouter = require('./routes/nivel_impacto.routes.js') // Rotas Responsaveis pelo Usuario
app.use('/meraki/ecowayer/admin/nivel-impacto', cors(corsOptions), nivelImpactoRouter)

const imagemRouter = require('./routes/imagem.routes.js') // Rotas responsaveis pela imagem
app.use('/meraki/ecowayer/admin/imagem', cors(corsOptions), imagemRouter)

const usuarioRouter = require('./routes/usuario.routes.js') // Rotas responsaveis pelo o Usuario
app.use('/meraki/ecowayer/admin/usuario', cors(corsOptions), usuarioRouter)

const condicaoItemRouter = require('./routes/condicao_item.routes.js') // Rotas responsaveis pela condição do item
app.use('/meraki/ecowayer/admin/condicao-item', cors(corsOptions), condicaoItemRouter)

const anuncioRouter = require('./routes/anuncio.routes.js') // Rotas responsaveis pelos pontos
app.use('/meraki/ecowayer/admin/anuncio', cors(corsOptions), anuncioRouter)

const pontosRouter = require('./routes/pontos.routes.js')  // Rotas Responsaveis pelos Pontos
app.use('/meraki/ecowayer/admin/pontos', cors(corsOptions), pontosRouter)

const voucherRouter = require('./routes/voucher.routes.js') // Rotas Responsaveis pelo Voucher
app.use('/meraki/ecowayer/admin/voucher', cors(corsOptions), voucherRouter)

const insignaRouter = require('./routes/insigna.routes.js') // Rotas Responsaveis pelo Voucher
app.use('/meraki/ecowayer/admin/insigna', cors(corsOptions), insignaRouter)

const pagamentoRouter = require('./routes/pagamento.routes.js') // Rotas Responsaveis pelo pagamento
app.use('/meraki/ecowayer/admin/pagamento', cors(corsOptions), pagamentoRouter)

const conversaRouter = require('./routes/conversa.routes.js')     // Rotas Responsaveis pela conversa
app.use('/meraki/ecowayer/admin/conversa', cors(corsOptions), conversaRouter)

const mensagemRouter = require('./routes/mensagem.routes.js') // Rotas Responsaveis pelas mensagens
app.use('/meraki/ecowayer/admin/mensagem', cors(corsOptions), mensagemRouter)

const tipoDenunciaRouter = require('./routes/tipo_denuncia.routes.js')   // Rotas responsaveis pela gerencia de TIPO DE DENUNCIA
app.use('/meraki/ecowayer/admin/tipo-denuncia', cors(corsOptions), tipoDenunciaRouter)

const denunciaRouter = require('./routes/denuncia.routes.js') // Rotas responsaveis pela Denuncia
app.use('/meraki/ecowayer/admin/denuncia', cors(corsOptions), denunciaRouter)

const historicoAnuncioRouter = require('./routes/historico_anuncio.routes.js') //Rotas responsavieis pelo historico anuncio
app.use('/meraki/ecowayer/admin/historico-anuncio', cors(corsOptions), historicoAnuncioRouter)

const iaRouter = require('./routes/ia.routes.js') //Rotas responsaveis pela IA
app.use('/meraki/ecowayer/admin/ia', cors(corsOptions), iaRouter)

const datasetRouter = require('./routes/dataset.routes.js') //Rotas responsaveis pelo dataset
app.use('/meraki/ecowayer/admin/dataset', cors(corsOptions), datasetRouter)

const treinamentoIARouter = require('./routes/treinamento_ia.routes.js') //Rotas responsaveis pelo treinamento de IA
app.use('/meraki/ecowayer/admin/treinamento-ia', cors(corsOptions), treinamentoIARouter)

const alertasRouter = require('./routes/alertas.routes.js') //Rotas responsaveis pelos alertas
app.use('/meraki/ecowayer/admin/alertas', cors(corsOptions), alertasRouter)

const entregaRouter = require('./routes/entrega.routes.js') //Rotas responsaveis pelas entregas
app.use('/meraki/ecowayer/admin/entrega', cors(corsOptions), entregaRouter)

const historicoPagamentoRouter = require('./routes/historico_pagamento.routes.js') // Rotas responsaveis pelas rotas de pagamentos
app.use('/meraki/ecowayer/admin/historico-pagamento', cors(corsOptions), historicoPagamentoRouter)

const avaliacaoRouter = require('./routes/avaliacao.routes.js') // Rotas responsaveis pela avaliacao
app.use('/meraki/ecowayer/admin/avaliacao', cors(corsOptions), avaliacaoRouter)
// ------------------------------------------------

const PORT = process.env.PORT || 8080
app.listen(PORT,function(){
console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})