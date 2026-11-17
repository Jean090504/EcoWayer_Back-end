/* Conta de teste para validar o login do aplicativo mobile. */

START TRANSACTION;

SET @email = 'teste.mobile@ecowayer.local';
SET @telefone = '11987654321';
SET @cpf = '391.846.205-60';
SET @genero_id = (SELECT id FROM tbl_genero ORDER BY id LIMIT 1);
SET @status_id = (SELECT id FROM tbl_status_usuario WHERE status = 'ativo' LIMIT 1);
SET @nivel_id = (SELECT id FROM tbl_nivel_impacto ORDER BY numero LIMIT 1);
SET @imagem_id = (
    SELECT i.id
    FROM tbl_imagem i
    INNER JOIN tbl_tipo_imagem ti ON ti.id = i.id_tipo_imagem
    WHERE LOWER(ti.tipo) = 'perfil'
    ORDER BY i.id
    LIMIT 1
);

SET @usuario_existente = (
    SELECT e.id_usuario
    FROM tbl_email e
    WHERE LOWER(e.email) = LOWER(@email)
    LIMIT 1
);

INSERT INTO tbl_usuario
    (nome, cpf, data_nascimento, id_imagem, id_genero, id_status_usuario, id_nivel_impacto)
SELECT
    'Usuario Teste Mobile',
    @cpf,
    '2000-01-15',
    @imagem_id,
    @genero_id,
    @status_id,
    @nivel_id
WHERE @usuario_existente IS NULL;

SET @usuario_id = COALESCE(@usuario_existente, LAST_INSERT_ID());

INSERT INTO tbl_email (email, codigo_verificacao, id_usuario)
SELECT @email, 'A7K2Q9', @usuario_id
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_email WHERE id_usuario = @usuario_id
);

SET @email_id = (
    SELECT id FROM tbl_email WHERE id_usuario = @usuario_id LIMIT 1
);

INSERT INTO tbl_telefone (numero, codigo_verificacao, id_usuario)
SELECT @telefone, 'M4X8P1', @usuario_id
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_telefone WHERE id_usuario = @usuario_id
);

INSERT INTO tbl_conta (senha, id_email)
SELECT '$2b$10$GyTqKf7hFyajB/fWU6FUluBBcMy3Kn9.4ZMQSyYVL9dOzPzhTTjO2', @email_id
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_conta WHERE id_email = @email_id
);

COMMIT;

SELECT u.id, u.nome, e.email, t.numero
FROM tbl_usuario u
INNER JOIN tbl_email e ON e.id_usuario = u.id
LEFT JOIN tbl_telefone t ON t.id_usuario = u.id
WHERE u.id = @usuario_id;
