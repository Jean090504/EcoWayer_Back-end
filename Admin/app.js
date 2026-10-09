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
app.use('/v1/senai/locadora/tipo-categoria', cors(corsOptions), tipoCategoriaRouter)

const categoriaRouter = require('./routes/categoria.routes.js')     // Rotas Responsaveis pela gerencia CATEGORIA
app.use('/meraki/ecowayer/admin/categoria', cors(corsOptions), categoriaRouter)

const enderecoRouter = require('./routes/endereco.routes.js')   // Rotas Responsaveis pelo endereço
app.use('/meraki/ecowayer/admin/endereco', cors(corsOptions), enderecoRouter)

const pontoColetaRouter = require('./routes/ponto_coleta.routes.js') // Rotas Responseveis pelo PONTO DE COLETA
app.use('/meraki/ecowayer/admin/ponto-coleta', cors(corsOptions), pontoColetaRouter)

const materialAceitoRouter = require('./routes/material_aceito.routes.js')   // Rotas responsaveis pela gerencia de MATERIAL ACEITO
app.use('/meraki/ecowayer/admin/material-aceito', cors(corsOptions), materialAceitoRouter)
// ------------------------------------------------

const PORT = process.env.PORT || 8080
app.listen(PORT,function(){
console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})