/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_email_verificacao (vínculo entre e-mail e verificação)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const emailVerificacaoDAO = require('../../model/DAO/email_verificacao/email_verificacao.js')
const emailDAO = require('../../model/DAO/email/email.js')
const verificacaoDAO = require('../../model/DAO/verificacao/verificacao.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Confere se o id existe na tabela pai. Devolve true, false (não existe) ou null (erro de banco).
const existeNaTabela = async function (dao, funcaoSelect, id) {
    let result = await dao[funcaoSelect](Number(id))

    if (result === false) return null
    return result.length > 0
}

// Valida os dois ids, existência nas tabelas pai e unicidade do par. Devolve false se OK.
const validarVinculo = async function (vinculo, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!vinculo || typeof vinculo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_email)) {
        message.ERROR_BAD_REQUEST.field = '[ID_EMAIL] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_verificacao)) {
        message.ERROR_BAD_REQUEST.field = '[ID_VERIFICACAO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let existeEmail = await existeNaTabela(emailDAO, 'selectEmailById', vinculo.id_email)
    if (existeEmail === null) return message.ERROR_INTERNAL_SEVER_MODEL // 500
    if (!existeEmail) {
        message.ERROR_BAD_REQUEST.field = '[ID_EMAIL] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let existeVerificacao = await existeNaTabela(verificacaoDAO, 'selectVerificacaoById', vinculo.id_verificacao)
    if (existeVerificacao === null) return message.ERROR_INTERNAL_SEVER_MODEL // 500
    if (!existeVerificacao) {
        message.ERROR_BAD_REQUEST.field = '[ID_VERIFICACAO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let par = await emailVerificacaoDAO.selectParEmailVerificacao(Number(vinculo.id_email), Number(vinculo.id_verificacao), idIgnorar)
    if (par === false) {
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } else if (par.length > 0) 
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (este e-mail já está ligado a esta verificação)',
            field: '[PAR] VÍNCULO JÁ EXISTE'
    }

    return false
}

const normalizarDados = function (vinculo) {
    return {
        id_email: Number(vinculo.id_email),
        id_verificacao: Number(vinculo.id_verificacao)
    }
}

const inserirNovoEmailVerificacao = async function (vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = await validarVinculo(vinculo)

        if (validar) {
            return validar // 400, 409 ou 500
        } else {
            let dados = normalizarDados(vinculo)
            let id = await emailVerificacaoDAO.insertEmailVerificacao(dados)

            if (id) {
                dados.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { email_verificacao: dados }

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

const atualizarEmailVerificacao = async function (id, vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await emailVerificacaoDAO.selectEmailVerificacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = await validarVinculo(vinculo, Number(id))

        if (validar) {
            return validar // 400, 409 ou 500
        } else {
            let dados = normalizarDados(vinculo)
            dados.id = Number(id)

            let result = await emailVerificacaoDAO.updateEmailVerificacao(dados)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { email_verificacao: dados }

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

const listarEmailVerificacoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await emailVerificacaoDAO.selectAllEmailVerificacoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.email_verificacao = result

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

const buscarEmailVerificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await emailVerificacaoDAO.selectEmailVerificacaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.email_verificacao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirEmailVerificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await emailVerificacaoDAO.selectEmailVerificacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await emailVerificacaoDAO.deleteEmailVerificacao(Number(id))

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
    inserirNovoEmailVerificacao,
    atualizarEmailVerificacao,
    listarEmailVerificacoes,
    buscarEmailVerificacao,
    excluirEmailVerificacao
}