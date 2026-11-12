/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de tipo de imagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const tipoImagemDAO = require('../../model/DAO/tipo_imagem/tipo_imagem.js')

const inserirNovoTipoImagem = async function (tipoImagem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(tipoImagem)

            if (validar) {
                return validar // 400
            } else {
                let dados = { tipo: String(tipoImagem.tipo).trim() }

                let result = await tipoImagemDAO.insertTipoImagem(dados)

                if (result) { // 201
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        tipo_imagem: {
                            id: result,
                            tipo: dados.tipo
                        }
                    }

                    return message.DEFAULT_MESSAGE
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarTipoImagem = async function (tipoImagem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarTipoImagem(id)

            if (resultID.status) {
                let validar = await validarDados(tipoImagem)

                if (!validar) {
                    let dados = { id: Number(id), tipo: String(tipoImagem.tipo).trim() }

                    let result = await tipoImagemDAO.updateTipoImagem(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { id: dados.id, tipo: dados.tipo }

                        return message.DEFAULT_MESSAGE // 200
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                } else {
                    return validar // 400
                }
            } else {
                return resultID // 400, 404 ou 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarTipoImagem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await tipoImagemDAO.selectAllTipoImagem()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.tipo_imagem = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarTipoImagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await tipoImagemDAO.selectByIdTipoImagem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.tipo_imagem = result[0]

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirTipoImagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarTipoImagem(id)

        if (resultBuscarID.status) {
            let emUso = await tipoImagemDAO.selectTipoImagemEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] TIPO DE IMAGEM EM USO (existem imagens com este tipo)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await tipoImagemDAO.deleteTipoImagem(id)

                if (result) {
                    return message.SUCCESS_DELETED_ITEM // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscarID // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const validarDados = async function (tipoImagem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (tipoImagem.tipo == undefined || tipoImagem.tipo == null || String(tipoImagem.tipo).trim() == '' || String(tipoImagem.tipo).trim().length > 50) {
        message.ERROR_BAD_REQUEST.field = "[TIPO] INVÁLIDO (1 a 50 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoTipoImagem,
    atualizarTipoImagem,
    listarTipoImagem,
    buscarTipoImagem,
    excluirTipoImagem,
    validarDados
}