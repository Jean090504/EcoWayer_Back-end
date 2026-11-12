/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de tipo de denúncia
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const tipoDenunciaDAO = require('../../model/DAO/tipo_denuncia/tipo_denuncia.js')

// ---------- helpers ----------
const ehJson = (contentType) =>
    String(contentType || '').split(';')[0].trim().toUpperCase() === 'APPLICATION/JSON'

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovoTipoDenuncia = async function (tipoDenuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = await validarDados(tipoDenuncia)

        if (validar) {
            return validar // 400
        }

        let dados = { tipo: tipoDenuncia.tipo.trim() }

        let result = await tipoDenunciaDAO.insertTipoDenuncia(dados)

        if (result) { // 201
            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = {
                tipo_denuncia: { id: result, tipo: dados.tipo }
            }

            return message.DEFAULT_MESSAGE
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarTipoDenuncia = async function (tipoDenuncia, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let resultID = await buscarTipoDenuncia(id)

        if (!resultID.status) {
            return resultID // 400, 404 ou 500
        }

        let validar = await validarDados(tipoDenuncia)

        if (validar) {
            return validar // 400
        }

        // Somente campos permitidos; o ID vem sempre da URL
        let dados = { id: Number(id), tipo: tipoDenuncia.tipo.trim() }

        let result = await tipoDenunciaDAO.updateTipoDenuncia(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = {
                tipo_denuncia: { id: dados.id, tipo: dados.tipo }
            }

            return message.DEFAULT_MESSAGE
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarTipoDenuncia = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await tipoDenunciaDAO.selectAllTipoDenuncia()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.tipo_denuncia = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarTipoDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await tipoDenunciaDAO.selectByIdTipoDenuncia(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }

        if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.tipo_denuncia = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirTipoDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarTipoDenuncia(id)

        if (!resultBuscarID.status) {
            return resultBuscarID // 400, 404 ou 500
        }

        let result = await tipoDenunciaDAO.deleteTipoDenuncia(Number(id))

        if (result === 'EM_USO') {
            message.ERROR_BAD_REQUEST.field = '[TIPO_DENUNCIA] Em uso por denúncias, não pode ser excluído'
            return message.ERROR_BAD_REQUEST // 400
        }

        if (result) {
            return message.SUCCESS_DELETED_ITEM // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Retorna false quando válido, ou ERROR_BAD_REQUEST com .field
const validarDados = async function (tipoDenuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (tipoDenuncia === null || typeof tipoDenuncia !== 'object' || Array.isArray(tipoDenuncia)) {
        message.ERROR_BAD_REQUEST.field = "[BODY] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (typeof tipoDenuncia.tipo !== 'string' || tipoDenuncia.tipo.trim() === '' || tipoDenuncia.tipo.trim().length > 50) {
        message.ERROR_BAD_REQUEST.field = "[TIPO] INVÁLIDO (até 50 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoTipoDenuncia,
    atualizarTipoDenuncia,
    listarTipoDenuncia,
    buscarTipoDenuncia,
    excluirTipoDenuncia,
    validarDados
}