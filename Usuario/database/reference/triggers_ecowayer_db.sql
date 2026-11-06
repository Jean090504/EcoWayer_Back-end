use ecowayer_db;

-- ====================================================================
-- TRIGGER 1: INICIALIZAÇÃO DO HISTÓRICO DE ANÚNCIO
-- Descrição: Toda vez que um anúncio for criado, ele precisa de um 
-- registro inicial na tabela de histórico constando como 'ativo'.
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_anuncio_after_insert$$
CREATE TRIGGER trg_anuncio_after_insert
AFTER INSERT ON tbl_anuncio
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_anuncio (
        status,
        data_alteracao,
        detalhes,
        id_anuncio
    ) VALUES (
        'ativo',
        NOW(),
        'Anúncio publicado originalmente.',
        NEW.id
    );
END$$
DELIMITER ;

-- ====================================================================
-- TRIGGER 2: SUSPENSÃO PREVENTIVA POR DENÚNCIA
-- Atende a Regra de Negócio: RN001.2 - Suspensão Preventiva (ADM)
-- Descrição: Anúncios que receberem denúncias devem ter seu status 
-- alterado imediatamente para suspenso (desativado)[cite: 6].
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_denuncia_anuncio_after_insert$$
CREATE TRIGGER trg_denuncia_anuncio_after_insert
AFTER INSERT ON tbl_denuncias_anuncio
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_anuncio (
        status,
        data_alteracao,
        detalhes,
        id_anuncio
    ) VALUES (
        'desativado',
        NOW(),
        'Suspensão preventiva automática: O anúncio recebeu uma denúncia formal.',
        NEW.id_anuncio
    );
END$$
DELIMITER ;

-- ====================================================================
-- TRIGGER 3: SUSPENSÃO PREVENTIVA POR ALERTA DA IA
-- Atende a Regra de Negócio: RN001.2 - Suspensão Preventiva (ADM)[cite: 6]
-- Descrição: Anúncios com divergências graves detectadas pela IA 
-- devem ter seu status alterado para suspenso (desativado)[cite: 6].
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_alerta_ia_anuncio_after_insert$$
CREATE TRIGGER trg_alerta_ia_anuncio_after_insert
AFTER INSERT ON tbl_alertas_anuncio
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_anuncio (
        status,
        data_alteracao,
        detalhes,
        id_anuncio
    ) VALUES (
        'desativado',
        NOW(),
        'Suspensão preventiva automática: Divergência detectada pela Inteligência Artificial.',
        NEW.id_anuncio
    );
END$$
DELIMITER ;

-- ====================================================================
-- TRIGGER 4: BLOQUEIO DE ANÚNCIO "EM NEGOCIAÇÃO"
-- Atende a Regra de Negócio: RN001.6 - Integridade de Negociações (Usuário)
-- Descrição: Um anúncio com proposta aceita (que gerou uma entrega) 
-- entra no estado "Em Negociação", bloqueando novas ofertas.
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_entrega_after_insert$$
CREATE TRIGGER trg_entrega_after_insert
AFTER INSERT ON tbl_entrega
FOR EACH ROW
BEGIN
    DECLARE v_ultimo_status VARCHAR(20) DEFAULT NULL;

    SELECT status
    INTO v_ultimo_status
    FROM tbl_historico_anuncio
    WHERE id_anuncio = NEW.id_anuncio
    ORDER BY data_alteracao DESC, id DESC
    LIMIT 1;

    IF v_ultimo_status IS NULL OR v_ultimo_status <> 'negociado' THEN
        INSERT INTO tbl_historico_anuncio (
            status,
            data_alteracao,
            detalhes,
            id_anuncio
        ) VALUES (
            'negociado',
            NOW(),
            'Anúncio entrou em negociação após aceite de proposta (Entrega agendada).',
            NEW.id_anuncio
        );
    END IF;
END$$
DELIMITER ;

use ecowayer_db;

