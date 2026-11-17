-- Estrutura e dados mínimos para a carteira do usuário no ambiente local.
-- Pode ser executado mais de uma vez sem duplicar os registros de teste.

-- O catálogo oficial é administrado pelo painel Admin e fica nesta mesma base.
-- Esta declaração mantém o ambiente do backend Usuario reproduzível.
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

CREATE TABLE IF NOT EXISTS tbl_missao (
    id INT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    meta INT NOT NULL,
    periodo_dias INT NOT NULL,
    pontos_bonus INT NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_voucher_catalogo (
    id INT NOT NULL AUTO_INCREMENT,
    nome_parceiro VARCHAR(120) NOT NULL,
    beneficio VARCHAR(255) NOT NULL,
    pontos_necessarios INT NOT NULL,
    validade_dias INT NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tbl_usuario_missao (
    id INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_missao INT NOT NULL,
    progresso INT NOT NULL DEFAULT 0,
    status ENUM('em andamento', 'concluida', 'expirada') NOT NULL DEFAULT 'em andamento',
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_missao (id_usuario, id_missao),
    KEY fk_usuario_missao_usuario (id_usuario),
    KEY fk_usuario_missao_missao (id_missao),
    CONSTRAINT fk_usuario_missao_usuario FOREIGN KEY (id_usuario) REFERENCES tbl_usuario (id),
    CONSTRAINT fk_usuario_missao_missao FOREIGN KEY (id_missao) REFERENCES tbl_missao (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO tbl_missao (titulo, descricao, meta, periodo_dias, pontos_bonus, ativo)
SELECT 'Primeira entrega', 'Faça sua primeira entrega de material reciclável.', 1, 7, 100, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_missao WHERE titulo = 'Primeira entrega');

INSERT INTO tbl_missao (titulo, descricao, meta, periodo_dias, pontos_bonus, ativo)
SELECT 'Reciclador da semana', 'Entregue materiais recicláveis nesta semana.', 3, 7, 150, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_missao WHERE titulo = 'Reciclador da semana');

INSERT INTO tbl_missao (titulo, descricao, meta, periodo_dias, pontos_bonus, ativo)
SELECT 'Separe o plástico', 'Leve plástico para um ponto de coleta.', 5, 30, 250, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_missao WHERE titulo = 'Separe o plástico');

INSERT INTO tbl_voucher_catalogo (nome_parceiro, beneficio, pontos_necessarios, validade_dias, ativo)
SELECT 'Eco Café', '10% de desconto em bebidas', 200, 30, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_voucher_catalogo WHERE nome_parceiro = 'Eco Café');

INSERT INTO tbl_voucher_catalogo (nome_parceiro, beneficio, pontos_necessarios, validade_dias, ativo)
SELECT 'Mercado Verde', 'R$ 15,00 de desconto em compras sustentáveis', 400, 30, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_voucher_catalogo WHERE nome_parceiro = 'Mercado Verde');

INSERT INTO tbl_voucher_catalogo (nome_parceiro, beneficio, pontos_necessarios, validade_dias, ativo)
SELECT 'Bike Expresso', '20% de desconto no aluguel de bicicleta', 600, 15, 1
WHERE NOT EXISTS (SELECT 1 FROM tbl_voucher_catalogo WHERE nome_parceiro = 'Bike Expresso');

-- Registros para a conta de teste mobile (id 12), somente se ainda não existirem.
INSERT INTO tbl_pontos (qntd_pontos, data_registro, id_categoria, id_usuario, id_entrega, id_regra_pontuacao)
SELECT 120, '2026-11-15 09:14:00', 5, 12, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM tbl_pontos WHERE id_usuario = 12 AND qntd_pontos = 120 AND data_registro = '2026-11-15 09:14:00');

INSERT INTO tbl_pontos (qntd_pontos, data_registro, id_categoria, id_usuario, id_entrega, id_regra_pontuacao)
SELECT 80, '2026-11-16 14:30:00', 4, 12, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM tbl_pontos WHERE id_usuario = 12 AND qntd_pontos = 80 AND data_registro = '2026-11-16 14:30:00');

INSERT INTO tbl_usuario_missao (id_usuario, id_missao, progresso, status, data_inicio, data_fim)
SELECT 12, id, 2, 'em andamento', '2026-11-17 08:00:00', NULL
FROM tbl_missao WHERE titulo = 'Reciclador da semana'
  AND NOT EXISTS (SELECT 1 FROM tbl_usuario_missao WHERE id_usuario = 12 AND id_missao = tbl_missao.id);

INSERT INTO tbl_usuario_missao (id_usuario, id_missao, progresso, status, data_inicio, data_fim)
SELECT 12, id, 1, 'concluida', '2026-11-10 08:00:00', '2026-11-12 16:00:00'
FROM tbl_missao WHERE titulo = 'Primeira entrega'
  AND NOT EXISTS (SELECT 1 FROM tbl_usuario_missao WHERE id_usuario = 12 AND id_missao = tbl_missao.id);
