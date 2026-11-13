/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_telefone (telefone de contato do usuário)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const telefoneDAO = require('../../model/DAO/telefone/telefone.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Remove o código de verificação da resposta (dado sensível)
const ocultarCodigo = (registro) => {
    let { codigo_verificacao, ...semCodigo } = registro
    return semCodigo
}

const atualizarTelefone = async function (id, telefone, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await telefoneDAO.selectTelefoneById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(telefone)

        if (validar) {
            return validar // 400
        } else {
            // o código de verificação só muda quando o número muda
            let numeroNovo = telefone.numero.replace(/\D/g, '')
            let codigo = numeroNovo == existente[0].numero.replace(/\D/g, '')
                ? existente[0].codigo_verificacao
                : String(Math.floor(Math.random() * 1000000)).padStart(6, '0')

            let dados = {
                id: Number(id),
                numero: numeroNovo,
                codigo_verificacao: codigo,
                id_usuario: Number(telefone.id_usuario)
            }

            let result = await telefoneDAO.updateTelefone(dados)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { telefone: { id: dados.id, numero: dados.numero, id_usuario: dados.id_usuario } }

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

const listarTelefones = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await telefoneDAO.selectAllTelefones()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.telefone = result.map(ocultarCodigo)

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

const buscarTelefone = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await telefoneDAO.selectTelefoneById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.telefone = ocultarCodigo(result[0])

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirTelefone = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await telefoneDAO.selectTelefoneById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await telefoneDAO.countDependenciasTelefone(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] TELEFONE EM USO (vinculado a verificação)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await telefoneDAO.deleteTelefone(Number(id))

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

const validarDados = function (telefone) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!telefone || typeof telefone !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let numero = typeof telefone.numero === 'string' ? telefone.numero.replace(/\D/g, '') : ''

    if (!/^\d{10,11}$/.test(numero)) {
        message.ERROR_BAD_REQUEST.field = '[NUMERO] INVÁLIDO (DDD + número, 10 ou 11 dígitos)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(telefone.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

module.exports = {
    atualizarTelefone,
    listarTelefones,
    buscarTelefone,
    excluirTelefone
}