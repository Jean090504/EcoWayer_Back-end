/*****************************************************************************
 * Objetivo: Controller da tabela tbl_regra_pontuacao
 *           (exibe e grava as condições da regra via regra_pontuacao_condicao_controler)
 * Local: controller/regra_pontuacao/regra_pontuacao_controler.js
 *
 * As mensagens estão neste arquivo (bloco MENSAGENS) no mesmo formato JSON da
 * API. Para usar o controller/modulo/configMessages.js, troque apenas esse bloco
 * e a função resposta().
 *****************************************************************************/

const regraDAO = require('../../model/DAO/regra_pontuacao/regra_pontuacao.js')
const regraCondicaoDAO = require('../../model/DAO/regra_pontuacao_condicao/regra_pontuacao_condicao.js')
const controlerRegraCondicao = require('./regra_pontuacao_condicao_controler.js') // relação regra <-> condição

// ---------------------------------------------------------------------------
// MENSAGENS (cabeçalho padrão da API + status)
// ---------------------------------------------------------------------------
const CABECALHO = {
    api_description: 'API para gerenciar o controle do EcoWayer',
    development: 'Maxwillian Santana',
    version: '1.0.4.26'
}

const MENSAGENS = {
    SUCCESS_REQUEST:          { status: true,  status_code: 200, message: 'Requisição bem-sucedida.' },
    SUCCESS_CREATED_ITEM:     { status: true,  status_code: 201, message: 'Item criado com sucesso.' },
    SUCCESS_UPDATED_ITEM:     { status: true,  status_code: 200, message: 'Item atualizado com sucesso.' },
    SUCCESS_DELETED_ITEM:     { status: true,  status_code: 200, message: 'Item excluído com sucesso.' },
    ERROR_REQUIRED_FIELDS:    { status: false, status_code: 400, message: 'Existem campos obrigatórios ausentes ou inválidos.' },
    ERROR_NOT_FOUND:          { status: false, status_code: 404, message: 'Nenhum item encontrado.' },
    ERROR_CATEGORIA_NOT_FOUND:{ status: false, status_code: 404, message: 'A categoria informada não existe.' },
    ERROR_CONFLICT:           { status: false, status_code: 409, message: 'Esta categoria já possui uma regra de pontuação.' },
    ERROR_IN_USE:             { status: false, status_code: 409, message: 'Não é possível excluir: a regra já gerou pontos. Desative-a em vez de excluir.' },
    ERROR_CONTENT_TYPE:       { status: false, status_code: 415, message: 'O content-type deve ser application/json.' },
    ERROR_INTERNAL_SERVER_MODEL:      { status: false, status_code: 500, message: 'Erro interno ao acessar o banco de dados.' },
    ERROR_INTERNAL_SERVER_CONTROLLER: { status: false, status_code: 500, message: 'Erro interno no servidor (controller).' }
}

const resposta = function (tipo, response, mensagem) {
    const corpo = { ...CABECALHO, ...tipo }
    if (mensagem) corpo.message = mensagem
    if (response !== undefined) corpo.response = response
    return corpo
}

// ---------------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------------------------
const contentTypeValido = (contentType) =>
    String(contentType).toLowerCase().includes('application/json')

// aceita 1/0, true/false, '1'/'0', 'true'/'false', 'ativo'/'inativo'. Retorna 1, 0 ou null (inválido)
const paraTinyint = function (valor) {
    if (valor === true || valor === 1 || valor === '1' || valor === 'true' || valor === 'ativo') return 1
    if (valor === false || valor === 0 || valor === '0' || valor === 'false' || valor === 'inativo') return 0
    return null
}

const idValido = function (id) {
    const n = Number(id)
    return Number.isInteger(n) && n > 0 ? n : null
}

// converte a linha do banco no JSON da API (categoria aninhada)
const formatarRegra = (r) => ({
    id: r.id,
    pontos_base: r.categoria_pontos,   // vem de tbl_categoria.pontos (somente leitura aqui)
    bonus_campanha_percentual: Number(r.bonus_campanha_percentual),
    bonus_campanha_ativo: Boolean(r.bonus_campanha_ativo),
    status: Boolean(r.status),
    data_criacao: r.data_criacao,
    data_atualizacao: r.data_atualizacao,
    categoria: {
        id: r.id_categoria,
        nome: r.categoria_nome,
        pontos: r.categoria_pontos,
        img: r.categoria_img,
        cor: r.categoria_cor,
        id_tipo_categoria: r.categoria_id_tipo_categoria
    }
})

