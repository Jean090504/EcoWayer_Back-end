# EcoWayer API de Usuário

API de autenticação, perfil, anúncios, propostas, denúncias, notificações e chat em tempo real. A estrutura segue o padrão do módulo `Admin`: arquivos de rota em `routes/`, controllers agrupados por recurso e comandos de banco concentrados nos DAOs.

## Como iniciar no Windows

### 1. Criar e preencher o banco

1. Abra o MySQL Workbench e conecte ao MySQL local.
2. Execute [database/reference/ecowayer_db.sql](database/reference/ecowayer_db.sql) para criar o banco e as tabelas do EcoWayer.
3. Execute [database/reference/inserts_ecowayer_db.sql](database/reference/inserts_ecowayer_db.sql) para carregar os dados de referência.
4. Execute [database/reference/views_ecowayer_db.sql](database/reference/views_ecowayer_db.sql), [database/reference/functions_ecowayer_db.sql](database/reference/functions_ecowayer_db.sql) e [database/reference/triggers_ecowayer_db.sql](database/reference/triggers_ecowayer_db.sql) no MySQL Workbench.
5. Confirme que o banco se chama `ecowayer_db`.

Use os arquivos SQL entregues com o projeto. Se o nome tiver sufixo como `(1)`, selecione o arquivo com esse sufixo.

### 2. Instalar e configurar

Abra o PowerShell dentro da pasta `Usuario` e execute:

```powershell
Copy-Item .env.example .env
npm install
```

Edite `.env` e informe `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`. Configure `JWT_SECRET` com uma chave aleatória de pelo menos 32 caracteres. Para login Google, configure também `GOOGLE_CLIENT_ID`.

### 3. Aplicar as migrations

Ainda na pasta `Usuario`, execute:

```powershell
npm run db:migrate
```

As migrations adicionam senha e confirmação de contatos, coordenadas e preço de anúncios, além de negociação, notificações, denúncias de usuários, entregas, QR codes e catálogo de recompensas.

### 4. Iniciar a API

Para desenvolvimento:

```powershell
npm run dev
```

Para iniciar normalmente:

```powershell
npm start
```

O servidor inicia em `http://localhost:3000`. Abra `http://localhost:3000/health`; a resposta com `status: ok` confirma que a API está rodando. Use `Ctrl+C` para encerrar.

## Configurar o envio de OTP

Cadastro, confirmação de e-mail/telefone e recuperação de senha precisam enviar códigos de seis dígitos. Defina `NOTIFICATION_WEBHOOK_URL` para um webhook que receba `POST` JSON com `{ contato, codigo, finalidade }` e encaminhe o código por e-mail ou SMS. As notificações da plataforma ficam salvas no banco e não precisam desse webhook.

## Usar a coleção Postman

Importe [EcoWayer - Módulo Usuário.postman_collection.json](<EcoWayer - Módulo Usuário.postman_collection.json>). A coleção define `base_url` para `http://localhost:3000` e captura o `token_jwt` e os IDs retornados pelos pedidos. Faça o cadastro, confirme e-mail e telefone com os códigos realmente recebidos pelo webhook e depois execute o login. Os códigos de exemplo da coleção são ilustrativos. Os usuários de demonstração do SQL usam a tabela antiga `tbl_conta`; para testar esta API, cadastre uma nova conta em `/auth/register`.

Para testar uma negociação completa, use duas contas: a pessoa que cria a proposta não pode aceitá-la em nome da outra parte. Faça login com a conta que recebe a proposta para executar a aceitação e, em seguida, agende a entrega. O WebSocket também usa o JWT da conta que vai se conectar.

## Endpoints

