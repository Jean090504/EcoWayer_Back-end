USE ecowayer_db;

-- Cada linha vincula um anúncio a uma foto. A ordem 1 identifica a capa.
-- As fotos antigas mantêm a ordem original pelo ID do vínculo.
ALTER TABLE tbl_imagem_anuncio
    ADD COLUMN ordem TINYINT UNSIGNED NULL,
    ADD INDEX idx_imagem_anuncio_ordem (id_anuncio, ordem, id);
