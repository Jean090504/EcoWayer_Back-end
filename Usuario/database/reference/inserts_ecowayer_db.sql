use ecowayer_db;

insert into tbl_nivel_impacto (nome, numero, meta, unidade)
values 
('Baixo', 1, 10.00, 'pontos'),
('Médio', 2, 50.00, 'pontos'),
('Alto', 3, 100.00, 'pontos');


insert into tbl_insignia (nome, descricao, meta, unidade)
values 
('Primeiro Passo', 'Completou sua primeira atividade.', 1, 'atividade'),
('Dedicado', 'Completou 10 atividades.', 10, 'atividades'),
('Mestre', 'Completou 50 atividades.', 50, 'atividades');


insert into tbl_genero (nome, sigla)
values
('Masculino', 'M'),
('Feminino', 'F');


insert into tbl_verificacao (tentativas, tempo, reenvio, bloqueio, ultimo_reenvio)
values
(0, 10, 3, null, null),
(1, 10, 3, null, '2026-09-30 08:30:00'),
(3, 10, 3, '2026-09-30 08:45:00', '2026-09-30 08:40:00');


insert into tbl_status_usuario (status)
values
('ativo'),
('desativado');


insert into tbl_material_aceito (nome, icone)
values
('Papel', 'papel.png'),
('Plástico', 'plastico.png'),
('Vidro', 'vidro.png'),
('Metal', 'metal.png');


insert into tbl_endereco (
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    sigla,
    id_externo
)
values
('18160-000', 'Rua das Flores', '100', 'Casa', 'Centro', 'Salto de Pirapora', 'São Paulo', 'SP', 'endereco-001'),
('18035-000', 'Avenida Brasil', '250', 'Apto 12', 'Jardim Europa', 'Sorocaba', 'São Paulo', 'SP', 'endereco-002'),
('18046-000', 'Rua das Acácias', '80', 'Casa', 'Vila Helena', 'Sorocaba', 'São Paulo', 'SP', 'endereco-003'),
('18150-000', 'Rua do Comércio', '45', 'Sala 02', 'Centro', 'Araçoiaba da Serra', 'São Paulo', 'SP', 'endereco-004');


-- tabelas sem dependencia que precisam existir antes das tabelas com chave

insert into tbl_administrador (nome, email, senha)
values
('Administrador Principal', 'admin@ecowayer.com', '$argon2id$v=19$m=65536,t=3,p=4$senha-admin-01'),
('Administrador Suporte', 'suporte@ecowayer.com', '$argon2id$v=19$m=65536,t=3,p=4$senha-admin-02');


insert into tbl_tipo_categoria (nome)
values
('Reciclagem'),
('Descarte'),
('Coleta');


insert into tbl_tipo_modalidade (tipo)
values
('Presencial'),
('Entrega');


insert into tbl_tipo_imagem (tipo)
values
('Perfil'),
('Anúncio'),
('Denúncia'),
('Entrega');


insert into tbl_condicao_item (nome)
values
('Novo'),
('Usado'),
('Bom estado');


insert into tbl_tipo_denuncias (tipo)
values
('Conteúdo impróprio'),
('Fraude'),
('Spam'),
('Outro');


insert into tbl_ia (nome, provedor, versao, status, id_externo)
values
('EcoWayer Moderation', 'OpenAI', '1.0', 'ativo', 'ia-moderacao-001'),
('EcoWayer Classification', 'OpenAI', '1.2', 'treinando', 'ia-classificacao-001');


insert into tbl_dataset (nome, descricao)
values
('Dataset de Moderação', 'Conjunto de dados utilizado para identificar conteúdos suspeitos.'),
('Dataset de Classificação', 'Conjunto de dados utilizado para classificação de conteúdos ambientais.');


insert into tbl_qr_code (
    codigo,
    data_criacao,
    data_expiracao,
    status
)
values
('QR-ECOWAYER-0001', '2026-09-28 08:00:00', '2026-10-05 08:00:00', 'utilizado'),
('QR-ECOWAYER-0002', '2026-09-30 09:00:00', '2026-10-07 09:00:00', 'ativo'),
('QR-ECOWAYER-0003', '2026-09-29 08:00:00', '2026-10-06 08:00:00', 'cancelado'),
('QR-ECOWAYER-0004', '2026-09-30 10:00:00', '2026-10-10 10:00:00', 'utilizado');


insert into tbl_categoria (nome, pontos, id_tipo_categoria)
values
('Reciclável', 10, 1),
('Eletrônico', 20, 2),
('Orgânico', 5, 3),
('Plástico', 15, 1),
('Metal', 20, 1);


insert into tbl_modalidade (nome, id_tipo_modalidade)
values
('Entrega em ponto de coleta', 1),
('Coleta agendada', 2),
('Entrega por transportadora', 2);


