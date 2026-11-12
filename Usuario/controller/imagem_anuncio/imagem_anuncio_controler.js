/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_imagem_anuncio (imagens vinculadas a anúncios)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const imagemAnuncioDAO = require('../../model/DAO/imagem_anuncio/imagem_anuncio.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovaImagemAnuncio = async function (vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(vinculo)

        if (validar) {
            return validar // 400
        } else {
            let vinculoNormalizado = normalizarDados(vinculo)
            let id = await imagemAnuncioDAO.insertImagemAnuncio(vinculoNormalizado)

            if (id) {
                vinculoNormalizado.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { imagem_anuncio: vinculoNormalizado }

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

const atualizarImagemAnuncio = async function (id, vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await imagemAnuncioDAO.selectImagemAnuncioById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(vinculo)

        if (validar) {
            return validar // 400
        } else {
            let vinculoNormalizado = normalizarDados(vinculo)
            vinculoNormalizado.id = Number(id)

            let result = await imagemAnuncioDAO.updateImagemAnuncio(vinculoNormalizado)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { imagem_anuncio: vinculoNormalizado }

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

const listarImagensAnuncio = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await imagemAnuncioDAO.selectAllImagensAnuncio()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.imagem_anuncio = result

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

const buscarImagemAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await imagemAnuncioDAO.selectImagemAnuncioById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.imagem_anuncio = result[0]

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

const excluirImagemAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await imagemAnuncioDAO.selectImagemAnuncioById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await imagemAnuncioDAO.deleteImagemAnuncio(Number(id))

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

const validarDados = function (vinculo) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!vinculo || typeof vinculo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    if (!idValido(vinculo.id_imagem)) {
        message.ERROR_BAD_REQUEST.field = '[ID_IMAGEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(vinculo.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (vinculo) {
    return {
        id_imagem: Number(vinculo.id_imagem),
        id_anuncio: Number(vinculo.id_anuncio)
    }
}

module.exports = {
    inserirNovaImagemAnuncio,
    atualizarImagemAnuncio,
    listarImagensAnuncio,
    buscarImagemAnuncio,
    excluirImagemAnuncio
}