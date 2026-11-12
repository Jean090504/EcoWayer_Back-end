/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de condição do item
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const condicaoItemDAO = require('../../model/DAO/condicao_item/condicao_item.js')

const inserirNovaCondicaoItem = async function (condicaoItem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(condicaoItem)

            if (validar) {
                return validar // 400
            } else {
                condicaoItem.nome = String(condicaoItem.nome).trim()

                let idInserido = await condicaoItemDAO.insertCondicaoItem(condicaoItem)

                if (idInserido) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = { id: idInserido, nome: condicaoItem.nome }

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

const atualizarCondicaoItem = async function (condicaoItem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarCondicaoItem(id)

            if (resultID.status) {
                let validar = await validarDados(condicaoItem)

                if (!validar) {
                    condicaoItem.id = Number(id)
                    condicaoItem.nome = String(condicaoItem.nome).trim()

                    let result = await condicaoItemDAO.updateCondicaoItem(condicaoItem)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { id: condicaoItem.id, nome: condicaoItem.nome }

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

const listarCondicaoItem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await condicaoItemDAO.selectAllCondicaoItem()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.condicao_item = result

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

const buscarCondicaoItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await condicaoItemDAO.selectByIdCondicaoItem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.condicao_item = result[0]

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

const excluirCondicaoItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarCondicaoItem(id)

        if (resultBuscarID.status) {
            let result = await condicaoItemDAO.deleteCondicaoItem(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: esta condição está sendo usada por outros registros.'

                return message.DEFAULT_MESSAGE // 409
            } else if (result) {
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

const validarDados = async function (condicaoItem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (condicaoItem.nome == undefined || condicaoItem.nome == null || String(condicaoItem.nome).trim() == '' || String(condicaoItem.nome).length > 50) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 50 caracteres)"
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovaCondicaoItem,
    atualizarCondicaoItem,
    listarCondicaoItem,
    buscarCondicaoItem,
    excluirCondicaoItem,
    validarDados
}