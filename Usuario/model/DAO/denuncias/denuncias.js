/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_denuncias e de suas tabelas de vínculo
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertDenuncia = async function (denuncia) {
    try {
        let sql = `insert into tbl_denuncias (descricao, id_tipo_denuncias, id_denunciante)
                   values (?, ?, ?)`
        let result = await knexConex.raw(sql, [
            denuncia.descricao, denuncia.id_tipo_denuncias, denuncia.id_denunciante
        ])

        if (result)
            return result[0].insertId
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateDenuncia = async function (denuncia) {
    try {
        let sql = `update tbl_denuncias
                      set descricao = ?, id_tipo_denuncias = ?, id_denunciante = ?
                    where id = ?`
        let result = await knexConex.raw(sql, [
            denuncia.descricao, denuncia.id_tipo_denuncias, denuncia.id_denunciante, denuncia.id
        ])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllDenuncias = async function () {
    try {
        let result = await knexConex.raw(`select * from tbl_denuncias order by id`)

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectDenunciaById = async function (id) {
    try {
        let result = await knexConex.raw(`select * from tbl_denuncias where id = ?`, [id])

        if (result)
            return result[0]
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Confere se uma FK existe (tabelas permitidas fixas, para não montar SQL com texto livre)
const selectExiste = async function (tabela, id) {
    try {
        const tabelasPermitidas = ['tbl_tipo_denuncias', 'tbl_usuario', 'tbl_mensagens', 'tbl_imagem']
        if (!tabelasPermitidas.includes(tabela)) return false

        let result = await knexConex.raw(`select id from ${tabela} where id = ?`, [id])
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

// Quantos vínculos de moderação a denúncia tem. Usado antes de excluir.
const countDependenciasDenuncia = async function (id) {
    try {
        let sql = `select
                       (select count(*) from tbl_denuncias_anuncio where id_denuncias = ?) +
                       (select count(*) from tbl_alertas_denuncias where id_denuncias = ?) as total`
        let result = await knexConex.raw(sql, [id, id])

        return Array.isArray(result) ? Number(result[0][0].total) : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteDenuncia = async function (id) {
    try {
        let result = await knexConex.raw(`delete from tbl_denuncias where id = ?`, [id])

        if (result)
            return result[0].affectedRows > 0
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

// ---------- Vínculos: denúncia x mensagem (tbl_denuncias_mensagens) ----------

const insertDenunciaMensagem = async function (idDenuncia, idMensagem) {
    try {
        let result = await knexConex.raw(
            `insert into tbl_denuncias_mensagens (id_denuncias, id_mensagens) values (?, ?)`,
            [idDenuncia, idMensagem]
        )
        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectMensagensByIdDenuncia = async function (idDenuncia) {
    try {
        let result = await knexConex.raw(
            `select m.id, m.texto, m.id_conversa, m.id_remetente
               from tbl_mensagens m
              inner join tbl_denuncias_mensagens dm on dm.id_mensagens = m.id
              where dm.id_denuncias = ?
              order by m.id`,
            [idDenuncia]
        )
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteDenunciaMensagensByIdDenuncia = async function (idDenuncia) {
    try {
        let result = await knexConex.raw(`delete from tbl_denuncias_mensagens where id_denuncias = ?`, [idDenuncia])
        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

// ---------- Vínculos: denúncia x imagem (tbl_imagem_denuncias) ----------

const insertImagemDenuncia = async function (idImagem, idDenuncia) {
    try {
        let result = await knexConex.raw(
            `insert into tbl_imagem_denuncias (id_imagem, id_denuncias) values (?, ?)`,
            [idImagem, idDenuncia]
        )
        return Array.isArray(result) && result[0].affectedRows > 0
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectImagensByIdDenuncia = async function (idDenuncia) {
    try {
        let result = await knexConex.raw(
            `select i.id, i.url, i.id_tipo_imagem
               from tbl_imagem i
              inner join tbl_imagem_denuncias idn on idn.id_imagem = i.id
              where idn.id_denuncias = ?
              order by i.id`,
            [idDenuncia]
        )
        return Array.isArray(result) ? result[0] : false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteImagemDenunciasByIdDenuncia = async function (idDenuncia) {
    try {
        let result = await knexConex.raw(`delete from tbl_imagem_denuncias where id_denuncias = ?`, [idDenuncia])
        return Array.isArray(result)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertDenuncia,
    updateDenuncia,
    selectAllDenuncias,
    selectDenunciaById,
    selectExiste,
    countDependenciasDenuncia,
    deleteDenuncia,
    insertDenunciaMensagem,
    selectMensagensByIdDenuncia,
    deleteDenunciaMensagensByIdDenuncia,
    insertImagemDenuncia,
    selectImagensByIdDenuncia,
    deleteImagemDenunciasByIdDenuncia
}