insert into tbl_imagem (url, id_tipo_imagem)
values
('https://ecowayer.com/imagens/perfil-01.jpg', 1),
('https://ecowayer.com/imagens/perfil-02.jpg', 1),
('https://ecowayer.com/imagens/perfil-03.jpg', 1),
('https://ecowayer.com/imagens/anuncio-01.jpg', 2),
('https://ecowayer.com/imagens/anuncio-02.jpg', 2),
('https://ecowayer.com/imagens/anuncio-03.jpg', 2),
('https://ecowayer.com/imagens/denuncia-01.jpg', 3),
('https://ecowayer.com/imagens/entrega-01.jpg', 4),
('https://ecowayer.com/imagens/entrega-02.jpg', 4);


insert into tbl_usuario (
    nome,
    cpf,
    data_nascimento,
    id_imagem,
    id_genero,
    id_status_usuario,
    id_nivel_impacto
)
values
('Ana Souza', '123.456.789-01', '2004-05-12', 1, 2, 1, 2),
('Bruno Almeida', '234.567.890-12', '2003-08-21', 2, 1, 1, 1),
('Carla Mendes', '345.678.901-23', '2005-11-03', 3, 2, 1, 3);


insert into tbl_usuario_insignia (
    progresso,
    status,
    id_usuario,
    id_insignia
)
values
(100.00, 'concluido', 1, 1),
(70.00, 'em andamento', 1, 2),
(100.00, 'concluido', 2, 1),
(20.00, 'em andamento', 3, 2);


insert into tbl_email (email, codigo_verificacao, id_usuario)
values
('ana@email.com', '482715', 1),
('bruno@email.com', '193624', 2),
('carla@email.com', '761305', 3);


insert into tbl_telefone (numero, codigo_verificacao, id_usuario)
values
('15999990001', '528314', 1),
('15999990002', '617205', 2),
('15999990003', '904126', 3);


insert into tbl_email_verificacao (id_email, id_verificacao)
values
(1, 1),
(2, 2),
(3, 3);


insert into tbl_telefone_verificacao (id_telefone, id_verificacao)
values
(1, 2),
(2, 1),
(3, 3);


insert into tbl_conta (senha, id_email)
values
('$argon2id$v=19$m=65536,t=3,p=4$senha-exemplo-01', 1),
('$argon2id$v=19$m=65536,t=3,p=4$senha-exemplo-02', 2),
('$argon2id$v=19$m=65536,t=3,p=4$senha-exemplo-03', 3);


insert into tbl_treinamento_ia (
    status,
    id_externo,
    id_ia,
    id_dataset
)
values
('concluido', 'treinamento-001', 1, 1),
('em andamento', 'treinamento-002', 2, 2);


insert into tbl_anuncio (
    nome,
    descricao,
    data_publicacao,
    id_usuario,
    id_categoria,
    id_modalidade,
    id_condicao_item
)
values
('Coleta de garrafas PET', 'Coleta de garrafas plásticas para reciclagem.', '2026-09-25 10:00:00', 1, 4, 1, 2),
('Descarte de eletrônicos', 'Anúncio para descarte responsável de equipamentos eletrônicos.', '2026-09-26 14:30:00', 2, 2, 2, 3),
('Coleta de latas', 'Coleta de latas de alumínio para reciclagem.', '2026-09-27 09:15:00', 3, 5, 1, 2);


insert into tbl_imagem_anuncio (id_imagem, id_anuncio)
values
(4, 1),
(5, 1),
(6, 2),
(5, 3);


insert into tbl_pontos (
    qntd_pontos,
    data_registro,
    id_categoria,
    id_usuario
)
values
(10, '2026-09-25 10:30:00', 1, 1),
(15, '2026-09-26 11:00:00', 4, 1),
(20, '2026-09-27 09:45:00', 5, 2),
(5, '2026-09-28 14:00:00', 3, 3);


insert into tbl_historico_anuncio (
    status,
    data_alteracao,
    detalhes,
    id_anuncio
)
values
('ativo', '2026-09-25 10:00:00', 'Anúncio publicado.', 1),
('desativado', '2026-09-26 16:00:00', 'Anúncio desativado temporariamente pelo usuário.', 2),
('ativo', '2026-09-27 09:15:00', 'Anúncio publicado.', 3);


insert into tbl_conversa (id_anuncio, id_usuario)
values
(1, 2),
(2, 3),
(3, 1);


insert into tbl_mensagens (
    texto,
    envio,
    lida,
    id_conversa,
    id_remetente
)
values
('Olá, ainda está disponível?', '2026-09-25 11:00:00', 1, 1, 2),
('Sim, ainda está disponível.', '2026-09-25 11:05:00', 1, 1, 1),
('Gostaria de saber como funciona a coleta.', '2026-09-26 15:00:00', 0, 2, 3),
('Podemos combinar o horário da entrega.', '2026-09-27 10:00:00', 1, 3, 1);


insert into tbl_denuncias (
    descricao,
    id_tipo_denuncias,
    id_denunciante
)
values
('O conteúdo do anúncio parece inadequado.', 1, 2),
('Usuário solicitou pagamento fora da plataforma.', 2, 3),
('Mensagem enviada repetidamente.', 3, 1);


