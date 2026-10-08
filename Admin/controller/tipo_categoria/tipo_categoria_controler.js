/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de tipo de categoria
 *  Autor: Maxwillian Santana
 *  Versão: 1.1
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const tipoCategoriaDAO = require('../../model/DAO/tipo_categoria/tipo_categoria.js')

const inserirNovoTipoCategoria = async function (tipoCategoria, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(tipoCategoria)

            if (validar) {
                return validar // 400
            } else {
                let idInserido = await tipoCategoriaDAO.insertTipoCategoria(tipoCategoria)

                if (idInserido) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = {
                        id: idInserido,
                        nome: tipoCategoria.nome
                    }

                    return message.DEFAULT_MESSAGE // 201
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

const atualizarTipoCategoria = async function (tipoCategoria, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarTipoCategoria(id)

            if (resultID.status) {
                let validar = await validarDados(tipoCategoria)

                if (!validar) {
                    tipoCategoria.id = Number(id)

                    let result = await tipoCategoriaDAO.updateTipoCategoria(tipoCategoria)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = {
                            id: tipoCategoria.id,
                            nome: tipoCategoria.nome
                        }

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

const listarTipoCategoria = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await tipoCategoriaDAO.selectAllTipoCategoria()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.tipo_categoria = result

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

const buscarTipoCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await tipoCategoriaDAO.selectByIdTipoCategoria(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.tipo_categoria = result[0]

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

const excluirTipoCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarTipoCategoria(id)

        if (resultBuscarID.status) {
            let result = await tipoCategoriaDAO.deleteTipoCategoria(id)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { id: Number(id) }

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        } else {
            return resultBuscarID // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const validarDados = async function (tipoCategoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (tipoCategoria.nome == undefined || tipoCategoria.nome == null || String(tipoCategoria.nome).trim() == '' || tipoCategoria.nome.length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoTipoCategoria,
    atualizarTipoCategoria,
    listarTipoCategoria,
    buscarTipoCategoria,
    excluirTipoCategoria,
    validarDados
}