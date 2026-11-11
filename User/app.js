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

const enderecoRouter = require('./routes/endereco.routes.js') // rotas responsaveis pelo endereco
app.use('/meraki/ecowayer/user/endereco', cors(corsOptions), enderecoRouter)

const tipoCategoriaRouter = require('./routes/tipo_categoria.routes.js') // rotas responsaveis pelo tipo de categoria
app.use('/meraki/ecowayer/user/tipo_categoria', cors(corsOptions), tipoCategoriaRouter)

const generoRouter = require('./routes/genero.routes.js') // rotas responsaveis pelo genero
app.use('/meraki/ecowayer/user/genero', cors(corsOptions), generoRouter)

const categoriaRouter = require('./routes/categoria.routes.js') // rotas responsaveis pela categoria
app.use('/meraki/ecowayer/user/categoria', cors(corsOptions), categoriaRouter)

const itemRouter = require('./routes/item.routes.js') // rotas responsaveis pelo item
app.use('/meraki/ecowayer/user/item', cors(corsOptions), itemRouter)

const pontoColetaRouter = require('./routes/ponto_coleta.routes.js') // rotas responsaveis pelo ponto de coleta
app.use('/meraki/ecowayer/user/ponto_coleta', cors(corsOptions), pontoColetaRouter)

const horarioPontoColetaRouter = require('./routes/horario_ponto_coleta.routes.js') // rotas responsaveis pelos horarios dos pontos de coleta
app.use('/meraki/ecowayer/user/horario_ponto_coleta', cors(corsOptions), horarioPontoColetaRouter)

const materialAceitoRouter = require('./routes/material_aceito.routes.js') // rotas responsaveis pelo material aceito
app.use('/meraki/ecowayer/user/material_aceito', cors(corsOptions), materialAceitoRouter)

const tipoImagemRouter = require('./routes/tipo_imagem.routes.js') // rotas responsaveis pelo tipo de imagem
app.use('/meraki/ecowayer/user/tipo_imagem', cors(corsOptions), tipoImagemRouter)

const nivelImpactoRouter = require('./routes/nivel_impacto.routes.js') // rotas responsaveis pelo nivel de impacto
app.use('/meraki/ecowayer/user/nivel_impacto', cors(corsOptions), nivelImpactoRouter)

const imagemRouter = require('./routes/imagem.routes.js') // rotas responsaveis pela imagem
app.use('/meraki/ecowayer/user/imagem', cors(corsOptions), imagemRouter)


const qrCodeRouter = require('./routes/qr_code.routes.js') // rotas responsaveis pelos QR Codes de entrega
app.use('/meraki/ecowayer/user/qr_code', cors(corsOptions), qrCodeRouter)

const qrCodeEntregaRouter = require('./routes/qr_code_entrega.routes.js') // rotas responsaveis pelos vinculos QR Code x entrega
app.use('/meraki/ecowayer/user/qr_code_entrega', cors(corsOptions), qrCodeEntregaRouter)

const leituraQrCodeRouter = require('./routes/leitura_qr_code.routes.js') // rotas responsaveis pelas leituras de QR Code
app.use('/meraki/ecowayer/user/leitura_qr_code', cors(corsOptions), leituraQrCodeRouter)

const qrCodeVoucherRouter = require('./routes/qr_code_voucher.routes.js') // rotas responsaveis pelos vinculos QR Code x voucher
app.use('/meraki/ecowayer/user/qr_code_voucher', cors(corsOptions), qrCodeVoucherRouter)

const entregaRouter = require('./routes/entrega.routes.js') // rotas responsaveis pelas entregas
app.use('/meraki/ecowayer/user/entrega', cors(corsOptions), entregaRouter)

const anuncioRouter = require('./routes/anuncio.routes.js') // rotas responsaveis pelos anuncios
app.use('/meraki/ecowayer/user/anuncio', cors(corsOptions), anuncioRouter)

const imagemAnuncioRouter = require('./routes/imagem_anuncio.routes.js') // rotas responsaveis pelas imagens dos anuncios
app.use('/meraki/ecowayer/user/imagem_anuncio', cors(corsOptions), imagemAnuncioRouter)

const statusUsuarioRouter = require('./routes/status_usuario.routes.js')
app.use('/meraki/ecowayer/user/status_usuario', statusUsuarioRouter)

const usuarioRouter = require('./routes/usuario.routes.js')   // Rotas responsaveis pelo usuario
app.use('/meraki/ecowayer/user/usuario', cors(corsOptions), usuarioRouter)

const conversaRouter = require('./routes/conversa.routes.js')     // Rotas responsaveis pela conversa
app.use('/meraki/ecowayer/user/conversa', cors(corsOptions), conversaRouter)

const mensagensRouter = require('./routes/mensagens.routes.js')   // Rotas responsaveis pelas mensagens
app.use('/meraki/ecowayer/user/mensagens', cors(corsOptions), mensagensRouter)

const PORT = process.env.PORT || 8070
app.listen(PORT, function () {
    console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})