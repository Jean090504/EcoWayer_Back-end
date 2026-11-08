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

// ------------------------------------------------

const PORT = process.env.PORT || 8070
app.listen(PORT,function(){
console.log(`API DA LOCADORA FUNCIONANDO EM http://localhost:${PORT} E AGUARDANDO NOVAS REQUISIÇÕES...`);
})
