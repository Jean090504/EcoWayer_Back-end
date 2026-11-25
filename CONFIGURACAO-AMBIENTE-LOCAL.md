# EcoWayer — configuração do ambiente

Este guia contém **modelos sem credenciais**. Os valores reais ficam somente nos arquivos locais `.env` e `local.properties`, ignorados pelo Git. Não copie senhas, tokens ou chaves privadas para este documento.

## Arquivos de configuração

Crie cada arquivo local a partir do modelo correspondente. Os cinco `.env` locais e o `local.properties` do Android já estão configurados na pasta TCC desta máquina; os modelos servem para novas instalações e para o servidor.

| Serviço | Arquivo local (não versionado) | Modelo no GitHub | Porta local |
|---|---|---|---:|
| Backend Admin | `EcoWayer_Back-end/Admin/.env` | [Admin/.env.example](./Admin/.env.example) | 8080 |
| Backend Usuario | `EcoWayer_Back-end/Usuario/.env` | [Usuario/.env.example](./Usuario/.env.example) | 3000 |
| Backend IA | `EcoWayer_Back-end/ia_agent/.env` | [ia_agent/.env.example](./ia_agent/.env.example) | 3333 |
| Frontend Admin | `EcoWayer_Front-end/front-adm/.env` | [front-adm/.env.example](https://github.com/Jean090504/EcoWayer_Front-end/blob/main/front-adm/.env.example) | 5174 |
| Frontend Usuario | `EcoWayer_Front-end/Front_Usuario/.env` | [Front_Usuario/.env.example](https://github.com/Jean090504/EcoWayer_Front-end/blob/main/Front_Usuario/.env.example) | 5173 |
| Android | `EcoWayer_Mobile/local.properties` | [local.properties.example](https://github.com/Jean090504/EcoWayer_Mobile/blob/main/local.properties.example) | — |

### Backend Admin — `.env`

```dotenv
NODE_ENV=development
PORT=8080
DB_HOST=seu-servidor.mysql.database.azure.com
DB_PORT=3306
DB_USER=seu-usuario
DB_PASSWORD=
DB_NAME=ecowayer_db
JWT_SECRET=
JWT_EXPIRES_IN=1h
FRONTEND_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
AI_AGENT_URL=http://localhost:3333/api/v1/ai
AI_SECRET_TOKEN=
GOOGLE_MAPS_API_KEY=
```

### Backend Usuario — `.env`

```dotenv
NODE_ENV=development
PORT=3000
DB_HOST=seu-servidor.mysql.database.azure.com
DB_PORT=3306
DB_USER=seu-usuario
DB_PASSWORD=
DB_NAME=ecowayer_db
JWT_SECRET=
JWT_EXPIRES_IN=1h
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AI_AGENT_URL=http://localhost:3333/api/v1/ai
AI_SECRET_TOKEN=
GOOGLE_MAPS_API_KEY=
CLOUDINARY_CLOUD_NAME=
MP_APP_ID=3328498013279371
MP_ACCESS_TOKEN=
MP_TEST_MODE=0
MP_BACKEND_URL=http://localhost:3000
MP_FRONTEND_URL=http://localhost:5173
```

Use em `MP_ACCESS_TOKEN` apenas o token de **teste** da [aplicação EcoWayer TCC Testes](https://www.mercadopago.com.br/developers/panel/app/3328498013279371/credentials/sandbox). Para testar o checkout localmente, altere `MP_TEST_MODE=1` e `VITE_MP_TEST_MODE=1` no frontend Usuario. O checkout de demonstração é desativado pelo backend em `NODE_ENV=production`.

### Backend IA — `.env`

```dotenv
NODE_ENV=development
PORT=3333
DB_HOST=seu-servidor.mysql.database.azure.com
DB_PORT=3306
DB_USER=seu-usuario
DB_PASS=
DB_NAME=ecowayer_db
DB_CONNECTION_LIMIT=10
AI_SECRET_TOKEN=
AI_TIMEOUT_MS=1500
MAX_FILE_SIZE_BYTES=10485760
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-lite-latest
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`DB_PASS` é usado somente no agente IA; os outros backends usam `DB_PASSWORD`. Configure o **mesmo** `AI_SECRET_TOKEN` nos três backends. Use `JWT_SECRET` distinto para Admin e Usuario. Os backends ativam TLS com verificação de certificado para hosts MySQL da Azure.

### Frontend Admin — `.env`

```dotenv
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
VITE_MAPBOX_TOKEN=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Frontend Usuario — `.env`

```dotenv
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_MP_TEST_MODE=0
```

Variáveis `VITE_` são incluídas no código enviado ao navegador. Use nelas somente identificadores e chaves públicas com restrições de domínio; nunca tokens privados ou senhas.

### Android — `local.properties`

```properties
GOOGLE_MAPS_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=
API_BASE_URL=http://10.0.2.2:3000/meraki/ecowayer/
DEV_AUTO_LOGIN=false
DEV_AUTO_LOGIN_EMAIL=
DEV_AUTO_LOGIN_PASSWORD=
```

`10.0.2.2` acessa o computador a partir do emulador Android. Para um dispositivo físico, use o endereço alcançável do backend; para release, `API_BASE_URL` precisa ser HTTPS. Deixe `DEV_AUTO_LOGIN=false` e não grave senha no APK.

## Iniciar um serviço por vez

Em cada terminal, entre na pasta do serviço e execute o comando correspondente. Instale dependências com `npm ci` na primeira execução ou após atualizar o `package-lock.json`.

| Pasta | Instalação / compilação | Execução |
|---|---|---|
| `EcoWayer_Back-end/Admin` | `npm ci` | `npm start` |
| `EcoWayer_Back-end/Usuario` | `npm ci` | `node app.js` |
| `EcoWayer_Back-end/ia_agent` | `npm ci` e `npm run build` | `npm start` |
| `EcoWayer_Front-end/Front_Usuario` | `npm ci` | `npm run dev` |
| `EcoWayer_Front-end/front-adm` | `npm ci` | `npm run dev` |

O frontend Admin usa a porta **5174**; o frontend Usuario, **5173**. Em um servidor, configure as URLs e origens reais nos ambientes de cada serviço. Os frontends Vite devem ser compilados com `npm run build` e servidos por hospedagem estática; `npm run dev` é para desenvolvimento. Os arquivos `.env` do servidor são configurados nele e nunca enviados ao GitHub.

O [guia do Mercado Pago](./Usuario/MERCADO-PAGO-TESTE.md) descreve o teste do pagamento. Ele ainda não registra pedidos, não divide o valor com anunciantes e não deve ser usado para vendas reais.
