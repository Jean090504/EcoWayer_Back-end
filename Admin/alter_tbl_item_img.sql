-- Execute uma vez no banco caso tbl_item ainda não possua a coluna de imagem.
ALTER TABLE tbl_item ADD COLUMN img VARCHAR(500) NULL;