-- ====================================================================
-- TRIGGER 5: VALIDAÇÃO PRESENCIAL (QR CODE) E LIBERAÇÃO DE PONTOS
-- Atende a Regra de Negócio: RN001.3 - Confirmação Bilateral Obrigatória[cite: 7]
-- Descrição: A pontuação só é liberada na conta do anunciante após a 
-- leitura presencial do QR Code, alterando também o status da entrega[cite: 7].
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_leitura_qrcode_after_insert$$
CREATE TRIGGER trg_leitura_qrcode_after_insert
AFTER INSERT ON tbl_leitura_qr_code
FOR EACH ROW
BEGIN
    DECLARE v_id_entrega INT;
    DECLARE v_id_anuncio INT;
    DECLARE v_id_anunciante INT;
    DECLARE v_id_categoria INT;
    DECLARE v_pontos_base INT;

    -- Se a leitura do QR Code foi validada com sucesso pelo sistema
    IF NEW.status = 'valida' THEN
        
        -- 1. Descobrir qual entrega e anúncio pertencem a esse QR Code
        SELECT 
            tbl_qr_code_entrega.id_entrega, 
            tbl_qr_code_entrega.id_anuncio
        INTO 
            v_id_entrega, 
            v_id_anuncio
        FROM tbl_qr_code_entrega
        WHERE tbl_qr_code_entrega.id_qr_code = NEW.id_qr_code
        LIMIT 1;

        -- Se encontrou uma entrega atrelada ao QR Code lido
        IF v_id_entrega IS NOT NULL THEN
            
            -- 2. Atualiza o status da entrega para concluída
            UPDATE tbl_entrega
            SET tbl_entrega.status = 'concluida'
            WHERE tbl_entrega.id = v_id_entrega;

            -- 3. Descobrir o anunciante (vendedor/doador) e a categoria do anúncio
            SELECT 
                tbl_anuncio.id_usuario, 
                tbl_anuncio.id_categoria
            INTO 
                v_id_anunciante, 
                v_id_categoria
            FROM tbl_anuncio
            WHERE tbl_anuncio.id = v_id_anuncio;

            -- 4. Busca os pontos da categoria pela função do banco.
            SELECT fn_obter_pontos_base_categoria(v_id_categoria)
            INTO v_pontos_base;

            -- 5. Aplica o limite diário antes de creditar os pontos.
            IF fn_validar_teto_diario_pontos(v_id_anunciante, v_pontos_base) = 1 THEN
                INSERT INTO tbl_pontos (
                    qntd_pontos,
                    data_registro,
                    id_categoria,
                    id_usuario
                ) VALUES (
                    v_pontos_base,
                    NOW(),
                    v_id_categoria,
                    v_id_anunciante
                );
            END IF;
        END IF;
    END IF;
END$$
DELIMITER ;

-- ====================================================================
-- TRIGGER 6: CRIAÇÃO DO HISTÓRICO DE PAGAMENTO (INSERT)
-- Descrição: Mantém a integridade financeira garantindo que todo 
-- pagamento recém-criado na plataforma ganhe um registro de auditoria.
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_pagamento_after_insert$$
CREATE TRIGGER trg_pagamento_after_insert
AFTER INSERT ON tbl_pagamento
FOR EACH ROW
BEGIN
    INSERT INTO tbl_historico_pagamento (
        status,
        data_alteracao,
        detalhes,
        id_pagamento
    ) VALUES (
        NEW.status,
        NOW(),
        'Transação financeira iniciada na plataforma.',
        NEW.id
    );
END$$
DELIMITER ;

-- ====================================================================
-- TRIGGER 7: ATUALIZAÇÃO DO HISTÓRICO DE PAGAMENTO (UPDATE)
-- Descrição: Quando a custódia (escrow) liberar o pagamento ou 
-- ele for estornado/cancelado, registra a alteração do status.
-- ====================================================================
DELIMITER $$
DROP TRIGGER IF EXISTS trg_pagamento_after_update$$
CREATE TRIGGER trg_pagamento_after_update
AFTER UPDATE ON tbl_pagamento
FOR EACH ROW
BEGIN
    -- Só cria histórico se o status realmente mudou
    IF NEW.status != OLD.status THEN
        INSERT INTO tbl_historico_pagamento (
            status,
            data_alteracao,
            detalhes,
            id_pagamento
        ) VALUES (
            NEW.status,
            NOW(),
            CONCAT('Status financeiro alterado de ', OLD.status, ' para ', NEW.status, '.'),
            NEW.id
        );
    END IF;
END$$
DELIMITER ;