// Formata a regra e anexa as condições (regra.condicao = [ { ...condicao_item, multiplicador } ], [] se não houver)
const montarRegra = async function (linha) {
    const regra = formatarRegra(linha)
    await controlerRegraCondicao.anexarCondicoesARegra(regra)
    return regra
}

// Valida e normaliza o body. `base` traz os valores atuais (PUT/PATCH parcial).
// Retorna { erro } ou { dados }
const validarDados = function (body, base = {}) {
    const dados = {}

    // percentual do bônus: 0 a 100, até 2 casas
    const percentualBruto = body.bonus_campanha_percentual ?? base.bonus_campanha_percentual ?? 0
    const percentual = Number(percentualBruto)
    if (percentualBruto === '' || !Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
        return { erro: 'bonus_campanha_percentual deve ser um número entre 0 e 100.' }
    }
    dados.bonus_campanha_percentual = Math.round(percentual * 100) / 100

    const bonusAtivo = paraTinyint(body.bonus_campanha_ativo ?? base.bonus_campanha_ativo ?? 0)
    if (bonusAtivo === null) return { erro: 'bonus_campanha_ativo deve ser true ou false.' }
    dados.bonus_campanha_ativo = bonusAtivo

    const status = paraTinyint(body.status ?? base.status ?? 1)
    if (status === null) return { erro: 'status deve ser true/false (ou "ativo"/"inativo").' }
    dados.status = status

    return { dados }
}

// "condicao" é opcional. Retorna { erro } ou { condicoes } (null = não veio no body, mantém as atuais)
const validarCondicoes = async function (body) {
    if (body.condicao === undefined) return { condicoes: null }

    const invalido = await controlerRegraCondicao.validarListaCondicoes(body.condicao)
    if (invalido) return { erro: invalido.field }

    return { condicoes: controlerRegraCondicao.normalizarListaCondicoes(body.condicao) }
}

