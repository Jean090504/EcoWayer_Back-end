/*****************************************************************************
 * Objetivo: DAO da tabela tbl_regra_pontuacao (acesso ao banco com Knex)
 * Local: model/DAO/regra_pontuacao/regra_pontuacao.js
 *****************************************************************************/

// Mesma linha do DAO de gênero. O resolvedor abaixo aceita o knexFile exportando
// uma instância do knex OU um objeto de configuração (puro ou por ambiente).
const knexConfig = require('../../../model/database_config_knex/knexFile.js')
const knex = typeof knexConfig.raw === 'function'
    ? knexConfig
    : require('knex')(knexConfig.client ? knexConfig : (knexConfig.development || knexConfig))

// SELECT base: regra + categoria (chave estrangeira aninhada no controller)
const SELECT_BASE = `
    select r.id,
           r.id_categoria,
           r.bonus_campanha_percentual,
           r.bonus_campanha_ativo,
           r.status,
           r.data_criacao,
           r.data_atualizacao,
           c.nome              as categoria_nome,
           c.pontos            as categoria_pontos,
           c.img               as categoria_img,
           c.cor               as categoria_cor,
           c.id_tipo_categoria as categoria_id_tipo_categoria
      from tbl_regra_pontuacao r
      join tbl_categoria c on c.id = r.id_categoria`

// Inserir uma regra. Retorna o id inserido ou false
const insertRegraPontuacao = async function (regra) {
    try {
        const sql = `
            insert into tbl_regra_pontuacao
                (id_categoria, bonus_campanha_percentual, bonus_campanha_ativo, status)
            values (?, ?, ?, ?)`

        const result = await knex.raw(sql, [
            regra.id_categoria,
            regra.bonus_campanha_percentual,
            regra.bonus_campanha_ativo,
            regra.status
        ])

        const id = result[0].insertId
        return id > 0 ? id : false
    } catch (error) {
        console.error('[DAO regra_pontuacao] insert:', error.message)
        return false
    }
}

// Atualizar bônus/status de uma regra (a categoria não muda). Retorna true ou false
const updateRegraPontuacao = async function (id, regra) {
    try {
        const sql = `
            update tbl_regra_pontuacao
               set bonus_campanha_percentual = ?,
                   bonus_campanha_ativo      = ?,
                   status                    = ?
             where id = ?`

        await knex.raw(sql, [
            regra.bonus_campanha_percentual,
            regra.bonus_campanha_ativo,
            regra.status,
            id
        ])
        return true
    } catch (error) {
        console.error('[DAO regra_pontuacao] update:', error.message)
        return false
    }
}

// Ativar / desativar (botão da tabela). Retorna true ou false
const updateStatusRegraPontuacao = async function (id, status) {
    try {
        await knex.raw('update tbl_regra_pontuacao set status = ? where id = ?', [status, id])
        return true
    } catch (error) {
        console.error('[DAO regra_pontuacao] updateStatus:', error.message)
        return false
    }
}

// Excluir. Retorna true, 'EM_USO' (já referenciada em tbl_pontos) ou false
// Os multiplicadores (tbl_regra_pontuacao_condicao) saem junto: ON DELETE CASCADE
const deleteRegraPontuacao = async function (id) {
    try {
        await knex.raw('delete from tbl_regra_pontuacao where id = ?', [id])
        return true
    } catch (error) {
        console.error('[DAO regra_pontuacao] delete:', error.message)
        return error.code === 'ER_ROW_IS_REFERENCED_2' ? 'EM_USO' : false
    }
}

// Listar todas. Retorna array (vazio se não houver) ou false
const selectAllRegraPontuacao = async function () {
    try {
        const result = await knex.raw(`${SELECT_BASE} order by c.nome`)
        return result[0]
    } catch (error) {
        console.error('[DAO regra_pontuacao] selectAll:', error.message)
        return false
    }
}

// Buscar por id. Retorna array (vazio se não existir) ou false
const selectByIdRegraPontuacao = async function (id) {
    try {
        const result = await knex.raw(`${SELECT_BASE} where r.id = ?`, [id])
        return result[0]
    } catch (error) {
        console.error('[DAO regra_pontuacao] selectById:', error.message)
        return false
    }
}

// Buscar a regra de uma categoria (cada categoria tem no máximo uma). Array ou false
const selectByIdCategoria = async function (idCategoria) {
    try {
        const result = await knex.raw(`${SELECT_BASE} where r.id_categoria = ?`, [idCategoria])
        return result[0]
    } catch (error) {
        console.error('[DAO regra_pontuacao] selectByIdCategoria:', error.message)
        return false
    }
}

// Verifica se a categoria existe. Retorna true, false (não existe) ou null (erro)
const categoriaExiste = async function (idCategoria) {
    try {
        const result = await knex.raw('select id from tbl_categoria where id = ?', [idCategoria])
        return result[0].length > 0
    } catch (error) {
        console.error('[DAO regra_pontuacao] categoriaExiste:', error.message)
        return null
    }
}

module.exports = {
    insertRegraPontuacao,
    updateRegraPontuacao,
    updateStatusRegraPontuacao,
    deleteRegraPontuacao,
    selectAllRegraPontuacao,
    selectByIdRegraPontuacao,
    selectByIdCategoria,
    categoriaExiste
}