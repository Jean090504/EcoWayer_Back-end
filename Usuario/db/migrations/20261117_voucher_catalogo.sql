-- Execute no banco usado pela API Usuario.
-- No banco local, esta estrutura já foi criada durante a correção.
USE ecowayer_db;

CREATE TABLE IF NOT EXISTS tbl_voucher_catalogo (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome_parceiro VARCHAR(150) NOT NULL,
    beneficio VARCHAR(255) NOT NULL,
    pontos_necessarios INT UNSIGNED NOT NULL,
    validade_dias INT UNSIGNED NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preserva os vouchers existentes: o novo vínculo é opcional.
SET @catalogo_ddl = IF(
    EXISTS (SELECT 1 FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_voucher'
              AND COLUMN_NAME = 'id_voucher_catalogo'),
    'SELECT 1',
    'ALTER TABLE tbl_voucher ADD COLUMN id_voucher_catalogo INT UNSIGNED NULL'
);
PREPARE catalogo_stmt FROM @catalogo_ddl;
EXECUTE catalogo_stmt;
DEALLOCATE PREPARE catalogo_stmt;

SET @catalogo_ddl = IF(
    EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_voucher'
              AND COLUMN_NAME = 'id_voucher_catalogo'
              AND REFERENCED_TABLE_NAME = 'tbl_voucher_catalogo'
              AND REFERENCED_COLUMN_NAME = 'id'),
    'SELECT 1',
    'ALTER TABLE tbl_voucher ADD CONSTRAINT fk_voucher_catalogo FOREIGN KEY (id_voucher_catalogo) REFERENCES tbl_voucher_catalogo(id) ON UPDATE CASCADE ON DELETE RESTRICT'
);
PREPARE catalogo_stmt FROM @catalogo_ddl;
EXECUTE catalogo_stmt;
DEALLOCATE PREPARE catalogo_stmt;
