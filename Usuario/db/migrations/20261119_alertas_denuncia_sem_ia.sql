-- Execute no banco compartilhado pelas APIs Usuario e Admin.
-- Chamados abertos por denúncias de usuários podem não ter uma IA associada.
ALTER TABLE tbl_alertas MODIFY COLUMN id_ia INT NULL;
