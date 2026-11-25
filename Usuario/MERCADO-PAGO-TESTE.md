# Mercado Pago no EcoWayer (ambiente de teste)

A aplicação **EcoWayer TCC Testes** foi criada no [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app/3328498013279371) com Checkout Pro e API de Preferences. O botão de teste aparece somente nos anúncios de **venda** do frontend web quando `VITE_MP_TEST_MODE=1`.

## Executar

1. No `.env` de `Usuario`, defina `MP_ACCESS_TOKEN` com o **Access Token de teste** da aplicação, `MP_TEST_MODE=1`, `MP_BACKEND_URL=http://localhost:3000` e `MP_FRONTEND_URL=http://localhost:5173`.
2. No `.env` de `Front_Usuario`, defina `VITE_MP_TEST_MODE=1` e `VITE_API_URL=http://localhost:3000`.
3. Execute `npm run migrate:pedidos` em `Usuario` para criar a tabela no banco configurado. Inicie o backend Usuario (`node app.js`) e o frontend Usuario (`npm run dev`) em seus respectivos diretórios.
4. Entre no EcoWayer em `http://localhost:5173` com um usuário comprador, abra um anúncio de venda ativo de outro usuário e clique em **Testar pagamento com Mercado Pago**.
5. No checkout, entre com a [conta de teste de comprador](https://www.mercadopago.com.br/developers/panel/app/3328498013279371/test-users) gerada pela aplicação. Consulte os [cartões de teste](https://www.mercadopago.com.br/developers/panel/app/3328498013279371/test-cards) no painel.

O backend lê preço, modalidade e vendedor no banco e persiste o pedido antes de criar o checkout. A referência externa é o UUID do pedido. A credencial precisa pertencer a uma conta `test_user`: um token real é recusado mesmo com `MP_TEST_MODE=1`. Nenhuma credencial privada é enviada ao navegador.

## Compras e entrega no site

1. O retorno do checkout abre **Compras e vendas → Minhas compras**. Se a sessão expirou, entre novamente. O redirect não aprova o pedido.
2. A tela solicita a consulta do pagamento no backend. Também é possível clicar em **Consultar pagamento**, inclusive se o comprador fechou o checkout sem retornar.
3. O backend confere referência, moeda, valor e `live_mode=false`. Apenas `approved` libera entrega. Registra pagamento e histórico nas tabelas existentes. Recusa permite tentar novamente o checkout do mesmo pedido; pagamento pendente não libera código.
4. Comprador e vendedor usam **Combinar entrega no chat** no pedido; a conversa é criada junto com o pedido e continua acessível após a venda. No menu de perfil, o vendedor acessa **Compras e vendas → Minhas vendas**.
5. Depois de receber e conferir o produto, o comprador gera um código de oito dígitos. O código fica apenas na memória da tela; no banco fica seu HMAC. Dura dez minutos, admite cinco tentativas e não pode ser regenerado enquanto estiver ativo. Se fechar a tela, aguarde expirar.
6. O vendedor digita o código no site. O servidor consulta novamente o pagamento, valida os participantes e conclui o pedido em transação, criando uma única entrega legada. Registra horário e responsável. Repetições não duplicam entrega.
7. Antes de confirmar, o comprador pode **Relatar problema**. Isso invalida o código e bloqueia a entrega. É um registro para análise manual, não um reembolso automático.

Não é necessário aplicativo nem câmera. As rotas `/meraki/ecowayer/user/pedidos` usam a mesma autenticação da aplicação e podem ser consumidas pelo app futuramente. Não foi adicionada uma nova tela de pedidos ao Android.

## Webhook e execução local

Em localhost, retorno e consulta manual funcionam sem webhook. Para receber atualizações sem retorno do comprador, configure `MP_BACKEND_URL` com HTTPS público e `MP_WEBHOOK_SECRET` com a assinatura secreta fornecida pelo painel. Cadastre eventos `payment` para `POST /mercadopago/webhook`. Não exponha o segredo no frontend.

O endpoint valida HMAC de `x-signature`, `x-request-id` e `data.id`, busca o pagamento na API e processa em transação. Notificações repetidas não duplicam registros; o corpo da notificação nunca aprova sozinho. A assinatura segue a [documentação oficial de notificações](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/optional-notifications).

## Verificação

`node --test tests/pedidos_site.cjs` executa validações sem banco. `PEDIDOS_DB_TEST=1 node --test tests/pedidos_site.cjs` verifica o fluxo persistido usando três usuários existentes e anúncios temporários, com rollback ao finalizar. O gateway é controlado no teste: ele não faz cobranças nem substitui o ensaio manual no checkout real de teste.

## Limites deste fluxo

Este fluxo usa a conta de teste da aplicação, **não conecta a conta do anunciante** e não realiza repasses. Agora registra pedido, pagamento validado e entrega. É desativado em `NODE_ENV=production`, e o botão de checkout exige `VITE_MP_TEST_MODE=1` no frontend.

Cada anúncio representa um lote integral e possui no máximo um pedido neste fluxo de demonstração. Pedidos iniciados reservam o anúncio para aquele comprador; não há liberação automática de pedidos abandonados nem cancelamento/reembolso pelo site. Para novas demonstrações, publique outro anúncio. O anúncio deixa de aparecer no catálogo ativo após a aprovação da venda. O peso legado da entrega é registrado como zero (não aferido), sem conceder pontos por um peso inventado.

A confirmação por código registra o aceite do comprador; não é prova física absoluta de entrega. Transportadora, repasse, conciliação periódica e painel de resolução de problemas estão fora deste fluxo de TCC.

Pagamento real entre usuários está fora do escopo deste TCC. Ele exigiria um projeto próprio de Split Payments, OAuth dos vendedores, regras de comissão, reembolso e operação financeira. Consulte as [contas de teste do Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/test-accounts) para preparar a apresentação.

O painel atualmente avisa que a API de Preferences será descontinuada. Confira a opção vigente para Split Payments antes de migrar este fluxo de teste para produção.
