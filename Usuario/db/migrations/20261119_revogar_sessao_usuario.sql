CREATE TABLE IF NOT EXISTS tbl_sessao_usuario_revogada (
    id_token CHAR(36) NOT NULL PRIMARY KEY,
    expira_em DATETIME NOT NULL,
    INDEX idx_sessao_revogada_expira_em (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
