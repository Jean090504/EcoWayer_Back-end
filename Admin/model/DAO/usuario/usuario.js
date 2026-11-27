/************************************************************************************
 * Objetivo: Arquivo responsável pelo CRUD no Banco de dados MySQL na tabela Usuario
 * Autor : Maxwillian
 * Versão :1.0
**************************************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

// data_cadastro não entra no INSERT: o banco preenche com CURRENT_TIMESTAMP
const insertUsuario = async function (usuario) {
    try {
        let sql = `INSERT INTO tbl_usuario
                       (nome, cpf, data_nascimento, id_imagem, id_genero, id_status_usuario, id_nivel_impacto)
                   VALUES (?, ?, ?, ?, ?, ?, ?);`
        let result = await knexConex.raw(sql, [
            usuario.nome,
            usuario.cpf,
            usuario.data_nascimento,
            usuario.id_imagem,
            usuario.id_genero,
            usuario.id_status_usuario,
            usuario.id_nivel_impacto
        ])

        if (Array.isArray(result) && result[0].insertId) {
            return result[0].insertId
        } else {
            return false
        }
    } catch (error) {
        console.log(error)
        return false
    }
}

// data_cadastro também não entra no UPDATE: a data do cadastro não deve mudar
const updateUsuario = async function (usuario) {
    try {
        let sql = `UPDATE tbl_usuario SET
                       nome = ?, cpf = ?, data_nascimento = ?, id_imagem = ?,
                       id_genero = ?, id_status_usuario = ?, id_nivel_impacto = ?
                   WHERE id = ?;`
        let result = await knexConex.raw(sql, [
            usuario.nome,
            usuario.cpf,
            usuario.data_nascimento,
            usuario.id_imagem,
            usuario.id_genero,
            usuario.id_status_usuario,
            usuario.id_nivel_impacto,
            usuario.id
        ])

        return result ? true : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Os selects trazem os id_... só para o controller consultar as tabelas relacionadas.
// O controller remove esses campos antes de responder.
// DATE_FORMAT evita que a data volte como "2000-05-10T03:00:00.000Z" (problema de fuso).
const updateStatusUsuario = async function (id, idStatus) {
    return knexConex('tbl_usuario').where({ id }).update({ id_status_usuario: idStatus })
}

// Consulta compacta para o painel; cada usuário aparece apenas uma vez.
const listarUsuariosAdmin = async function ({ busca = '', status = '', pagina = 1, limite = 20 }) {
    const consulta = knexConex('tbl_usuario as u')
        .leftJoin('tbl_status_usuario as s', 's.id', 'u.id_status_usuario')
    if (status) consulta.where('s.status', status)
    if (busca) {
        const termo = `%${busca.replace(/[\\%_]/g, '\\$&')}%`
        consulta.where(function () {
            this.where('u.nome', 'like', termo)
                .orWhereExists(function () {
                    this.select(knexConex.raw('1')).from('tbl_email as e')
                        .whereRaw('e.id_usuario = u.id').where('e.email', 'like', termo)
                })
        })
    }
    const [{ total }] = await consulta.clone().count({ total: 'u.id' })
    const usuarios = await consulta.clone()
        .select('u.id', 'u.nome', 's.status')
        .select(knexConex.raw("DATE_FORMAT(u.data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro"))
        .select(knexConex.raw('(SELECT MIN(e.email) FROM tbl_email e WHERE e.id_usuario = u.id) AS email'))
        .select(knexConex.raw('(SELECT MIN(t.numero) FROM tbl_telefone t WHERE t.id_usuario = u.id) AS telefone'))
        .select(knexConex.raw("(SELECT DATE_FORMAT(MAX(a.data_acesso), '%Y-%m-%d %H:%i:%s') FROM tbl_acesso a WHERE a.id_usuario = u.id) AS ultimo_acesso"))
        .orderBy('u.id', 'desc').limit(limite).offset((pagina - 1) * limite)
    return { usuarios, total: Number(total), pagina, limite }
}

const selectByIdUsuario = async function (id) {
    try {
        let sql = `SELECT id, nome, cpf,
                          DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                          DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro,
                          id_imagem, id_genero, id_status_usuario, id_nivel_impacto
                   FROM tbl_usuario WHERE id = ?;`
        let result = await knexConex.raw(sql, [id])

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        return false
    }
}

const selectAllUsuario = async function () {
    try {
        let sql = `SELECT id, nome, cpf,
                          DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                          DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') AS data_cadastro,
                          id_imagem, id_genero, id_status_usuario, id_nivel_impacto
                   FROM tbl_usuario ORDER BY id DESC;`
        let result = await knexConex.raw(sql)

        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertUsuario,
    updateUsuario,
    updateStatusUsuario,
    listarUsuariosAdmin,
    selectByIdUsuario,
    selectAllUsuario
}
