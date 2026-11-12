/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_missao (desafios com bônus de pontos)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const missaoDAO = require('../../model/DAO/missao/missao.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inteiroPositivo = (valor) =>
    valor !== '' && valor !== null && valor !== undefined &&
    Number.isInteger(Number(valor)) && Number(valor) > 0

const validarDados = function (missao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!missao || typeof missao !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let titulo = typeof missao.titulo === 'string' ? missao.titulo.trim() : ''
    let descricao = typeof missao.descricao === 'string' ? missao.descricao.trim() : ''

    if (titulo.length < 1 || titulo.length > 100) {
        message.ERROR_BAD_REQUEST.field = '[TITULO] INVÁLIDO (1 a 100 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (descricao.length < 1) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (não pode ser vazia)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(missao.meta)) {
        message.ERROR_BAD_REQUEST.field = '[META] INVÁLIDA (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(missao.periodo_dias)) {
        message.ERROR_BAD_REQUEST.field = '[PERIODO_DIAS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(missao.pontos_bonus)) {
        message.ERROR_BAD_REQUEST.field = '[PONTOS_BONUS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (missao.ativo !== 0 && missao.ativo !== 1 && missao.ativo !== true && missao.ativo !== false) {
        message.ERROR_BAD_REQUEST.field = '[ATIVO] INVÁLIDO (use 0, 1, true ou false)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (missao) {
    return {
        titulo: missao.titulo.trim(),
        descricao: missao.descricao.trim(),
        meta: Number(missao.meta),
        periodo_dias: Number(missao.periodo_dias),
        pontos_bonus: Number(missao.pontos_bonus),
        ativo: (missao.ativo === true || missao.ativo === 1) ? 1 : 0
    }
}

const inserirNovaMissao = async function (missao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(missao)
        if (validar) return validar // 400

        let dados = normalizarDados(missao)
        let id = await missaoDAO.insertMissao(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { missao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarMissao = async function (id, missao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await missaoDAO.selectMissaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(missao)
        if (validar) return validar // 400

        let dados = normalizarDados(missao)
        dados.id = Number(id)

        let result = await missaoDAO.updateMissao(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { missao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarMissoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await missaoDAO.selectAllMissoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.missao = result

            return message.DEFAULT_MESSAGE // 200
        } else if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarMissao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await missaoDAO.selectMissaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.missao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirMissao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await missaoDAO.selectMissaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await missaoDAO.countDependenciasMissao(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] MISSÃO EM USO (usuários participando)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await missaoDAO.deleteMissao(Number(id))

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: Number(id) }

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    inserirNovaMissao,
    atualizarMissao,
    listarMissoes,
    buscarMissao,
    excluirMissao
}