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
// ------------------------------------------------

const PORT = process.env.PORT || 8080
app.listen(PORT,function(){
console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})