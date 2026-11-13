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
                let dados = tratarDados(endereco)

                let result = await enderecoDAO.insertEndereco(dados)

                if (result) { // 201
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        endereco: {
                            id: result,
                            ...dados
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

const atualizarEndereco = async function (endereco, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarEndereco(id)

            if (resultID.status) {
                let validar = await validarDados(endereco)

                if (!validar) {
                    let dados = tratarDados(endereco)
                    dados.id = Number(id)

                    let result = await enderecoDAO.updateEndereco(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { ...dados }

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
            let emUso = await enderecoDAO.selectEnderecoEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] ENDEREÇO EM USO (vinculado a usuário ou ponto de coleta)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await enderecoDAO.deleteEndereco(id)

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

const temValor = function (valor) {
    return !(valor === undefined || valor === null || valor === '')
}

// Padroniza os dados depois de validados: CEP no formato 00000-000, UF em maiúsculas e complemento opcional como null.
const tratarDados = function (endereco) {
    let cep = String(endereco.cep).replace(/\D/g, '')

    return {
        cep: cep.slice(0, 5) + '-' + cep.slice(5),
        rua: String(endereco.rua).trim(),
        numero: String(endereco.numero).trim(),
        complemento: temValor(endereco.complemento) ? String(endereco.complemento).trim() : null,
        bairro: String(endereco.bairro).trim(),
        cidade: String(endereco.cidade).trim(),
        estado: String(endereco.estado).trim(),
        sigla: String(endereco.sigla).trim().toUpperCase(),
        id_externo: String(endereco.id_externo).trim()
    }
}

const validarDados = async function (endereco) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!temValor(endereco.cep) || !/^\d{5}-?\d{3}$/.test(String(endereco.cep))) {
        message.ERROR_BAD_REQUEST.field = "[CEP] INVÁLIDO (formato 00000-000)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.rua) || String(endereco.rua).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[RUA] INVÁLIDA"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.numero) || String(endereco.numero).length > 10) {
        message.ERROR_BAD_REQUEST.field = "[NUMERO] INVÁLIDO (até 10 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (temValor(endereco.complemento) && String(endereco.complemento).length > 50) {
        message.ERROR_BAD_REQUEST.field = "[COMPLEMENTO] INVÁLIDO (até 50 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.bairro) || String(endereco.bairro).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[BAIRRO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.cidade) || String(endereco.cidade).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[CIDADE] INVÁLIDA"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.estado) || String(endereco.estado).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[ESTADO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.sigla) || !/^[A-Za-z]{2}$/.test(String(endereco.sigla).trim())) {
        message.ERROR_BAD_REQUEST.field = "[SIGLA] INVÁLIDA (2 letras, ex.: SP)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(endereco.id_externo) || String(endereco.id_externo).length > 255) {
        message.ERROR_BAD_REQUEST.field = "[ID_EXTERNO] INVÁLIDO"
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