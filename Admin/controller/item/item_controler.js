/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de item
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const itemDAO = require('../../model/DAO/item.js')

const inserirNovoItem = async function (item, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(item)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(item)

                let idInserido = await itemDAO.insertItem(item)

                if (idInserido) {
                    let criado = await itemDAO.selectByIdItem(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = (criado && criado.length > 0)
                        ? criado[0]
                        : { id: idInserido, nome: item.nome, descricao: item.descricao, pontos_base: item.pontos_base, status: item.status }

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

const atualizarItem = async function (item, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarItem(id)

            if (resultID.status) {
                let validar = await validarDados(item)

                if (!validar) {
                    normalizarDados(item)
                    item.id = Number(id)

                    let result = await itemDAO.updateItem(item)

                    if (result) {
                        let atualizado = await itemDAO.selectByIdItem(item.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = (atualizado && atualizado.length > 0)
                            ? atualizado[0]
                            : { id: item.id, nome: item.nome, descricao: item.descricao, pontos_base: item.pontos_base, status: item.status }

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

const listarItem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await itemDAO.selectAllItem()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.item = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await itemDAO.selectByIdItem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.item = result[0]

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Os vínculos com categorias são apagados em transação dentro do DAO
const excluirItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarItem(id)

        if (resultBuscarID.status) {
            let result = await itemDAO.deleteItem(id)

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

// Padroniza os dados antes de gravar
const normalizarDados = function (item) {
    item.nome = String(item.nome).trim()
    item.descricao = String(item.descricao).trim()
    item.pontos_base = Number(item.pontos_base)
    item.status = String(item.status).trim()
}

const textoInvalido = function (valor, maximo) {
    return valor === undefined || valor === null || String(valor).trim() == '' || String(valor).trim().length > maximo
}

const validarDados = async function (item) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (textoInvalido(item.nome, 45)) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (obrigatório, máximo 45 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(item.descricao, 500)) {
        message.ERROR_BAD_REQUEST.field = "[DESCRICAO] INVÁLIDA (obrigatória, máximo 500 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (item.pontos_base === undefined || item.pontos_base === null || item.pontos_base === '' || !Number.isInteger(Number(item.pontos_base)) || Number(item.pontos_base) < 0) {
        message.ERROR_BAD_REQUEST.field = "[PONTOS_BASE] INVÁLIDO (número inteiro maior ou igual a 0)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(item.status, 45)) {
        message.ERROR_BAD_REQUEST.field = "[STATUS] INVÁLIDO (obrigatório, máximo 45 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoItem,
    atualizarItem,
    listarItem,
    buscarItem,
    excluirItem,
    validarDados
}