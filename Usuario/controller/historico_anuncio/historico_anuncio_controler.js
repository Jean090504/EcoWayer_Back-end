/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_historico_anuncio (auditoria de mudanças do anúncio)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const historicoDAO = require('../../model/DAO/historico_anuncio/historico_anuncio.js')

const STATUS_VALIDOS = ['ativo', 'desativado', 'apagado', 'negociado']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

// Devolve false se válido, ou a resposta de erro pronta (400 ou 500)
const validarVinculos = async function (historico) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(historico.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let anuncio = await historicoDAO.selectAnuncioExiste(Number(historico.id_anuncio))
    if (anuncio === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (anuncio.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

const validarDados = function (historico) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!historico || typeof historico !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (!STATUS_VALIDOS.includes(historico.status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo, desativado, apagado ou negociado)'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(historico.data_alteracao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_ALTERACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(historico.detalhes) && typeof historico.detalhes !== 'string') {
        message.ERROR_BAD_REQUEST.field = '[DETALHES] INVÁLIDO (texto ou vazio)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(historico.detalhes) && historico.detalhes.length > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DETALHES] MUITO LONGO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (historico) {
    return {
        status: historico.status,
        data_alteracao: historico.data_alteracao.trim(),
        detalhes: vazio(historico.detalhes) ? null : historico.detalhes.trim(),
        id_anuncio: Number(historico.id_anuncio)
    }
}

const inserirNovoHistoricoAnuncio = async function (historico, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(historico)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(historico)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(historico)
        let id = await historicoDAO.insertHistoricoAnuncio(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { historico_anuncio: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarHistoricoAnuncio = async function (id, historico, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await historicoDAO.selectHistoricoAnuncioById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(historico)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(historico)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(historico)
        dados.id = Number(id)

        let result = await historicoDAO.updateHistoricoAnuncio(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { historico_anuncio: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarHistoricoAnuncio = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await historicoDAO.selectAllHistoricoAnuncio()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.historico_anuncio = result

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

const buscarHistoricoAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await historicoDAO.selectHistoricoAnuncioById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.historico_anuncio = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    inserirNovoHistoricoAnuncio,
    atualizarHistoricoAnuncio,
    listarHistoricoAnuncio,
    buscarHistoricoAnuncio
}