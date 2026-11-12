/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de administrador
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const bcrypt = require('bcrypt')
const configMessages = require('../modulo/configMessages.js')
const administradorDAO = require('../../model/DAO/administrador/administrador.js')

const inserirNovoAdministrador = async function (administrador, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(administrador)

            if (validar) {
                return validar // 400
            } else {
                administrador.senha = await bcrypt.hash(administrador.senha, 10)

                let result = await administradorDAO.insertAdministrador(administrador)

                if (result) { // 201
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                
                    message.DEFAULT_MESSAGE.response = {
                        administrador: {
                            id: result.insertId,
                            nome: administrador.nome,
                            email: administrador.email
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

const atualizarAdministrador = async function (administrador, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarAdministrador(id)

            if (resultID.status) {
                let validar = await validarDados(administrador)

                if (!validar) {
                    administrador.id = id
                    administrador.senha = await bcrypt.hash(administrador.senha, 10)

                    let result = await administradorDAO.updateAdministrador(administrador)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { id: administrador.id, nome: administrador.nome, email: administrador.email }

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

const listarAdministrador = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await administradorDAO.selectAllAdministrador()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.administrador = result

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

const buscarAdministrador = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await administradorDAO.selectByIdAdministrador(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.administrador = result[0]

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

const excluirAdministrador = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarAdministrador(id)

        if (resultBuscarID.status) {
            let result = await administradorDAO.deleteAdministrador(id)

            if (result) {
                return message.SUCCESS_DELETED_ITEM // 200
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

const validarDados = async function (administrador) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (administrador.nome == undefined || administrador.nome == null || administrador.nome == '' || administrador.nome.length > 255) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (administrador.email == undefined || administrador.email == null || administrador.email == '' || administrador.email.length > 255 || !administrador.email.includes('@')) {
        message.ERROR_BAD_REQUEST.field = "[EMAIL] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (administrador.senha == undefined || administrador.senha == null || administrador.senha == '' || administrador.senha.length < 6 || administrador.senha.length > 50) {
        message.ERROR_BAD_REQUEST.field = "[SENHA] INVÁLIDA (6 a 50 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoAdministrador,
    atualizarAdministrador,
    listarAdministrador,
    buscarAdministrador,
    excluirAdministrador,
    validarDados
}