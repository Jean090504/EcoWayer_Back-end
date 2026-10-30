# EcoWayer API de Usuário

API Express para cadastro, autenticação, recuperação de senha e perfil, integrada ao MySQL `ecowayer_db`.

## Requisitos

- Node.js 20 ou superior e MySQL 8.
- Banco `ecowayer_db` criado com o DDL atual do EcoWayer e tabelas de referência populadas (`tbl_genero`, `tbl_status_usuario`, `tbl_nivel_impacto` e `tbl_tipo_imagem`).

## Inicialização

1. Copie `.env.example` para `.env` e configure o acesso ao MySQL e um `JWT_SECRET` aleatório com no mínimo 32 caracteres.
2. `npm install`
3. `npm run migrate:latest`
4. `npm run dev` (desenvolvimento) ou `npm start`.

O serviço escuta `PORT` (padrão 3000). `GET /health` verifica a disponibilidade. Os caminhos seguem a coleção Postman (`/auth/...` e `/users/...`).
Configure `NOTIFICATION_WEBHOOK_URL` para um endpoint HTTPS que aceite `POST` JSON com `{ contato, codigo, finalidade }` e encaminhe o OTP por e-mail ou SMS. Sem provedor, os códigos não são enviados e a resposta da rota informa isso; o código nunca é exibido em respostas ou logs. Não use esse modo para cadastro real.

## Rotas

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | `/auth/register` | Público |
| POST | `/auth/verify-email` | Público |
| POST | `/auth/verify-phone` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/forgot-password` | Público |
| POST | `/auth/reset-password` | Público |
| GET | `/users/me` | JWT |
| PUT | `/users/me` | JWT |
| PATCH | `/users/me/email` | JWT |
| PATCH | `/users/me/password` | JWT |
| POST | `/users/me/avatar` | JWT, multipart `avatar` |
| DELETE | `/users/me` | JWT |

O formato de cadastro acompanha a coleção Postman. Senhas precisam ter 10–128 caracteres, maiúscula, minúscula, número e símbolo. CPF é validado pelos dígitos verificadores. Após o cadastro, e-mail e telefone precisam ser confirmados antes do login. Os OTPs expiram em 10 minutos e aceitam até cinco tentativas.

Configure `GOOGLE_CLIENT_ID` com o ID OAuth Web usado pelo frontend. `POST /auth/google` recebe `{ "credential": "<ID token>" }`; o backend valida assinatura, expiração e audiência. Para uma conta nova, envie também `cpf`, `data_nascimento` (AAAA-MM-DD), `id_genero` e `telefone`, pois são campos obrigatórios no banco. A criação responde `202` e envia OTP ao telefone; após confirmar em `/auth/verify-phone`, repetir o login Google retorna o JWT. Contas existentes são localizadas pelo e-mail verificado do Google e precisam estar ativas e com telefone confirmado.

## Imagens

JPEG, PNG e WebP de até 5 MB são decodificados, redimensionados para no máximo 512×512 e armazenados como WebP. Configure `PUBLIC_BASE_URL` para gerar a URL pública; a pasta de uploads deve persistir entre reinicializações. Para múltiplas instâncias, substitua o armazenamento local por object storage.

## Escopo

Marketplace, anúncios, negociação, chat, gamificação, QR codes, vouchers e denúncias aparecem na coleção Postman, mas pertencem a outros módulos e não são registrados por este serviço. Endereço é recebido no cadastro e associado a `tbl_endereco_usuario`.
