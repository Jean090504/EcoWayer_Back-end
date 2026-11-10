/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_anuncio (anúncios do marketplace)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const anuncioDAO = require('../../model/DAO/anuncio/anuncio.js')

const STATUS_VALIDOS = ['ativo', 'pausado', 'concluido']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// preco e peso_kg são opcionais: vazio é aceito (coluna NULL), senão precisa ser número maior que zero
const numeroOpcionalValido = (valor) => {
    if (vazio(valor)) return true
    if (typeof valor !== 'number' && typeof valor !== 'string') return false
    let numero = Number(valor)
    return Number.isFinite(numero) && numero > 0
}

const inserirNovoAnuncio = async function (anuncio, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(anuncio)

        if (validar) {
            return validar // 400
        } else {
            let anuncioNormalizado = normalizarDados(anuncio)
            let id = await anuncioDAO.insertAnuncio(anuncioNormalizado)

            if (id) {
                anuncioNormalizado.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { anuncio: anuncioNormalizado }

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

const atualizarAnuncio = async function (id, anuncio, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await anuncioDAO.selectAnuncioById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(anuncio)

        if (validar) {
            return validar // 400
        } else {
            let anuncioNormalizado = normalizarDados(anuncio)
            anuncioNormalizado.id = Number(id)

            let result = await anuncioDAO.updateAnuncio(anuncioNormalizado)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { anuncio: anuncioNormalizado }

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

const listarAnuncios = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await anuncioDAO.selectAllAnuncios()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.anuncio = result

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

const buscarAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await anuncioDAO.selectAnuncioById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.anuncio = result[0]

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

const excluirAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await anuncioDAO.selectAnuncioById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await anuncioDAO.deleteAnuncio(Number(id))

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

const validarDados = function (anuncio) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!anuncio || typeof anuncio !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let nome = typeof anuncio.nome === 'string' ? anuncio.nome.trim() : ''
    let status = typeof anuncio.status === 'string' ? anuncio.status.trim() : ''
    let descricao = typeof anuncio.descricao === 'string' ? anuncio.descricao.trim() : ''

    if (nome.length < 1 || nome.length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!vazio(anuncio.descricao) && typeof anuncio.descricao !== 'string') {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA'
        return message.ERROR_BAD_REQUEST // 400
    } else if (descricao.length > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] MUITO LONGA'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataValida(anuncio.data_publicacao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_PUBLICACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo, pausado ou concluido)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(anuncio.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(anuncio.id_categoria)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(anuncio.id_modalidade)) {
        message.ERROR_BAD_REQUEST.field = '[ID_MODALIDADE] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(anuncio.id_condicao_item)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONDICAO_ITEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!numeroOpcionalValido(anuncio.preco)) {
        message.ERROR_BAD_REQUEST.field = '[PRECO] INVÁLIDO (número maior que zero, ou vazio)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!numeroOpcionalValido(anuncio.peso_kg)) {
        message.ERROR_BAD_REQUEST.field = '[PESO_KG] INVÁLIDO (número maior que zero, ou vazio)'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (anuncio) {
    return {
        nome: anuncio.nome.trim(),
        descricao: vazio(anuncio.descricao) ? null : anuncio.descricao.trim(),
        data_publicacao: anuncio.data_publicacao.trim(),
        id_usuario: Number(anuncio.id_usuario),
        id_categoria: Number(anuncio.id_categoria),
        id_modalidade: Number(anuncio.id_modalidade),
        id_condicao_item: Number(anuncio.id_condicao_item),
        preco: vazio(anuncio.preco) ? null : Number(anuncio.preco),
        peso_kg: vazio(anuncio.peso_kg) ? null : Number(anuncio.peso_kg),
        status: anuncio.status.trim()
    }
}

module.exports = {
    inserirNovoAnuncio,
    atualizarAnuncio,
    listarAnuncios,
    buscarAnuncio,
    excluirAnuncio
}