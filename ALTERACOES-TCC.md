# Alterações do TCC — APIs

Esta branch reúne as mudanças recentes no backend administrativo e no agente de IA:

- O agente de IA possui chat Gemini para usuário e administrador, com contexto separado e resposta de contingência em caso de indisponibilidade do provedor.
- Alertas podem ser associados a anúncios e denúncias. A API administrativa retorna esses vínculos na listagem e no detalhe.
- O script `Admin/scripts/seedChamadosTeste.js` cria quatro chamados pendentes de demonstração (dois alertas da IA e duas denúncias). A execução é idempotente: repetir o comando não duplica os registros.
- Regras de pontuação calculam os pontos da categoria multiplicados pelo fator da condição; o painel também recebe métricas de pontos.
- Itens aceitam URL de imagem, com o script `Admin/alter_tbl_item_img.sql` para bancos que ainda não possuem a coluna `img`.

Para criar os exemplos, execute `node scripts/seedChamadosTeste.js` dentro de `Admin`. Eles são identificados com `[TESTE TCC]` e não representam inferências reais.

As decisões administrativas atualizam o alerta. A tabela `tbl_anuncio` ainda não possui status de moderação, então desativação e remoção do anúncio dependem de uma integração posterior. Credenciais e chaves devem permanecer apenas nos arquivos `.env` locais.
