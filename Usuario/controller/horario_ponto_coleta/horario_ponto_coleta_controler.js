/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_horario_ponto_coleta (funcionamento dos pontos de coleta)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const horarioPontoColetaDAO = require('../../model/DAO/horario_ponto_coleta/horario_ponto_coleta.js')

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const diaValido = (dia) => /^[0-6]$/.test(String(dia).trim())

const horaValida = (hora) => typeof hora === 'string' && REGEX_HORA.test(hora.trim())

// "08:00" vira "08:00:00" para bater com o formato TIME do MySQL
const normalizarHora = (hora) => {
    let valor = hora.trim()
    return valor.length === 5 ? valor + ':00' : valor
}

const horaParaSegundos = (hora) => {
    let [hh, mm, ss = '0'] = hora.trim().split(':')
    return Number(hh) * 3600 + Number(mm) * 60 + Number(ss)
}

const inserirNovoHorarioPontoColeta = async function (horario, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(horario)

        if (validar) {
            return validar // 400
        } else {
            let horarioNormalizado = normalizarDados(horario)
            let id = await horarioPontoColetaDAO.insertHorarioPontoColeta(horarioNormalizado)

            if (id) {
                horarioNormalizado.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { horario_ponto_coleta: horarioNormalizado }

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

const atualizarHorarioPontoColeta = async function (id, horario, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await horarioPontoColetaDAO.selectHorarioPontoColetaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(horario)

        if (validar) {
            return validar // 400
        } else {
            let horarioNormalizado = normalizarDados(horario)
            horarioNormalizado.id = Number(id)

            let result = await horarioPontoColetaDAO.updateHorarioPontoColeta(horarioNormalizado)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { horario_ponto_coleta: horarioNormalizado }

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

const listarHorariosPontoColeta = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await horarioPontoColetaDAO.selectAllHorariosPontoColeta()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.horario_ponto_coleta = result

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

const buscarHorarioPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await horarioPontoColetaDAO.selectHorarioPontoColetaById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.horario_ponto_coleta = result[0]

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

const excluirHorarioPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await horarioPontoColetaDAO.selectHorarioPontoColetaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await horarioPontoColetaDAO.deleteHorarioPontoColeta(Number(id))

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

const validarDados = function (horario) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!horario || typeof horario !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    if (!idValido(horario.id_ponto_coleta)) {
        message.ERROR_BAD_REQUEST.field = '[ID_PONTO_COLETA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!diaValido(horario.dia_semana)) {
        message.ERROR_BAD_REQUEST.field = '[DIA_SEMANA] INVÁLIDO (use 0 = domingo ... 6 = sábado)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!horaValida(horario.abre)) {
        message.ERROR_BAD_REQUEST.field = '[ABRE] INVÁLIDO (use HH:MM ou HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!horaValida(horario.fecha)) {
        message.ERROR_BAD_REQUEST.field = '[FECHA] INVÁLIDO (use HH:MM ou HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (horaParaSegundos(horario.abre) >= horaParaSegundos(horario.fecha)) {
        message.ERROR_BAD_REQUEST.field = '[FECHA] DEVE SER POSTERIOR A ABRE'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (horario) {
    return {
        id_ponto_coleta: Number(horario.id_ponto_coleta),
        dia_semana: Number(horario.dia_semana),
        abre: normalizarHora(horario.abre),
        fecha: normalizarHora(horario.fecha)
    }
}

module.exports = {
    inserirNovoHorarioPontoColeta,
    atualizarHorarioPontoColeta,
    listarHorariosPontoColeta,
    buscarHorarioPontoColeta,
    excluirHorarioPontoColeta
}