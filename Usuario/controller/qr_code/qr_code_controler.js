/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_qr_code (códigos QR de entrega)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const qrCodeDAO = require('../../model/DAO/qr_code/qr_code.js')

const STATUS_VALIDOS = ['ativo', 'utilizado', 'expirado', 'cancelado']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const inserirNovoQrCode = async function (qrCode, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(qrCode)

        if (validar) {
            return validar // 400
        } else {
            let qrNormalizado = normalizarDados(qrCode)

            // impede duplicar o código (coluna é unique)
            let existente = await qrCodeDAO.selectAllQrCodes()

            if (existente === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (existente.some(q => q.codigo === qrNormalizado.codigo)) {
                message.ERROR_BAD_REQUEST.field = '[CODIGO] JÁ EXISTENTE'
                return message.ERROR_BAD_REQUEST // 400
            }

            let id = await qrCodeDAO.insertQrCode(qrNormalizado)

            if (id) {
                qrNormalizado.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { qr_code: qrNormalizado }

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

const atualizarQrCode = async function (id, qrCode, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await qrCodeDAO.selectQrCodeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(qrCode)

        if (validar) {
            return validar // 400
        } else {
            let qrNormalizado = normalizarDados(qrCode)
            qrNormalizado.id = Number(id)

            let result = await qrCodeDAO.updateQrCode(qrNormalizado)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { qr_code: qrNormalizado }

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

const listarQrCodes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await qrCodeDAO.selectAllQrCodes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.qr_code = result

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

const buscarQrCode = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await qrCodeDAO.selectQrCodeById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.qr_code = result[0]

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

const excluirQrCode = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await qrCodeDAO.selectQrCodeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await qrCodeDAO.deleteQrCode(Number(id))

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

const validarDados = function (qrCode) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!qrCode || typeof qrCode !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let codigo = typeof qrCode.codigo === 'string' ? qrCode.codigo.trim() : ''
    let status = typeof qrCode.status === 'string' ? qrCode.status.trim() : ''

    if (codigo.length < 1 || codigo.length > 255) {
        message.ERROR_BAD_REQUEST.field = '[CODIGO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataValida(qrCode.data_criacao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_CRIACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataValida(qrCode.data_expiracao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (new Date(qrCode.data_expiracao.trim().replace(' ', 'T')) <= new Date(qrCode.data_criacao.trim().replace(' ', 'T'))) {
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] DEVE SER POSTERIOR À DATA_CRIACAO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo, utilizado, expirado ou cancelado)'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (qrCode) {
    return {
        codigo: qrCode.codigo.trim(),
        data_criacao: qrCode.data_criacao.trim(),
        data_expiracao: qrCode.data_expiracao.trim(),
        status: qrCode.status.trim()
    }
}

module.exports = {
    inserirNovoQrCode,
    atualizarQrCode,
    listarQrCodes,
    buscarQrCode,
    excluirQrCode
}