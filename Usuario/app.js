/**********************************
 * Autor:Maxwillian Santana (git:maxsz06)
 * Date: 06/out/2026
 * -> Arquivo responsavel por iniciar a api e gerenciar suas rotas
 *********************************/

require('dotenv').config()
const express = require("express")
const cors = require("cors")
const rateLimit = require('express-rate-limit')
const autenticacaoUsuario = require('./middleware/autenticacaoUsuario.js')
const app = express();

const origensPermitidas = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origem) => origem.trim()).filter(Boolean)
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origensPermitidas.includes(origin)) return callback(null, true)
        return callback(new Error('Origem não permitida pelo CORS.'))
    },
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"],
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use('/meraki/ecowayer/user', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use('/meraki/ecowayer/user', autenticacaoUsuario)

// ----------------- [ Rotas da API] --------------

const enderecoRouter = require('./routes/endereco.routes.js') // rotas responsaveis pelo endereco
app.use('/meraki/ecowayer/user/endereco', cors(corsOptions), enderecoRouter)

const emailRouter = require('./routes/email.routes.js') // rotas responsaveis pelo e-mail do usuario
app.use('/meraki/ecowayer/user/email', cors(corsOptions), emailRouter)

const telefoneRouter = require('./routes/telefone.routes.js') // rotas responsaveis pelo telefone do usuario
app.use('/meraki/ecowayer/user/telefone', cors(corsOptions), telefoneRouter)

const verificacaoRouter = require('./routes/verificacao.routes.js') // rotas responsaveis pelas configuracoes de verificacao
app.use('/meraki/ecowayer/user/verificacao', cors(corsOptions), verificacaoRouter)

const emailVerificacaoRouter = require('./routes/email_verificacao.routes.js') // vinculos e-mail x verificacao
app.use('/meraki/ecowayer/user/email_verificacao', cors(corsOptions), emailVerificacaoRouter) //att

const telefoneVerificacaoRouter = require('./routes/telefone_verificacao.routes.js') // vinculos telefone x verificacao
app.use('/meraki/ecowayer/user/telefone_verificacao', cors(corsOptions), telefoneVerificacaoRouter)

const contaRouter = require('./routes/conta.routes.js') // rotas responsaveis pela conta (credencial de login)
app.use('/meraki/ecowayer/user/conta', cors(corsOptions), contaRouter)

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

const voucherRouter = require('./routes/voucher.routes.js') // rotas responsaveis pelos vouchers
app.use('/meraki/ecowayer/user/voucher', cors(corsOptions), voucherRouter)

const voucherCatalogoRouter = require('./routes/voucher_catalogo.routes.js') // rotas responsaveis pelo catalogo de vouchers
app.use('/meraki/ecowayer/user/voucher_catalogo', cors(corsOptions), voucherCatalogoRouter)

const qrCodeVoucherRouter = require('./routes/qr_code_voucher.routes.js') // rotas responsaveis pelos vinculos QR Code x voucher
app.use('/meraki/ecowayer/user/qr_code_voucher', cors(corsOptions), qrCodeVoucherRouter)

const missaoRouter = require('./routes/missao.routes.js') // rotas responsaveis pelas missoes
app.use('/meraki/ecowayer/user/missao', cors(corsOptions), missaoRouter)

const usuarioMissaoRouter = require('./routes/usuario_missao.routes.js') // participacoes usuario x missao
app.use('/meraki/ecowayer/user/usuario_missao', cors(corsOptions), usuarioMissaoRouter)

const pontosRouter = require('./routes/pontos.routes.js') // registros de pontos do usuario
app.use('/meraki/ecowayer/user/pontos', cors(corsOptions), pontosRouter)

const insigniaRouter = require('./routes/insignia.routes.js') // rotas responsaveis pelas insignias
app.use('/meraki/ecowayer/user/insignia', cors(corsOptions), insigniaRouter)

const usuarioInsigniaRouter = require('./routes/usuario_insignia.routes.js') // associacao usuario x insignia
app.use('/meraki/ecowayer/user/usuario_insignia', cors(corsOptions), usuarioInsigniaRouter)

const entregaRouter = require('./routes/entrega.routes.js') // rotas responsaveis pelas entregas
app.use('/meraki/ecowayer/user/entrega', cors(corsOptions), entregaRouter)

const anuncioRouter = require('./routes/anuncio.routes.js') // rotas responsaveis pelos anuncios
app.use('/meraki/ecowayer/user/anuncio', cors(corsOptions), anuncioRouter)

const imagemAnuncioRouter = require('./routes/imagem_anuncio.routes.js') // Rotas responsaveis pelas imagens dos anuncios
app.use('/meraki/ecowayer/user/imagem_anuncio', cors(corsOptions), imagemAnuncioRouter)

const statusUsuarioRouter = require('./routes/status_usuario.routes.js') // Rotas responsaveis pelo status do usuario
app.use('/meraki/ecowayer/user/status_usuario', cors(corsOptions), statusUsuarioRouter)

const usuarioRouter = require('./routes/usuario.routes.js')   // Rotas responsaveis pelo usuario
app.use('/meraki/ecowayer/user/usuario', cors(corsOptions), usuarioRouter)

const conversaRouter = require('./routes/conversa.routes.js')     // Rotas responsaveis pela conversa
app.use('/meraki/ecowayer/user/conversa', cors(corsOptions), conversaRouter)

const mensagensRouter = require('./routes/mensagens.routes.js')   // Rotas responsaveis pelas mensagens
app.use('/meraki/ecowayer/user/mensagens', cors(corsOptions), mensagensRouter)

const notificacaoRouter = require('./routes/notificacao.routes.js')
app.use('/meraki/ecowayer/user/notificacao', cors(corsOptions), notificacaoRouter)

const negociacaoRouter = require('./routes/negociacao.routes.js') // rotas responsaveis pela negociacao
app.use('/meraki/ecowayer/user/negociacao',cors(corsOptions),negociacaoRouter)


const PORT = process.env.PORT || 8070
app.listen(PORT, function () {
    console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})
