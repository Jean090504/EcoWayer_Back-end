/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_verificacao (configuração de tentativas, tempo e reenvio)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const verificacaoDAO = require('../../model/DAO/verificacao/verificacao.js')

const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inteiroPositivo = (valor) =>
    valor !== '' && valor !== null && valor !== undefined &&
    Number.isInteger(Number(valor)) && Number(valor) >= 0

// bloqueio e ultimo_reenvio são opcionais (NULL), mas se vierem precisam ser datas válidas
const dataOpcionalValida = (valor) => {
    if (valor === undefined || valor === null || valor === '') return true
    if (typeof valor !== 'string' || !REGEX_DATA.test(valor.trim())) return false
    return !isNaN(new Date(valor.trim().replace(' ', 'T')).getTime())
}

const normalizarDataOpcional = (valor) =>
    (valor === undefined || valor === null || valor === '') ? null : valor.trim()

const inserirNovaVerificacao = async function (verificacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(verificacao)

        if (validar) {
            return validar // 400
        } else {
            let dados = normalizarDados(verificacao)
            let id = await verificacaoDAO.insertVerificacao(dados)

            if (id) {
                dados.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { verificacao: dados }

                return message.DEFAULT_MESSAGE // 201
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarVerificacao = async function (id, verificacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await verificacaoDAO.selectVerificacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(verificacao)

        if (validar) {
            return validar // 400
        } else {
            let dados = normalizarDados(verificacao)
            dados.id = Number(id)

            let result = await verificacaoDAO.updateVerificacao(dados)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { verificacao: dados }

                return message.DEFAULT_MESSAGE // 201
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarVerificacoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await verificacaoDAO.selectAllVerificacoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.verificacao = result

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

const buscarVerificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await verificacaoDAO.selectVerificacaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.verificacao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirVerificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await verificacaoDAO.selectVerificacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await verificacaoDAO.countDependenciasVerificacao(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] VERIFICAÇÃO EM USO (vinculada a e-mail ou telefone)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await verificacaoDAO.deleteVerificacao(Number(id))

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

const validarDados = function (verificacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!verificacao || typeof verificacao !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    if (!inteiroPositivo(verificacao.tentativas) || Number(verificacao.tentativas) < 1) {
        message.ERROR_BAD_REQUEST.field = '[TENTATIVAS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!inteiroPositivo(verificacao.tempo) || Number(verificacao.tempo) < 1) {
        message.ERROR_BAD_REQUEST.field = '[TEMPO] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!inteiroPositivo(verificacao.reenvio)) {
        message.ERROR_BAD_REQUEST.field = '[REENVIO] INVÁLIDO (inteiro maior ou igual a zero)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataOpcionalValida(verificacao.bloqueio)) {
        message.ERROR_BAD_REQUEST.field = '[BLOQUEIO] INVÁLIDO (use YYYY-MM-DD HH:MM:SS ou vazio)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataOpcionalValida(verificacao.ultimo_reenvio)) {
        message.ERROR_BAD_REQUEST.field = '[ULTIMO_REENVIO] INVÁLIDO (use YYYY-MM-DD HH:MM:SS ou vazio)'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (verificacao) {
    return {
        tentativas: Number(verificacao.tentativas),
        tempo: Number(verificacao.tempo),
        reenvio: Number(verificacao.reenvio),
        bloqueio: normalizarDataOpcional(verificacao.bloqueio),
        ultimo_reenvio: normalizarDataOpcional(verificacao.ultimo_reenvio)
    }
}

module.exports = {
    inserirNovaVerificacao,
    atualizarVerificacao,
    listarVerificacoes,
    buscarVerificacao,
    excluirVerificacao
}