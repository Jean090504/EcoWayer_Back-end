# EcoWayer na Azure para apresentação do TCC

Esta instalação é de **homologação**. Os cinco serviços usam HTTPS, o mesmo MySQL e o grupo de recursos `ecowayer` na assinatura Azure for Students. Os aplicativos estão no plano Linux `ecowayer-tcc-free`, SKU **B1 (cobrado do crédito Azure)**, na região Chile Central. A opção F1 interrompeu os serviços por cota de CPU. A política da assinatura não permitiu criar Azure Static Web Apps nas regiões disponíveis; por isso os dois sites usam App Service.

| Componente | Endereço |
| --- | --- |
| Site usuário | https://ecowayer-site-tcc.azurewebsites.net |
| Site admin | https://ecowayer-admin-site-tcc.azurewebsites.net |
| API usuário | https://ecowayer-usuario-tcc.azurewebsites.net/health |
| API admin | https://ecowayer-admin-tcc.azurewebsites.net/health |
| API IA | https://ecowayer-ia-tcc.azurewebsites.net/health |
| APK Android de apresentação | https://ecowayer-site-tcc.azurewebsites.net/downloads/ecowayer-tcc.apk |

## Configuração e publicação

- Os segredos ficam nas configurações privadas do App Service. Não envie os arquivos `.env` ao GitHub nem coloque segredos em variáveis `VITE_*`, pois elas são públicas no JavaScript.
- `scripts/deploy-tcc-settings.ps1` lê os `.env` locais e configura as três APIs. Reutiliza os JWT e o segredo compartilhado de IA já configurados na Azure. O script é para execução local, depois de `az login`.
- Para as APIs Admin e Usuário, gere um ZIP da pasta de cada serviço e publique com `az webapp deploy -g ecowayer -n <app> --src-path <zip> --type zip`. As dependências são instaladas pelo build remoto.
- Para IA, execute `npm ci --omit=dev` e `npm run build` em `ia_agent`, depois `scripts/package-ia-azure.ps1` e publique o ZIP gerado. O agente usa pacote já compilado; `SCM_DO_BUILD_DURING_DEPLOYMENT=false`.
- Os frontends são compilados com `VITE_API_URL` apontando para a API HTTPS correspondente. Empacote `dist` com `EcoWayer_Front-end/scripts/package-azure-site.ps1` e publique nos App Services dos sites. Os comandos iniciais dos dois sites são `pm2 serve /home/site/wwwroot --no-daemon --spa`.
- O GitHub Actions verifica os builds. A publicação manual permanece necessária até configurar uma identidade federada da Azure para os três repositórios. O antigo fluxo Static Web Apps do frontend foi removido porque a política da assinatura bloqueia esse recurso nas regiões oferecidas.

## Limites antes de uso público

- O checkout está **apenas em modo de teste**: `MP_TEST_MODE=1`, `MP_STAGING_ENABLED=1` e `MP_LIVE_ENABLED=0`. O backend exige URLs HTTPS e nunca processa cobrança real nessa configuração. A definição de quem recebe cada venda e o webhook assinado continuam pendentes para cobrança real.
- Para verificação de cadastro e recuperação de senha, configure na **API Usuário** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` com credenciais de um provedor de e-mail. Para verificar telefone, configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM`. Essas variáveis não estão presentes na instalação atual; sem elas os códigos não são entregues. Depois de cadastrar os valores privados no App Service, reinicie a API e teste o envio real. Não desative a verificação para simular uma conta validada.
- Fotografias de anúncios precisam de armazenamento persistente externo antes de abrir para usuários. O App Service pode substituir arquivos locais durante uma publicação. Avalie Cloudinary ou Azure Blob e confira as URLs existentes no banco.
- O banco MySQL tem uma regra de firewall ampla herdada do ambiente anterior; restrinja o acesso e troque as credenciais antes de liberar o sistema publicamente. As credenciais antigas também foram compartilhadas na conversa e devem ser rotacionadas.
- Sem Play Console, instale o APK Android de depuração pelo link acima ou pelo rodapé do site. O pacote aponta para a API HTTPS pública e foi compilado com a chave Maps de depuração; não é uma versão para Play Store. Para o login Google, o projeto Google Cloud precisa de um cliente OAuth Android para `com.example.ecowayer` com o SHA-1 do APK instalado, um cliente OAuth Web cujo ID corresponda a `GOOGLE_CLIENT_ID` da API Usuário e ao `GOOGLE_SERVER_CLIENT_ID` do build Android, e o e-mail do testador em **Público > Usuários de teste** enquanto o app estiver em modo Testando. O APK de apresentação 1.0.2 usa o SHA-1 `B0:3F:4D:E0:A5:0B:E7:4E:4D:5A:FB:EE:32:D2:0B:A2:D1:32:12:6A`. O Maps também exige que o projeto Google Cloud tenha faturamento vinculado. A publicação na Play exige conta, chave definitiva de assinatura e chaves vinculadas ao certificado final.
- Verifique em navegador e celular físico: cadastro com envio real de códigos, anúncio com foto, conversa, pagamento de teste, retorno e webhook, QR, carteira, moderação e IA. Um `/health` 200 comprova somente que o serviço HTTP iniciou.
