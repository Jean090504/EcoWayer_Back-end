-- Catálogo de gift cards usado pelo painel Admin.
-- Aplicar uma única vez no banco ecowayer_db.

CREATE TABLE IF NOT EXISTS tbl_gift_card (
    id INT NOT NULL AUTO_INCREMENT,
    slug_api VARCHAR(150) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    valor_reais DECIMAL(10,2) NOT NULL,
    pontos_resgate INT UNSIGNED NOT NULL,
    imagem_url VARCHAR(500) NULL,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Gift card',
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tbl_gift_card_slug_api (slug_api)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE tbl_voucher
    ADD COLUMN id_gift_card INT NULL AFTER id_usuario;

ALTER TABLE tbl_voucher
    ADD CONSTRAINT fk_tbl_voucher_gift_card
    FOREIGN KEY (id_gift_card) REFERENCES tbl_gift_card(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