insert into tbl_imagem_denuncias (id_imagem, id_denuncias)
values
(7, 1),
(7, 2);


insert into tbl_denuncias_anuncio (id_denuncias, id_anuncio)
values
(1, 1),
(2, 2),
(3, 3);


insert into tbl_alertas (
    motivo,
    status,
    acao,
    id_ia,
    id_usuario
)
values
('Comportamento suspeito identificado em anúncio.', 'pendente', 'Revisar anúncio', 1, 2),
('Mensagem possivelmente relacionada a fraude.', 'revisado', 'Verificar conversa', 1, 3),
('Usuário apresentou comportamento incomum.', 'resolvido', 'Monitorar usuário', 2, 2);


insert into tbl_alertas_anuncio (id_alerta, id_anuncio)
values
(1, 1);


insert into tbl_alertas_mensagem (id_alerta, id_mensagem)
values
(2, 3);


insert into tbl_alertas_denuncias (id_alertas, id_denuncias)
values
(1, 1),
(2, 2),
(3, 3);


insert into tbl_pagamento (
    status,
    valor,
    id_externo,
    id_anuncio,
    id_comprador
)
values
('aprovado', 120.00, 'pagamento-001', 1, 2),
('pendente', 250.00, 'pagamento-002', 2, 3),
('cancelado', 80.00, 'pagamento-003', 3, 1);


insert into tbl_historico_pagamento (
    status,
    data_alteracao,
    detalhes,
    id_pagamento
)
values
('pendente', '2026-09-25 12:00:00', 'Pagamento criado e aguardando processamento.', 1),
('aprovado', '2026-09-25 12:05:00', 'Pagamento aprovado pela plataforma.', 1),
('pendente', '2026-09-26 16:00:00', 'Pagamento aguardando confirmação.', 2),
('cancelado', '2026-09-27 11:00:00', 'Pagamento cancelado pelo comprador.', 3);


insert into tbl_ponto_coleta (
    nome,
    descricao,
    status,
    latitude,
    longitude,
    id_categoria
)
values
('EcoPonto Central', 'Ponto de coleta para materiais recicláveis.', 'ativo', -23.646500, -47.573200, 1),
('EcoPonto Jardim', 'Ponto destinado principalmente a plástico e metal.', 'ativo', -23.620100, -47.455300, 4),
('EcoPonto Eletrônicos', 'Ponto especializado em descarte de eletrônicos.', 'inativo', -23.501200, -47.458900, 2);


insert into tbl_endereco_usuario (id_endereco, id_usuario)
values
(1, 1),
(2, 2),
(3, 3);


insert into tbl_endereco_ponto_coleta (id_endereco, id_ponto_coleta)
values
(1, 1),
(2, 2),
(4, 3);


insert into tbl_ponto_coleta_material_aceito (
    id_ponto_coleta,
    id_material_aceito
)
values
(1, 1),
(1, 2),
(1, 3),
(2, 2),
(2, 4),
(3, 2),
(3, 3),
(3, 4);


insert into tbl_entrega (
    peso_estimado,
    status,
    data_entrega,
    id_anuncio,
    id_usuario
)
values
(5.50, 'concluida', '2026-09-28 10:00:00', 1, 2),
(12.00, 'pendente', '2026-10-02 14:00:00', 2, 3),
(3.75, 'cancelada', '2026-09-29 09:00:00', 3, 1);


insert into tbl_imagem_entrega (id_imagem, id_entrega)
values
(8, 1),
(9, 1),
(8, 2);


insert into tbl_avaliacao (
    nota,
    comentario,
    data_avaliacao,
    id_entrega,
    id_usuario
)
values
(5, 'Entrega realizada corretamente e sem problemas.', '2026-09-28 12:00:00', 1, 2);


insert into tbl_voucher (
    nome_parceiro,
    beneficio,
    codigo,
    data_resgate,
    data_expiracao,
    status,
    pontos_utilizados,
    id_usuario
)
values
('EcoShop', '10% de desconto em produtos sustentáveis.', 'VOUCHER-ECO-001', '2026-09-29 15:00:00', '2026-10-29 15:00:00', 'ativo', 15, 1);


insert into tbl_qr_code_entrega (
    id_qr_code,
    id_anuncio,
    id_entrega
)
values
(1, 1, 1),
(2, 2, 2),
(3, 3, 3);


insert into tbl_qr_code_voucher (
    id_qr_code,
    id_voucher
)
values
(4, 1);


insert into tbl_leitura_qr_code (
    data_leitura,
    status,
    id_qr_code,
    id_usuario
)
values
('2026-09-28 10:15:00', 'valida', 1, 2),
('2026-09-30 10:00:00', 'valida', 2, 3),
('2026-09-29 09:10:00', 'invalida', 3, 1),
('2026-09-29 15:10:00', 'valida', 4, 1);

-- ====================================================================
insert into tbl_denuncias_mensagens (
    id_denuncias, 
    id_mensagens
) 
values
(1, 1),
(2, 2),
(3, 3);