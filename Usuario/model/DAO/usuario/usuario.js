/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Usuário
 *           (e nas tabelas filhas: email, telefone, conta e endereco_usuario)
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// Tipo de imagem usado para achar a imagem padrão de avatar (tbl_tipo_imagem.tipo)
const TIPO_IMAGEM_PERFIL = 'perfil'

// Tabelas que podem ser consultadas por selectExisteId (evita SQL injection no nome da tabela)
const TABELAS_PERMITIDAS = ['tbl_genero', 'tbl_imagem', 'tbl_endereco']

// Base do SELECT de usuário: nunca traz senha nem código de verificação.
const SQL_SELECT_USUARIO = `SELECT u.id, u.nome, u.cpf,
        DATE_FORMAT(u.data_nascimento, '%Y-%m-%d') AS data_nascimento,
        DATE_FORMAT(u.data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro,
        u.id_genero, g.nome AS genero,
        u.id_imagem, i.url AS imagem,
        s.status,
        u.id_nivel_impacto, n.nome AS nivel_impacto, n.numero AS numero_nivel,
        e.email, t.numero AS telefone
    FROM tbl_usuario u
    INNER JOIN tbl_genero g ON g.id = u.id_genero
    INNER JOIN tbl_imagem i ON i.id = u.id_imagem
    INNER JOIN tbl_status_usuario s ON s.id = u.id_status_usuario
    INNER JOIN tbl_nivel_impacto n ON n.id = u.id_nivel_impacto
    LEFT JOIN tbl_email e ON e.id_usuario = u.id
    LEFT JOIN tbl_telefone t ON t.id_usuario = u.id`

// Cadastro completo em transação: se qualquer insert falhar, nada é gravado.
// Devolve o id do usuário criado (ou false).
const insertUsuario = async function (usuario) {
    try {
        let idUsuario = await knexConex.transaction(async function (trx) {
            let resultUsuario = await trx.raw(
                `INSERT INTO tbl_usuario (nome, cpf, data_nascimento, id_imagem, id_genero, id_status_usuario, id_nivel_impacto)
                 VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [usuario.nome, usuario.cpf, usuario.data_nascimento, usuario.id_imagem, usuario.id_genero, usuario.id_status_usuario, usuario.id_nivel_impacto]
            )
            let id = resultUsuario[0].insertId

            let resultEmail = await trx.raw(
                `INSERT INTO tbl_email (email, codigo_verificacao, id_usuario) VALUES (?, ?, ?);`,
                [usuario.email, usuario.codigo_email, id]
            )

            await trx.raw(
                `INSERT INTO tbl_telefone (numero, codigo_verificacao, id_usuario) VALUES (?, ?, ?);`,
                [usuario.telefone, usuario.codigo_telefone, id]
            )

            await trx.raw(
                `INSERT INTO tbl_conta (senha, id_email) VALUES (?, ?);`,
                [usuario.senha, resultEmail[0].insertId]
            )

            await trx.raw(
                `INSERT INTO tbl_endereco_usuario (id_endereco, id_usuario) VALUES (?, ?);`,
                [usuario.id_endereco, id]
            )

            return id
        })

        return idUsuario ? idUsuario : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Atualiza só o perfil. CPF, e-mail, telefone e senha não são alterados por aqui.
const updateUsuario = async function (usuario) {
    try {
        let sql = `UPDATE tbl_usuario SET nome = ?, data_nascimento = ?, id_genero = ?, id_imagem = ? WHERE id = ?;`
        let result = await knexConex.raw(sql, [usuario.nome, usuario.data_nascimento, usuario.id_genero, usuario.id_imagem, usuario.id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectByIdUsuario = async function (id) {
    try {
        let sql = `${SQL_SELECT_USUARIO} WHERE u.id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const selectAllUsuario = async function () {
    try {
        let sql = `${SQL_SELECT_USUARIO};`
        let result = await knexConex.raw(sql)

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Endereços do usuário (tbl_endereco_usuario é filha de usuário, sem endpoint próprio)
const selectEnderecosByUsuario = async function (id) {
    try {
        let sql = `SELECT e.id, e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado, e.sigla, e.latitude, e.longitude
                   FROM tbl_endereco_usuario eu
                   INNER JOIN tbl_endereco e ON e.id = eu.id_endereco
                   WHERE eu.id_usuario = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Quais dados já estão cadastrados (cpf, email, telefone). Devolve [{ campo: 'cpf' }, ...]
const selectDuplicados = async function (usuario) {
    try {
        let sql = `SELECT 'cpf' AS campo FROM tbl_usuario WHERE cpf = ?
                   UNION ALL
                   SELECT 'email' AS campo FROM tbl_email WHERE email = ?
                   UNION ALL
                   SELECT 'telefone' AS campo FROM tbl_telefone WHERE numero = ?;`
        let result = await knexConex.raw(sql, [usuario.cpf, usuario.email, usuario.telefone])

        if (Array.isArray(result)) {
            return result[0]
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Confere se um id existe em genero, imagem ou endereco. Devolve 0, 1 ou false (erro).
const selectExisteId = async function (tabela, id) {
    try {
        if (!TABELAS_PERMITIDAS.includes(tabela)) {
            return false
        }

        let sql = `SELECT COUNT(*) AS total FROM ${tabela} WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        if (Array.isArray(result)) {
            return Number(result[0][0].total)
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

// Valores padrão do cadastro: devolvem [{ id }] (vazio se não existir) ou false (erro).
const selectIdStatusPorNome = async function (status) {
    try {
        let result = await knexConex.raw(`SELECT id FROM tbl_status_usuario WHERE status = ? LIMIT 1;`, [status])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Nível inicial = o de menor número (nível 1)
const selectIdNivelInicial = async function () {
    try {
        let result = await knexConex.raw(`SELECT id FROM tbl_nivel_impacto ORDER BY numero ASC LIMIT 1;`)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// Imagem padrão de avatar = a primeira imagem cujo tipo é 'perfil'
const selectIdImagemPadrao = async function () {
    try {
        let sql = `SELECT i.id FROM tbl_imagem i
                   INNER JOIN tbl_tipo_imagem t ON t.id = i.id_tipo_imagem
                   WHERE t.tipo = ?
                   ORDER BY i.id ASC LIMIT 1;`
        let result = await knexConex.raw(sql, [TIPO_IMAGEM_PERFIL])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

// "Excluir" usuário = desativar a conta. Um DELETE de verdade falharia por causa dos vínculos
// (anúncios, pontos, entregas, mensagens...) e apagaria o histórico.
const desativarUsuario = async function (id) {
    try {
        let sql = `UPDATE tbl_usuario
                   SET id_status_usuario = (SELECT id FROM tbl_status_usuario WHERE status = 'desativado' LIMIT 1)
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertUsuario,
    updateUsuario,
    selectByIdUsuario,
    selectAllUsuario,
    selectEnderecosByUsuario,
    selectDuplicados,
    selectExisteId,
    selectIdStatusPorNome,
    selectIdNivelInicial,
    selectIdImagemPadrao,
    desativarUsuario
}