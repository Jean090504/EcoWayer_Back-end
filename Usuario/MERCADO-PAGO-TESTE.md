# Mercado Pago no EcoWayer (ambiente de teste)

A aplicação **EcoWayer TCC Testes** foi criada no [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel/app/3328498013279371) com Checkout Pro e API de Preferences. O botão de teste aparece somente nos anúncios de **venda** do frontend web quando `VITE_MP_TEST_MODE=1`.

## Executar

1. No `.env` de `Usuario`, defina `MP_ACCESS_TOKEN` com o **Access Token de teste** da aplicação, `MP_TEST_MODE=1`, `MP_BACKEND_URL=http://localhost:3000` e `MP_FRONTEND_URL=http://localhost:5173`.
2. No `.env` de `Front_Usuario`, defina `VITE_MP_TEST_MODE=1` e `VITE_API_URL=http://localhost:3000`.
3. Inicie cada serviço necessário em seu próprio terminal, conforme [o guia de configuração](../CONFIGURACAO-AMBIENTE-LOCAL.md#iniciar-um-serviço-por-vez). Para o checkout web, execute pelo menos o backend Usuario (`node app.js`) e o frontend Usuario (`npm run dev`).
4. Entre no EcoWayer em `http://localhost:5173` com um usuário comprador, abra um anúncio de venda ativo de outro usuário e clique em **Testar pagamento com Mercado Pago**.
5. No checkout, entre com a [conta de teste de comprador](https://www.mercadopago.com.br/developers/panel/app/3328498013279371/test-users) gerada pela aplicação. Consulte os [cartões de teste](https://www.mercadopago.com.br/developers/panel/app/3328498013279371/test-cards) no painel.

O backend lê o preço e a modalidade no banco. O navegador recebe somente o endereço `init_point` do Checkout Pro. Na volta, o backend consulta o pagamento na API do Mercado Pago antes de mostrar uma aprovação. A URL de retorno local funciona no navegador do computador que executa a API.

## Limites deste fluxo

Este fluxo usa a conta de teste da aplicação, **não conecta a conta do anunciante** e não registra pedido, entrega ou repasse. É uma demonstração de integração, não deve ser usada para vendas reais. O código é desativado em `NODE_ENV=production`, e o botão não é incluído no frontend sem `VITE_MP_TEST_MODE=1`.

Para vendas reais entre usuários, a solução indicada é [Split Payments 1:1 com Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace): cada anunciante conecta a própria conta por OAuth, o EcoWayer cria a preferência com o token dele e aplica a comissão configurada. Essa etapa exige definir quem recebe os valores e a regra de comissão. Também exige pedidos persistidos, verificação de [webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/resources/notifications/webhooks), uma URL HTTPS pública e retorno próprio para Android. Não habilite produção antes dessas etapas.

O painel atualmente avisa que a API de Preferences será descontinuada. Confira a opção vigente para Split Payments antes de migrar este fluxo de teste para produção.
