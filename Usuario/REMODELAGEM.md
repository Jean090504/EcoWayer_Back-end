# Decisões de arquitetura

- `src/server.js` contém apenas a inicialização e o encerramento do servidor; `src/app.js` configura middlewares e rotas para permitir composição isolada.
- Controllers implementam HTTP e regras do fluxo. `usuarioDAO.js` é a camada de acesso a tabelas do domínio; o `knexfile.js` e a migration fazem configuração e evolução do esquema.
- Knex usa o driver `mysql2`. A migration adiciona hash de senha, estado explícito de verificação de e-mail/telefone e armazenamento de OTP com finalidade, expiração e contagem de tentativas. Códigos de verificação legados em texto deixam de ser usados.
- Argon2id protege senhas; OTP é persistido como SHA-256 e comparado em tempo constante; JWT tem emissor/audiência e segredo obrigatório. As respostas públicas nunca retornam hash de senha.
- A exclusão anonimiza os dados identificadores e desativa a conta para preservar integridade referencial do restante do banco. Rever a política de retenção junto ao responsável pelo tratamento antes de produção.
- Upload usa memória limitada, validação MIME, decodificação via Sharp e formato WebP. A entrega requer armazenamento persistente e domínio público em produção.
- O webhook de notificação é uma interface para provedor externo, sem acoplamento a fornecedor. Sem ele, os fluxos continuam sem revelar OTP e devolvem estado de envio falso.
- O módulo cobre somente auth e perfil. Rotas Postman de anúncios, conversas, pontos e denúncias ficam fora desta API.
