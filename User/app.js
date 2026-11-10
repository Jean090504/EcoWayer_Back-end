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
app.use('/meraki/ecowayer/user/endereco',cors(corsOptions),enderecoRouter)

const tipoCategoriaRouter = require('./routes/tipo_categoria.routes.js') // rotas responsaveis pelo tipo de categoria
app.use('/meraki/ecowayer/user/tipo_categoria',cors(corsOptions),tipoCategoriaRouter)

const generoRouter = require('./routes/genero.routes.js') // rotas responsaveis pelo genero
app.use('/meraki/ecowayer/user/genero',cors(corsOptions),generoRouter)

const categoriaRouter = require('./routes/categoria.routes.js') // rotas responsaveis pela categoria
app.use('/meraki/ecowayer/user/categoria',cors(corsOptions),categoriaRouter)

const itemRouter = require('./routes/item.routes.js') // rotas responsaveis pelo item
app.use('/meraki/ecowayer/user/item',cors(corsOptions),itemRouter)

const pontoColetaRouter = require('./routes/ponto_coleta.routes.js') // rotas responsaveis pelo ponto de coleta
app.use('/meraki/ecowayer/user/ponto_coleta',cors(corsOptions),pontoColetaRouter)

const materialAceitoRouter = require('./routes/material_aceito.routes.js') // rotas responsaveis pelo material aceito
app.use('/meraki/ecowayer/user/material_aceito',cors(corsOptions),materialAceitoRouter)

const tipoImagemRouter = require('./routes/tipo_imagem.routes.js')   // Rotas responsaveis pelo tipo de imagem
app.use('/meraki/ecowayer/user/tipo-imagem', cors(corsOptions), tipoImagemRouter)

const nivelImpactoRouter = require('./routes/nivel_impacto.routes.js')   // Rotas responsaveis pelo nivel de impacto
app.use('/meraki/ecowayer/user/nivel-impacto', cors(corsOptions), nivelImpactoRouter)
// ------------------------------------------------

const PORT = process.env.PORT || 8070
app.listen(PORT,function(){
console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})
