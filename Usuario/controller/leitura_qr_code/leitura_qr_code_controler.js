/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_leitura_qr_code (registro de leituras de QR Code)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const leituraQrCodeDAO = require('../../model/DAO/leitura_qr_code/leitura_qr_code.js')

const STATUS_VALIDOS = ['valida', 'invalida', 'expirada']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const inserirNovaLeituraQrCode = async function (leitura, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(leitura)

        if (validar) {
            return validar // 400
        } else {
            let leituraNormalizada = normalizarDados(leitura)
            let id = await leituraQrCodeDAO.insertLeituraQrCode(leituraNormalizada)

            if (id) {
                leituraNormalizada.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { leitura_qr_code: leituraNormalizada }

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

const atualizarLeituraQrCode = async function (id, leitura, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await leituraQrCodeDAO.selectLeituraQrCodeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(leitura)

        if (validar) {
            return validar // 400
        } else {
            let leituraNormalizada = normalizarDados(leitura)
            leituraNormalizada.id = Number(id)

            let result = await leituraQrCodeDAO.updateLeituraQrCode(leituraNormalizada)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { leitura_qr_code: leituraNormalizada }

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

const listarLeiturasQrCode = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await leituraQrCodeDAO.selectAllLeiturasQrCode()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.leitura_qr_code = result

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

const buscarLeituraQrCode = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await leituraQrCodeDAO.selectLeituraQrCodeById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.leitura_qr_code = result[0]

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

const excluirLeituraQrCode = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await leituraQrCodeDAO.selectLeituraQrCodeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await leituraQrCodeDAO.deleteLeituraQrCode(Number(id))

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

const validarDados = function (leitura) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!leitura || typeof leitura !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let status = typeof leitura.status === 'string' ? leitura.status.trim() : ''

    if (!dataValida(leitura.data_leitura)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_LEITURA] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use valida, invalida ou expirada)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(leitura.id_qr_code)) {
        message.ERROR_BAD_REQUEST.field = '[ID_QR_CODE] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(leitura.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (leitura) {
    return {
        data_leitura: leitura.data_leitura.trim(),
        status: leitura.status.trim(),
        id_qr_code: Number(leitura.id_qr_code),
        id_usuario: Number(leitura.id_usuario)
    }
}

module.exports = {
    inserirNovaLeituraQrCode,
    atualizarLeituraQrCode,
    listarLeiturasQrCode,
    buscarLeituraQrCode,
    excluirLeituraQrCode
}