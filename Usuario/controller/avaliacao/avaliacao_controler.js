/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_avaliacao (nota de reputação de uma entrega)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const avaliacaoDAO = require('../../model/DAO/avaliacao/avaliacao.js')

const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const notaValida = (nota) =>
    !vazio(nota) && Number.isInteger(Number(nota)) && Number(nota) >= 1 && Number(nota) <= 5

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (avaliacao, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(avaliacao.id_entrega)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ENTREGA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let entrega = await avaliacaoDAO.selectExiste('tbl_entrega', Number(avaliacao.id_entrega))
    if (entrega === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (entrega.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_ENTREGA] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(avaliacao.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let usuario = await avaliacaoDAO.selectExiste('tbl_usuario', Number(avaliacao.id_usuario))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let par = await avaliacaoDAO.selectParAvaliacao(Number(avaliacao.id_entrega), Number(avaliacao.id_usuario), idIgnorar)
    if (par === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (par.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (esta entrega já foi avaliada por este usuário)',
            field: '[PAR] VÍNCULO JÁ EXISTE'
        }
    }

    return false
}

const validarDados = function (avaliacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!avaliacao || typeof avaliacao !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (!notaValida(avaliacao.nota)) {
        message.ERROR_BAD_REQUEST.field = '[NOTA] INVÁLIDA (inteiro de 1 a 5)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(avaliacao.comentario) && typeof avaliacao.comentario !== 'string') {
        message.ERROR_BAD_REQUEST.field = '[COMENTARIO] INVÁLIDO (texto ou vazio)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(avaliacao.comentario) && avaliacao.comentario.trim().length > 65535) {
        message.ERROR_BAD_REQUEST.field = '[COMENTARIO] MUITO LONGO'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(avaliacao.data_avaliacao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_AVALIACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (avaliacao) {
    return {
        nota: Number(avaliacao.nota),
        comentario: vazio(avaliacao.comentario) ? null : avaliacao.comentario.trim(),
        data_avaliacao: avaliacao.data_avaliacao.trim(),
        id_entrega: Number(avaliacao.id_entrega),
        id_usuario: Number(avaliacao.id_usuario)
    }
}

const inserirNovaAvaliacao = async function (avaliacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(avaliacao)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(avaliacao)
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(avaliacao)
        let id = await avaliacaoDAO.insertAvaliacao(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { avaliacao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarAvaliacao = async function (id, avaliacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await avaliacaoDAO.selectAvaliacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(avaliacao)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(avaliacao, Number(id))
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(avaliacao)
        dados.id = Number(id)

        let result = await avaliacaoDAO.updateAvaliacao(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { avaliacao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarAvaliacoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await avaliacaoDAO.selectAllAvaliacoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.avaliacao = result

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

const buscarAvaliacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await avaliacaoDAO.selectAvaliacaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.avaliacao = result[0]

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
    inserirNovaAvaliacao,
    atualizarAvaliacao,
    listarAvaliacoes,
    buscarAvaliacao
}