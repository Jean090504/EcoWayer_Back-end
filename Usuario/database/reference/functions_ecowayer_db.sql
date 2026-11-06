use ecowayer_db;

-- ====================================================================
-- FUNÇÃO 1: CÁLCULO DE SALDO DE PONTOS COM VALIDADE
-- Atende a Regra de Negócio: RN001.2 - Ciclo de Vida da Pontuação (Usuário)
-- Descrição: Os pontos acumulados possuem validade improrrogável de 12 meses.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_calcular_saldo_pontos_valido$$
CREATE FUNCTION fn_calcular_saldo_pontos_valido (p_id_usuario INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_ganho INT DEFAULT 0;
    DECLARE v_total_gasto INT DEFAULT 0;
    DECLARE v_saldo_final INT DEFAULT 0;

    -- Soma apenas os pontos recebidos nos últimos 12 meses
    SELECT COALESCE(SUM(tbl_pontos.qntd_pontos), 0)
    INTO v_total_ganho
    FROM tbl_pontos
    WHERE tbl_pontos.id_usuario = p_id_usuario
      AND tbl_pontos.data_registro >= DATE_SUB(NOW(), INTERVAL 12 MONTH);

    -- Soma todos os pontos já utilizados em resgates de vouchers
    SELECT COALESCE(SUM(tbl_voucher.pontos_utilizados), 0)
    INTO v_total_gasto
    FROM tbl_voucher
    WHERE tbl_voucher.id_usuario = p_id_usuario;

    -- Calcula o saldo disponível
    SET v_saldo_final = v_total_ganho - v_total_gasto;

    -- Garante que o saldo não fique negativo caso os pontos expirem
    IF v_saldo_final < 0 THEN
        SET v_saldo_final = 0;
    END IF;

    RETURN v_saldo_final;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 2: VALIDAÇÃO DE TETO ANTIFRAUDE DIÁRIO
-- Atende a Regra de Negócio: RN001.4 - Teto Antifraude Diário (Usuário)
-- Descrição: Limita o ganho máximo de pontos por dia para inibir fraudes.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_validar_teto_diario_pontos$$
CREATE FUNCTION fn_validar_teto_diario_pontos (p_id_usuario INT, p_pontos_tentativa INT)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_limite_diario INT DEFAULT 500; -- Teto fixo parametrizado
    DECLARE v_pontos_hoje INT DEFAULT 0;
    DECLARE v_permitido TINYINT DEFAULT 0;

    -- Conta quantos pontos o usuário já ganhou na data atual
    SELECT COALESCE(SUM(tbl_pontos.qntd_pontos), 0)
    INTO v_pontos_hoje
    FROM tbl_pontos
    WHERE tbl_pontos.id_usuario = p_id_usuario
      AND DATE(tbl_pontos.data_registro) = CURDATE();

    -- Verifica se a nova transação ultrapassará o limite diário
    IF (v_pontos_hoje + p_pontos_tentativa) <= v_limite_diario THEN
        SET v_permitido = 1; -- 1 = Verdadeiro (Permitido)
    ELSE
        SET v_permitido = 0; -- 0 = Falso (Bloqueado)
    END IF;

    RETURN v_permitido;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 3: VERIFICAR INTEGRIDADE DE NEGOCIAÇÃO
-- Atende a Regra de Negócio: RN001.6 - Integridade de Negociações (Usuário)
-- Descrição: Anúncio "Em Negociação" bloqueia novas ofertas por até 48h.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_verificar_anuncio_disponivel$$
CREATE FUNCTION fn_verificar_anuncio_disponivel (p_id_anuncio INT)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status_atual VARCHAR(20);
    DECLARE v_data_mudanca DATETIME;
    DECLARE v_disponivel TINYINT DEFAULT 1;

    -- Busca o último status do anúncio no histórico
    SELECT 
        tbl_historico_anuncio.status, 
        tbl_historico_anuncio.data_alteracao
    INTO 
        v_status_atual, 
        v_data_mudanca
    FROM tbl_historico_anuncio
    WHERE tbl_historico_anuncio.id_anuncio = p_id_anuncio
    ORDER BY tbl_historico_anuncio.data_alteracao DESC
    LIMIT 1;

    -- Se estiver negociado há menos de 48 horas, o anúncio está indisponível
    IF v_status_atual = 'negociado' AND v_data_mudanca >= DATE_SUB(NOW(), INTERVAL 48 HOUR) THEN
        SET v_disponivel = 0;
    END IF;
    
    -- Se o status for apagado ou desativado, também não está disponível
    IF v_status_atual IN ('apagado', 'desativado') THEN
        SET v_disponivel = 0;
    END IF;

    RETURN v_disponivel;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 4: IMPEDIR CRIAÇÃO DE NOVO ADMINISTRADOR
-- Atende a Regra de Negócio: RN001.1 - Unicidade e Imutabilidade Root (ADM)
-- Descrição: A plataforma opera sob modelo monousuário para administração.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_pode_criar_administrador$$
CREATE FUNCTION fn_pode_criar_administrador ()
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_quantidade_admin INT DEFAULT 0;
    DECLARE v_permitido TINYINT DEFAULT 0;

    -- Conta quantos administradores existem no banco
    SELECT COUNT(tbl_administrador.id)
    INTO v_quantidade_admin
    FROM tbl_administrador;

    -- Só permite criação se a tabela estiver vazia (via Seed)
    IF v_quantidade_admin = 0 THEN
        SET v_permitido = 1;
    ELSE
        SET v_permitido = 0;
    END IF;

    RETURN v_permitido;
END$$
DELIMITER ;

use ecowayer_db;

-- ====================================================================
-- FUNÇÃO 5: CÁLCULO DE DISTÂNCIA GEOGRÁFICA (HAVERSINE)
-- Atende a Regra de Negócio: RF-001.4 - Cálculo de Distância
-- Descrição: Calcula a distância em linha reta (km) entre duas coordenadas.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_calcular_distancia_km$$
CREATE FUNCTION fn_calcular_distancia_km (
    p_latitude_origem DECIMAL(9,6), 
    p_longitude_origem DECIMAL(9,6), 
    p_latitude_destino DECIMAL(9,6), 
    p_longitude_destino DECIMAL(9,6)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
    DECLARE v_distancia DECIMAL(10,2);
    DECLARE v_raio_terra_km INT DEFAULT 6371; -- Raio médio da Terra

    -- Fórmula de Haversine para cálculo de distância esférica
    SET v_distancia = v_raio_terra_km * ACOS(
        COS(RADIANS(p_latitude_origem)) * COS(RADIANS(p_latitude_destino)) *
        COS(RADIANS(p_longitude_destino) - RADIANS(p_longitude_origem)) +
        SIN(RADIANS(p_latitude_origem)) * SIN(RADIANS(p_latitude_destino))
    );

    RETURN v_distancia;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 6: VALIDAÇÃO DE QR CODE
-- Atende a Regra de Negócio: RF-003.8 e RN001.3 - Confirmação Bilateral
-- Descrição: Verifica se um QR Code está ativo e dentro do prazo de validade.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_validar_qr_code_ativo$$
CREATE FUNCTION fn_validar_qr_code_ativo (p_codigo_qr VARCHAR(255))
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status_atual VARCHAR(20);
    DECLARE v_data_expiracao DATETIME;
    DECLARE v_valido TINYINT DEFAULT 0;

    -- Busca o status e a data de validade do QR Code
    SELECT 
        tbl_qr_code.status, 
        tbl_qr_code.data_expiracao
    INTO 
        v_status_atual, 
        v_data_expiracao
    FROM tbl_qr_code
    WHERE tbl_qr_code.codigo = p_codigo_qr
    LIMIT 1;

    -- Verifica se o QR Code ainda está ativo e se a data atual é menor que a data de expiração
    IF v_status_atual = 'ativo' AND v_data_expiracao > NOW() THEN
        SET v_valido = 1; -- 1 = Válido
    END IF;

    RETURN v_valido;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 7: VERIFICAR EXPIRAÇÃO DE CUSTÓDIA FINANCEIRA (ESCROW)
-- Atende a Regra de Negócio: RN001.7 - Custódia Financeira (Escrow)
-- Descrição: Checa se o pagamento retido ultrapassou 72 horas sem validação presencial.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_verificar_estorno_escrow_72h$$
CREATE FUNCTION fn_verificar_estorno_escrow_72h (p_id_pagamento INT)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_data_aprovacao DATETIME;
    DECLARE v_estorno_necessario TINYINT DEFAULT 0;

    -- Busca a data exata em que o pagamento entrou no status 'aprovado' (retido no gateway)
    SELECT tbl_historico_pagamento.data_alteracao
    INTO v_data_aprovacao
    FROM tbl_historico_pagamento
    WHERE tbl_historico_pagamento.id_pagamento = p_id_pagamento
      AND tbl_historico_pagamento.status = 'aprovado'
    ORDER BY tbl_historico_pagamento.data_alteracao DESC
    LIMIT 1;

    -- Se a data de aprovação existir e já tiverem passado 72 horas
    IF v_data_aprovacao IS NOT NULL AND NOW() > DATE_ADD(v_data_aprovacao, INTERVAL 72 HOUR) THEN
        SET v_estorno_necessario = 1; -- 1 = Sim, o estorno deve ser processado
    END IF;

    RETURN v_estorno_necessario;
END$$
DELIMITER ;

-- ====================================================================
-- FUNÇÃO 8: RECUPERAR PONTUAÇÃO BASE DA CATEGORIA
-- Atende a Regra de Negócio: RF006.1 - Cálculo de Pontos por Doação
-- Descrição: Recupera a pontuação raiz de um material para cálculos posteriores da IA.
-- ====================================================================
DELIMITER $$
DROP FUNCTION IF EXISTS fn_obter_pontos_base_categoria$$
CREATE FUNCTION fn_obter_pontos_base_categoria (p_id_categoria INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_pontos_base INT DEFAULT 0;

    SELECT tbl_categoria.pontos
    INTO v_pontos_base
    FROM tbl_categoria
    WHERE tbl_categoria.id = p_id_categoria;

    RETURN v_pontos_base;
END$$
DELIMITER ;
