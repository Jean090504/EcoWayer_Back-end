/***********************************************************************************************
 *  Objetivo: Validação, tratamento e manipulação de dados para o CRUD de status de usuário
 *  Data: 15/10/2026
 *  Autor: Maxw
 *  Versão: 1.0
 **********************************************************************************************/
const configMessages = require('../modulo/configMessages.js')
const statusUsuarioDAO = require('../../model/DAO/status_usuario/status_usuario.js')

// ---------- helpers ----------
// Compara só a parte antes do ';' (aceita "application/json; charset=utf-8")
const ehJson = (contentType) =>
    String(contentType || '').split(';')[0].trim().toUpperCase() === 'APPLICATION/JSON'

// Só dígitos, inteiro seguro e maior que zero (isNaN aceita 1e3, 0x1F, Infinity...)
const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// ---------- INSERIR ----------
const inserirNovoStatusUsuario = async function (statusUsuario, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = await validarDados(statusUsuario)
        if (validar) {
            return validar // 400
        }

        let status = statusUsuario.status.trim()
        let idInserido = await statusUsuarioDAO.insertStatusUsuario({ status })

        if (idInserido) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: idInserido, status }

            return message.DEFAULT_MESSAGE // 201
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- ATUALIZAR ----------
const atualizarStatusUsuario = async function (statusUsuario, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let resultID = await buscarStatusUsuario(id)
        if (!resultID.status) {
            return resultID // 400, 404 ou 500
        }

        let validar = await validarDados(statusUsuario)
        if (validar) {
            return validar // 400
        }

        // monta só com os campos permitidos; o id vem SEMPRE da URL
        let dados = { id: Number(id), status: statusUsuario.status.trim() }
        let result = await statusUsuarioDAO.updateStatusUsuario(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: dados.id, status: dados.status }

            return message.DEFAULT_MESSAGE // 200
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- LISTAR ----------
const listarStatusUsuario = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await statusUsuarioDAO.selectAllStatusUsuario()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.status_usuario = result

                return message.DEFAULT_MESSAGE // 200
            }
            return message.ERROR_NOT_FOUND // 404
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- BUSCAR POR ID ----------
const buscarStatusUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await statusUsuarioDAO.selectByIdStatusUsuario(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
        if (result.length > 0) { // [] é truthy: conferir length
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.status_usuario = result[0]

            return message.DEFAULT_MESSAGE // 200
        }
        return message.ERROR_NOT_FOUND // 404
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- EXCLUIR ----------
const excluirStatusUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarStatusUsuario(id)
        if (!resultBuscarID.status) {
            return resultBuscarID // 400, 404 ou 500
        }

        let result = await statusUsuarioDAO.deleteStatusUsuario(Number(id))

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: Number(id) }

            return message.DEFAULT_MESSAGE // 200
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500 (inclui status em uso por usuários: FK)
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- VALIDAÇÃO (retorna false se estiver tudo certo) ----------
const validarDados = async function (statusUsuario) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (statusUsuario === null || typeof statusUsuario !== 'object' || Array.isArray(statusUsuario)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (typeof statusUsuario.status !== 'string' ||
        statusUsuario.status.trim() === '' ||
        statusUsuario.status.trim().length > 50) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (obrigatório, texto de até 50 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

module.exports = {
    inserirNovoStatusUsuario,
    atualizarStatusUsuario,
    listarStatusUsuario,
    buscarStatusUsuario,
    excluirStatusUsuario,
    validarDados
}