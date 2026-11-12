/**************************************************************************************
 * Objetivo: Controller responsável pela validação e regras de negócio do CRUD de gênero
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const generoDAO = require('../../model/DAO/genero/genero.js')

const inserirNovoGenero = async function (genero, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(genero)

            if (validar) {
                return validar // 400
            } else {
                let idInserido = await generoDAO.insertGenero(genero)

                if (idInserido) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = {
                        id: idInserido,
                        nome: genero.nome,
                        sigla: genero.sigla
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

const atualizarGenero = async function (genero, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarGenero(id)

            if (resultID.status) {
                let validar = await validarDados(genero)

                if (!validar) {
                    genero.id = Number(id)

                    let result = await generoDAO.updateGenero(genero)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = {
                            id: genero.id,
                            nome: genero.nome,
                            sigla: genero.sigla
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

const listarGenero = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await generoDAO.selectAllGenero()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.genero = result

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

const buscarGenero = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await generoDAO.selectByIdGenero(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.genero = result[0]

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

const excluirGenero = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarGenero(id)

        if (resultBuscarID.status) {
            let result = await generoDAO.deleteGenero(id)

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

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido
const validarDados = async function (genero) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (genero.nome == undefined || genero.nome == null || String(genero.nome).trim() == '' || String(genero.nome).length > 50) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, máximo 50 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (genero.sigla == undefined || genero.sigla == null || String(genero.sigla).trim() == '' || String(genero.sigla).length > 5) {
        message.ERROR_BAD_REQUEST.field = '[SIGLA] INVÁLIDA (obrigatória, máximo 5 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoGenero,
    atualizarGenero,
    listarGenero,
    buscarGenero,
    excluirGenero,
    validarDados
}