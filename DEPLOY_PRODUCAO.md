# Publicação do EcoWayer

> Para a instalação atual de homologação na Azure, consulte [DEPLOY_TCC_AZURE.md](./DEPLOY_TCC_AZURE.md). As instruções abaixo descrevem uma implantação futura de produção e não representam a configuração atual do TCC.

Os três repositórios ficam lado a lado no desenvolvimento. A publicação usa cinco serviços e o app Android:

| Componente | Tipo sugerido | Comando/saída |
| --- | --- | --- |
| `Front_Usuario` | Azure Static Web Apps | `npm ci && npm run build`, pasta `dist` |
| `front-adm` | Azure Static Web Apps | `npm ci && npm run build`, pasta `dist` |
| `Usuario` | Azure App Service Node 22 | `npm start`, `/health` |
| `Admin` | Azure App Service Node 22 | `npm start`, `/health` |
| `ia_agent` | Azure App Service Node 22 | `npm run build && npm start`, `/health` |
| Android | Google Play | AAB assinado; API HTTPS compartilhada com o site |

O banco MySQL da Azure já existente continua único. Faça backup antes de aplicar migrações. Configure acesso à rede apenas para os serviços que precisam do banco, com TLS. Não execute o script `Usuario/scripts/atualizarCatalogoDemo.js` no ambiente público.

## Configuração dos serviços

1. Crie as três aplicações Node, os dois Static Web Apps e os endereços HTTPS. Configure Node 22 e o comando inicial de cada serviço. O App Service fornece `PORT` automaticamente.
2. Configure as variáveis de cada serviço a partir de `Admin/.env.example`, `Usuario/.env.example` e `ia_agent/.env.example` nas configurações privadas da plataforma. Em produção use `NODE_ENV=production`; não publique `.env`.
3. Coloque as URLs HTTPS dos dois sites em `FRONTEND_ORIGINS` dos backends. Configure `AI_AGENT_URL` para a URL interna/pública HTTPS do agente e o mesmo `AI_SECRET_TOKEN` nos três serviços.
4. Configure a conexão MySQL de cada serviço e verifique `/health`. Para cadastro, preencha SMTP e Twilio no serviço Usuário; sem esses fornecedores o envio de códigos responde 503.
5. Aponte `VITE_API_URL` de cada site para seu backend antes do build. Variáveis `VITE_*` são incorporadas ao JavaScript público; nunca coloque senhas, tokens privados ou segredos nelas.
6. Migre o banco uma vez a partir de `Usuario`: `npm run migrate:pedidos` e `npm run migrate:contato`. Use uma cópia de staging para verificar o esquema antes da produção.
7. Fotos de anúncios em `Usuario/uploads/anuncios` precisam de armazenamento persistente ou migração para Cloudinary. Uma instância nova do App Service não preserva arquivos locais de publicação de maneira confiável para múltiplas instâncias. Confira também os links de imagens já gravados no banco.

## Pagamentos

- Ambiente de teste: `NODE_ENV=development`, `MP_TEST_MODE=1`, token de vendedor de teste e `VITE_MP_TEST_MODE=1` no site. Nunca exponha esse modo em produção.
- Produção com a EcoWayer como recebedora: `NODE_ENV=production`, `MP_TEST_MODE=0`, `MP_LIVE_ENABLED=1`, `MP_SETTLEMENT_MODE=platform`, token real dessa conta, `MP_BACKEND_URL` e `MP_FRONTEND_URL` HTTPS, e `MP_WEBHOOK_SECRET` válido. O site usa `VITE_MP_CHECKOUT_ENABLED=1` somente após validar o checkout e o webhook. Sem esses requisitos, a API rejeita a criação de pedidos.
- Registre `https://<API-USUARIO>/mercadopago/webhook` no painel Mercado Pago. Verifique assinatura, retorno, pagamento aprovado, recusado, estorno e geração do QR antes de abrir para usuários.
- O checkout atual usa uma única conta recebedora. Para um marketplace em que cada vendedor recebe diretamente, é obrigatório integrar o OAuth/checkout de marketplace e o repasse correspondente; **não ative `MP_LIVE_ENABLED`** com uma conta central antes de definir esse fluxo financeiro.
- Anúncios marcados como `demonstracao` não podem receber pagamentos em produção. Remova conteúdo simulado do catálogo público antes do lançamento.

## GitHub Actions

Os workflows fazem verificação a cada push. Para habilitar deploy, configure os itens abaixo e depois defina `AZURE_DEPLOY_ENABLED=true` como variável dos dois repositórios web.

Backend, segredos: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Configure OIDC/federated credential no Azure para este repositório. Variáveis: `AZURE_ADMIN_APP_NAME`, `AZURE_USUARIO_APP_NAME`, `AZURE_IA_APP_NAME`. Os segredos de runtime ficam no App Service, não no GitHub.

Frontend, segredos: `AZURE_SWA_USUARIO_TOKEN`, `AZURE_SWA_ADMIN_TOKEN`. Variáveis: `VITE_USER_API_URL`, `VITE_ADMIN_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`, `VITE_MAPBOX_TOKEN`, `VITE_MP_CHECKOUT_ENABLED`. Restrinja as chaves públicas de mapas aos domínios autorizados.

## Android

Defina o identificador definitivo do aplicativo antes da primeira publicação. Configure `API_BASE_URL` como `https://<API-USUARIO>/meraki/ecowayer/` e uma chave Maps Android válida para o pacote e certificado de assinatura da Play. Builds de release recusam uma URL HTTP.

Para gerar o AAB no GitHub, configure `ANDROID_RELEASE_ENABLED=true`; segredos `ANDROID_UPLOAD_KEYSTORE_B64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`; variáveis `ANDROID_API_BASE_URL`, `ANDROID_GOOGLE_MAPS_API_KEY`, `ANDROID_CLOUDINARY_CLOUD_NAME`, `ANDROID_CLOUDINARY_UPLOAD_PRESET`. O workflow anexa o AAB assinado; o envio à Play Console requer acesso à conta e revisão das informações da loja, privacidade e uso de dados.

Antes de abrir para o público, teste em staging com um celular físico: cadastro por e-mail/SMS, login, anúncio com fotos, conversa, compra, retorno do Mercado Pago, webhook, QR de entrega, carteira, moderação no admin e agente de IA. Depois repita uma compra pequena controlada em produção e confirme o resultado no banco e no painel do provedor.
