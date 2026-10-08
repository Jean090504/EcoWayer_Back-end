/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de endereço
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const enderecoDAO = require('../../model/DAO/endereco/endereco.js')

const inserirNovoEndereco = async function (endereco, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(endereco)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(endereco)

                let idInserido = await enderecoDAO.insertEndereco(endereco)

                if (idInserido) {
                    let criado = await enderecoDAO.selectByIdEndereco(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = (criado && criado.length > 0)
                        ? criado[0]
                        : { id: idInserido, ...endereco }

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

const atualizarEndereco = async function (endereco, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarEndereco(id)

            if (resultID.status) {
                let validar = await validarDados(endereco)

                if (!validar) {
                    normalizarDados(endereco)
                    endereco.id = Number(id)

                    let result = await enderecoDAO.updateEndereco(endereco)

                    if (result) {
                        let atualizado = await enderecoDAO.selectByIdEndereco(endereco.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = (atualizado && atualizado.length > 0)
                            ? atualizado[0]
                            : endereco

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

const listarEndereco = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await enderecoDAO.selectAllEndereco()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.endereco = result

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

const buscarEndereco = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await enderecoDAO.selectByIdEndereco(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.endereco = result[0]

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

const excluirEndereco = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarEndereco(id)

        if (resultBuscarID.status) {
            let result = await enderecoDAO.deleteEndereco(id)

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
const normalizarDados = function (endereco) {
    endereco.cep = String(endereco.cep).replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')
    endereco.numero = String(endereco.numero).trim()
    endereco.sigla = String(endereco.sigla).toUpperCase()
    endereco.id_externo = String(endereco.id_externo).trim()
    endereco.complemento = endereco.complemento ? String(endereco.complemento).trim() : null
}

const textoInvalido = function (valor, max) {
    return valor == undefined || valor == null || String(valor).trim() == '' || String(valor).length > max
}

const validarDados = async function (endereco) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (endereco.cep == undefined || endereco.cep == null || String(endereco.cep).replace(/\D/g, '').length != 8) {
        message.ERROR_BAD_REQUEST.field = "[CEP] INVÁLIDO (8 dígitos, com ou sem hífen)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.rua, 100)) {
        message.ERROR_BAD_REQUEST.field = "[RUA] INVÁLIDA (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.numero, 10)) {
        message.ERROR_BAD_REQUEST.field = "[NUMERO] INVÁLIDO (máximo 10 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (endereco.complemento && String(endereco.complemento).length > 50) {
        message.ERROR_BAD_REQUEST.field = "[COMPLEMENTO] INVÁLIDO (máximo 50 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.bairro, 100)) {
        message.ERROR_BAD_REQUEST.field = "[BAIRRO] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.cidade, 100)) {
        message.ERROR_BAD_REQUEST.field = "[CIDADE] INVÁLIDA (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.estado, 100)) {
        message.ERROR_BAD_REQUEST.field = "[ESTADO] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (endereco.sigla == undefined || endereco.sigla == null || !/^[A-Za-z]{2}$/.test(String(endereco.sigla))) {
        message.ERROR_BAD_REQUEST.field = "[SIGLA] INVÁLIDA (2 letras, ex: SP)"
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(endereco.id_externo, 255)) {
        message.ERROR_BAD_REQUEST.field = "[ID_EXTERNO] INVÁLIDO (obrigatório, máximo 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoEndereco,
    atualizarEndereco,
    listarEndereco,
    buscarEndereco,
    excluirEndereco,
    validarDados
}