use ecowayer_db;

-- ====================================================================
-- 1. VIEW: PERFIL COMPLETO DE USUÁRIOS
-- Útil para carregar a tela de perfil do app e painel administrativo
-- ====================================================================
CREATE OR REPLACE VIEW vw_usuarios_completos AS
SELECT
    tbl_usuario.id AS id_usuario,
    tbl_usuario.nome AS nome_usuario,
    tbl_usuario.cpf AS cpf_usuario,
    tbl_usuario.data_nascimento AS data_nascimento_usuario,
    tbl_imagem.url AS url_imagem_perfil,
    tbl_genero.nome AS genero_usuario,
    tbl_status_usuario.status AS status_conta,
    tbl_nivel_impacto.nome AS nivel_impacto_usuario
FROM tbl_usuario
INNER JOIN tbl_imagem
    ON tbl_usuario.id_imagem = tbl_imagem.id
INNER JOIN tbl_genero
    ON tbl_usuario.id_genero = tbl_genero.id
INNER JOIN tbl_status_usuario
    ON tbl_usuario.id_status_usuario = tbl_status_usuario.id
INNER JOIN tbl_nivel_impacto
    ON tbl_usuario.id_nivel_impacto = tbl_nivel_impacto.id;

-- ====================================================================
-- 2. VIEW: FEED DE ANÚNCIOS DETALHADO
-- Útil para listar os anúncios no marketplace do aplicativo
-- ====================================================================
CREATE OR REPLACE VIEW vw_anuncios_completos AS
SELECT
    tbl_anuncio.id AS id_anuncio,
    tbl_anuncio.nome AS titulo_anuncio,
    tbl_anuncio.descricao AS descricao_anuncio,
    tbl_anuncio.data_publicacao AS data_publicacao_anuncio,
    tbl_usuario.nome AS nome_anunciante,
    tbl_categoria.nome AS nome_categoria,
    tbl_modalidade.nome AS nome_modalidade,
    tbl_condicao_item.nome AS condicao_anuncio
FROM tbl_anuncio
INNER JOIN tbl_usuario
    ON tbl_anuncio.id_usuario = tbl_usuario.id
INNER JOIN tbl_categoria
    ON tbl_anuncio.id_categoria = tbl_categoria.id
INNER JOIN tbl_modalidade
    ON tbl_anuncio.id_modalidade = tbl_modalidade.id
INNER JOIN tbl_condicao_item
    ON tbl_anuncio.id_condicao_item = tbl_condicao_item.id;

-- ====================================================================
-- 3. VIEW: PONTOS DE COLETA (MAPA)
-- Útil para carregar os marcadores no mapa interativo com sua categoria
-- ====================================================================
CREATE OR REPLACE VIEW vw_pontos_coleta_detalhados AS
SELECT
    tbl_ponto_coleta.id AS id_ponto_coleta,
    tbl_ponto_coleta.nome AS nome_ponto_coleta,
    tbl_ponto_coleta.descricao AS descricao_ponto_coleta,
    tbl_ponto_coleta.status AS status_ponto_coleta,
    tbl_ponto_coleta.latitude AS latitude_ponto_coleta,
    tbl_ponto_coleta.longitude AS longitude_ponto_coleta,
    tbl_categoria.nome AS nome_categoria_principal
FROM tbl_ponto_coleta
INNER JOIN tbl_categoria
    ON tbl_ponto_coleta.id_categoria = tbl_categoria.id;

-- ====================================================================
-- 4. VIEW: ACOMPANHAMENTO DE ENTREGAS
-- Útil para o painel de status de coletas e fretes
-- ====================================================================
CREATE OR REPLACE VIEW vw_entregas_detalhadas AS
SELECT
    tbl_entrega.id AS id_entrega,
    tbl_entrega.peso_estimado AS peso_estimado_entrega,
    tbl_entrega.status AS status_entrega,
    tbl_entrega.data_entrega AS data_entrega,
    tbl_anuncio.nome AS titulo_anuncio,
    tbl_usuario.nome AS nome_recebedor