As rotas privadas usam `Authorization: Bearer <token>`.

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/auth/register` | Público |
| POST | `/auth/verify-email` | Público |
| POST | `/auth/verify-phone` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/google` | Público; requer `GOOGLE_CLIENT_ID` |
| POST | `/auth/forgot-password` | Público |
| POST | `/auth/reset-password` | Público |
| GET, PUT | `/users/me` | Perfil autenticado |
| PATCH | `/users/me/email` | Perfil autenticado |
| PATCH | `/users/me/password` | Perfil autenticado |
| POST | `/users/me/avatar` | Perfil autenticado; multipart `file` |
| DELETE | `/users/me` | Perfil autenticado |
| POST | `/ads` | Criar anúncio; multipart `file` opcional |
| GET | `/ads` | Feed com filtros |
| GET | `/ads/:id` | Detalhes e imagens |
| PATCH | `/ads/:id/status` | Pausar, reativar ou encerrar anúncio |
| GET, POST | `/negotiations` | Consultar propostas ou enviar proposta/contraproposta |
| PATCH | `/negotiations/:id/status` | Aceitar ou recusar proposta |
| GET, POST | `/chat/conversations` | Listar ou iniciar conversa sobre anúncio |
| GET, POST | `/chat/conversations/:id/messages` | Histórico ou envio de mensagem |
| POST | `/reports` | Registrar denúncia; multipart `file` opcional |
| GET | `/notifications` | Listar notificações; use `?nao_lidas=true` para filtrar |
| PATCH | `/notifications/:id/read` | Marcar uma notificação como lida |
| PATCH | `/notifications/read-all` | Marcar todas como lidas |
| GET | `/points/balance` | Consultar saldo de pontos válido |
| POST | `/deliveries` | Agendar entrega para uma negociação aceita |
| POST | `/qrcode/generate` | Gerar QR code para uma entrega pendente |
| POST | `/qrcode/validate` | Confirmar entrega e creditar pontos |
| GET | `/rewards` | Listar vouchers disponíveis no catálogo |
| POST | `/rewards/:id/redeem` | Resgatar voucher do catálogo usando pontos |

### Chat por WebSocket

Conecte em `ws://localhost:3000/chat/ws`. Nos primeiros cinco segundos, envie `{"tipo":"autenticar","token":"JWT"}`. Depois, envie `{"tipo":"entrar_conversa","id_conversa":1}` para entrar numa conversa e `{"tipo":"mensagem","id_conversa":1,"texto":"Olá"}` para enviar. O servidor grava a mensagem no MySQL antes de transmitir aos participantes. Novas mensagens também geram uma notificação no banco.

## Filtros e regras principais

- O feed aceita `modalidade`, `id_categoria` e `distancia_km`.
- O filtro `modalidade` compara o nome cadastrado no banco. Com os inserts fornecidos, use `Entrega em ponto de coleta`, `Coleta agendada` ou `Entrega por transportadora`; o exemplo `Venda` da coleção não existe nesses dados de referência.
- O filtro por distância exige latitude e longitude no endereço do usuário e nos endereços dos anunciantes. Essas coordenadas são opcionais no cadastro.
- Senhas precisam ter 10–128 caracteres, com maiúscula, minúscula, número e símbolo. CPF é validado pelos dígitos verificadores.
- OTP expira em 10 minutos e permite até cinco tentativas.
- Anúncios e denúncias aceitam JPEG, PNG ou WebP de até 5 MB; imagens são convertidas para WebP e servidas a partir de `/uploads`.
- Propostas pertencem à conversa do anúncio. Apenas a outra parte pode aceitar ou recusar uma proposta pendente.
- A negociação aceita precisa ser agendada em `/deliveries` antes de gerar um QR code. O código expira em 24 horas por padrão; ajuste `QR_CODE_TTL_HOURS` se necessário.
- A validação do QR code deve ser feita pela outra pessoa da entrega. A tabela de catálogo é criada pela migration e inclui um voucher de exemplo de 15 pontos.
- O modelo Workbench sincronizado é uma cópia do modelo lógico recebido e inclui as tabelas e relações das migrations. Para regenerá-lo após mudar o esquema, rode `python database/reference/sync_mwb_model.py` na pasta `Usuario`.

## Erros comuns

- **Access denied:** confira usuário e senha do MySQL no `.env`.
- **ECONNREFUSED:** inicie o MySQL e revise `DB_HOST` e `DB_PORT`.
- **Dados de referência ausentes:** execute os inserts base antes de testar cadastro e anúncios.
- **OTP não chega:** configure um webhook em `NOTIFICATION_WEBHOOK_URL`.
- **Filtro de distância indisponível:** informe latitude e longitude válidas nos endereços.