// ---------------------------------------------------------------------------
// CONSULTAS
// ---------------------------------------------------------------------------
const listarRegraPontuacao = async function () {
    try {
        const rows = await regraDAO.selectAllRegraPontuacao()
        if (rows === false) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        const regras = []
        for (const linha of rows) {
            regras.push(await montarRegra(linha))
        }

        return resposta(MENSAGENS.SUCCESS_REQUEST, { count: regras.length, regra_pontuacao: regras })
    } catch (error) {
        console.error('[Controller regra_pontuacao] listar:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

const buscarRegraPontuacao = async function (id) {
    try {
        const idRegra = idValido(id)
        if (!idRegra) return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, 'O id informado é inválido.')

        const rows = await regraDAO.selectByIdRegraPontuacao(idRegra)
        if (rows === false) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
        if (rows.length === 0) return resposta(MENSAGENS.ERROR_NOT_FOUND)

        return resposta(MENSAGENS.SUCCESS_REQUEST, { regra_pontuacao: await montarRegra(rows[0]) })
    } catch (error) {
        console.error('[Controller regra_pontuacao] buscar:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

// ---------------------------------------------------------------------------
// INSERIR
// ---------------------------------------------------------------------------
const inserirRegraPontuacao = async function (body, contentType) {
    try {
        if (!contentTypeValido(contentType)) return resposta(MENSAGENS.ERROR_CONTENT_TYPE)

        const idCategoria = idValido(body?.id_categoria)
        if (!idCategoria) {
            return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, 'id_categoria é obrigatório e deve ser um número válido.')
        }

        const validacao = validarDados(body)
        if (validacao.erro) return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, validacao.erro)

        const validacaoCondicoes = await validarCondicoes(body)
        if (validacaoCondicoes.erro) return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, validacaoCondicoes.erro)

        const existe = await regraDAO.categoriaExiste(idCategoria)
        if (existe === null) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
        if (!existe) return resposta(MENSAGENS.ERROR_CATEGORIA_NOT_FOUND)

        const jaTemRegra = await regraDAO.selectByIdCategoria(idCategoria)
        if (jaTemRegra === false) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
        if (jaTemRegra.length > 0) return resposta(MENSAGENS.ERROR_CONFLICT)

        const novoId = await regraDAO.insertRegraPontuacao({ id_categoria: idCategoria, ...validacao.dados })
        if (!novoId) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        // grava as condições; se falhar, desfaz para não deixar regra incompleta
        const condicoes = validacaoCondicoes.condicoes
        if (condicoes && condicoes.length > 0) {
            const gravou = await controlerRegraCondicao.inserirCondicoesDaRegra(novoId, condicoes)

            if (!gravou) {
                await controlerRegraCondicao.excluirCondicoesIdRegra(novoId)
                await regraDAO.deleteRegraPontuacao(novoId)
                return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
            }
        }

        const criada = await buscarRegraPontuacao(novoId)
        return resposta(MENSAGENS.SUCCESS_CREATED_ITEM, criada.response)
    } catch (error) {
        console.error('[Controller regra_pontuacao] inserir:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

// ---------------------------------------------------------------------------
// ATUALIZAR (bônus, status e condições; a categoria de uma regra não muda)
// ---------------------------------------------------------------------------
const atualizarRegraPontuacao = async function (body, id, contentType) {
    try {
        if (!contentTypeValido(contentType)) return resposta(MENSAGENS.ERROR_CONTENT_TYPE)

        const atual = await buscarRegraPontuacao(id)
        if (atual.status_code !== 200) return atual

        const regraAtual = atual.response.regra_pontuacao
        const validacao = validarDados(body ?? {}, regraAtual)
        if (validacao.erro) return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, validacao.erro)

        // se "condicao" não vier no body, as condições atuais são mantidas
        const validacaoCondicoes = await validarCondicoes(body ?? {})
        if (validacaoCondicoes.erro) return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, validacaoCondicoes.erro)

        const ok = await regraDAO.updateRegraPontuacao(regraAtual.id, validacao.dados)
        if (!ok) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        // troca as condições antigas pela lista nova
        if (validacaoCondicoes.condicoes !== null) {
            const gravou = await controlerRegraCondicao.substituirCondicoesDaRegra(regraAtual.id, validacaoCondicoes.condicoes)
            if (!gravou) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
        }

        const atualizada = await buscarRegraPontuacao(regraAtual.id)
        return resposta(MENSAGENS.SUCCESS_UPDATED_ITEM, atualizada.response)
    } catch (error) {
        console.error('[Controller regra_pontuacao] atualizar:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

// PATCH /:id/status  { "status": true | false }  (botão Ativar/Desativar da tabela)
const atualizarStatusRegraPontuacao = async function (body, id, contentType) {
    try {
        if (!contentTypeValido(contentType)) return resposta(MENSAGENS.ERROR_CONTENT_TYPE)

        const status = paraTinyint(body?.status)
        if (status === null) {
            return resposta(MENSAGENS.ERROR_REQUIRED_FIELDS, undefined, 'status é obrigatório: true/false (ou "ativo"/"inativo").')
        }

        const atual = await buscarRegraPontuacao(id)
        if (atual.status_code !== 200) return atual

        const regraId = atual.response.regra_pontuacao.id
        const ok = await regraDAO.updateStatusRegraPontuacao(regraId, status)
        if (!ok) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        const atualizada = await buscarRegraPontuacao(regraId)
        return resposta(MENSAGENS.SUCCESS_UPDATED_ITEM, atualizada.response)
    } catch (error) {
        console.error('[Controller regra_pontuacao] atualizarStatus:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

// ---------------------------------------------------------------------------
// EXCLUIR
// ---------------------------------------------------------------------------
const excluirRegraPontuacao = async function (id) {
    try {
        const atual = await buscarRegraPontuacao(id)
        if (atual.status_code !== 200) return atual

        const regraId = atual.response.regra_pontuacao.id

        // guarda as condições para restaurar caso a regra não possa ser excluída (ex.: EM_USO)
        const antigas = await regraCondicaoDAO.selectCondicoesByIdRegra(regraId)
        if (antigas === false) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        // remove primeiro os vínculos (filhas) para não dar erro de chave estrangeira
        const apagouCondicoes = await controlerRegraCondicao.excluirCondicoesIdRegra(regraId)
        if (!apagouCondicoes.status) return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)

        const resultado = await regraDAO.deleteRegraPontuacao(regraId)

        if (!resultado || resultado === 'EM_USO') {
            // a regra continua existindo: devolve as condições que foram apagadas
            if (antigas.length > 0) {
                await controlerRegraCondicao.inserirCondicoesDaRegra(regraId, antigas.map(r => ({
                    id_condicao_item: r.id_condicao_item,
                    multiplicador: Number(r.multiplicador)
                })))
            }

            return resultado === 'EM_USO'
                ? resposta(MENSAGENS.ERROR_IN_USE)
                : resposta(MENSAGENS.ERROR_INTERNAL_SERVER_MODEL)
        }

        return resposta(MENSAGENS.SUCCESS_DELETED_ITEM)
    } catch (error) {
        console.error('[Controller regra_pontuacao] excluir:', error.message)
        return resposta(MENSAGENS.ERROR_INTERNAL_SERVER_CONTROLLER)
    }
}

module.exports = {
    listarRegraPontuacao,
    buscarRegraPontuacao,
    inserirRegraPontuacao,
    atualizarRegraPontuacao,
    atualizarStatusRegraPontuacao,
    excluirRegraPontuacao
}