FROM tbl_entrega
INNER JOIN tbl_anuncio
    ON tbl_entrega.id_anuncio = tbl_anuncio.id
INNER JOIN tbl_usuario
    ON tbl_entrega.id_usuario = tbl_usuario.id;

-- ====================================================================
-- 5. VIEW: MODERAÇÃO DE DENÚNCIAS
-- Útil para a fila de chamados do administrador
-- ====================================================================
CREATE OR REPLACE VIEW vw_denuncias_completas AS
SELECT
    tbl_denuncias.id AS id_denuncia,
    tbl_denuncias.descricao AS descricao_denuncia,
    tbl_tipo_denuncias.tipo AS categoria_denuncia,
    tbl_usuario.nome AS nome_denunciante
FROM tbl_denuncias
INNER JOIN tbl_tipo_denuncias
    ON tbl_denuncias.id_tipo_denuncias = tbl_tipo_denuncias.id
INNER JOIN tbl_usuario
    ON tbl_denuncias.id_denunciante = tbl_usuario.id;

-- ====================================================================
-- 6. VIEW: AUDITORIA DE ALERTAS DA INTELIGÊNCIA ARTIFICIAL
-- Útil para o dashboard administrativo verificar a eficácia da IA
-- ====================================================================
CREATE OR REPLACE VIEW vw_alertas_ia_detalhados AS
SELECT
    tbl_alertas.id AS id_alerta,
    tbl_alertas.motivo AS motivo_alerta,
    tbl_alertas.status AS status_alerta,
    tbl_alertas.acao AS acao_alerta,
    tbl_ia.nome AS nome_ia_responsavel,
    tbl_usuario.nome AS nome_usuario_suspeito
FROM tbl_alertas
INNER JOIN tbl_ia
    ON tbl_alertas.id_ia = tbl_ia.id
INNER JOIN tbl_usuario
    ON tbl_alertas.id_usuario = tbl_usuario.id;

-- ====================================================================
-- 7. VIEW: RELATÓRIO DE TRANSAÇÕES FINANCEIRAS (PAGAMENTOS)
-- Útil para a custódia financeira e geração de relatórios de vendas
-- ====================================================================
CREATE OR REPLACE VIEW vw_pagamentos_detalhados AS
SELECT
    tbl_pagamento.id AS id_pagamento,
    tbl_pagamento.status AS status_pagamento,
    tbl_pagamento.valor AS valor_pagamento,
    tbl_pagamento.id_externo AS id_externo_gateway,
    tbl_anuncio.nome AS titulo_anuncio_comprado,
    tbl_usuario.nome AS nome_comprador
FROM tbl_pagamento
INNER JOIN tbl_anuncio
    ON tbl_pagamento.id_anuncio = tbl_anuncio.id
INNER JOIN tbl_usuario
    ON tbl_pagamento.id_comprador = tbl_usuario.id;

-- ====================================================================
-- 8. VIEW: VOUCHERS E RECOMPENSAS RESGATADAS
-- Útil para rastrear a gamificação e uso de pontos na plataforma
-- ====================================================================
CREATE OR REPLACE VIEW vw_vouchers_resgatados AS
SELECT
    tbl_voucher.id AS id_voucher,
    tbl_voucher.nome_parceiro AS nome_parceiro_voucher,
    tbl_voucher.beneficio AS beneficio_voucher,
    tbl_voucher.codigo AS codigo_voucher,
    tbl_voucher.data_resgate AS data_resgate_voucher,
    tbl_voucher.data_expiracao AS data_expiracao_voucher,
    tbl_voucher.status AS status_voucher,
    tbl_voucher.pontos_utilizados AS pontos_gastos,
    tbl_usuario.nome AS nome_usuario_resgate
FROM tbl_voucher
INNER JOIN tbl_usuario
    ON tbl_voucher.id_usuario = tbl_usuario.id;