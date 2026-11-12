/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de IA
 *  Local: controller/ia/ia_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const iaDAO = require('../../model/DAO/ia/ia.js')

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_ia LIKE 'status';)
const STATUS_VALIDOS = ['ATIVO', 'INATIVO']

const inserirNovaIA = async function (ia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = validarDados(ia)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(ia)

                let idInserido = await iaDAO.insertIA(ia)

                if (idInserido) {
                    let criado = await iaDAO.selectByIdIA(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = criado[0]
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nome: ia.nome }
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

const atualizarIA = async function (ia, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarIA(id)

            if (resultID.status) {
                let validar = validarDados(ia)

                if (!validar) {
                    normalizarDados(ia)
                    ia.id = Number(id)

                    let result = await iaDAO.updateIA(ia)

                    if (result) {
                        let atualizado = await iaDAO.selectByIdIA(ia.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = atualizado[0]
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: ia.id, nome: ia.nome }
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

const listarIA = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await iaDAO.selectAllIA()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.ia = result

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

const buscarIA = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await iaDAO.selectByIdIA(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.ia = result[0]

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

const excluirIA = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarIA(id)

        if (resultBuscarID.status) {
            let result = await iaDAO.deleteIA(id)

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

// Padroniza os dados antes de gravar (id_externo é opcional: vazio vira null)
const normalizarDados = function (ia) {
    ia.nome = String(ia.nome).trim()
    ia.provedor = String(ia.provedor).trim()
    ia.versao = String(ia.versao).trim()
    ia.status = String(ia.status)
    ia.id_externo = (ia.id_externo == undefined || ia.id_externo == null || String(ia.id_externo).trim() == '')
        ? null
        : String(ia.id_externo).trim()
}

const textoInvalido = function (valor, limite) {
    return valor == undefined || valor == null || String(valor).trim() == '' || String(valor).trim().length > limite
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
const validarDados = function (ia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (textoInvalido(ia.nome, 100)) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, até 100 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(ia.provedor, 50)) {
        message.ERROR_BAD_REQUEST.field = '[PROVEDOR] INVÁLIDO (obrigatório, até 50 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(ia.versao, 20)) {
        message.ERROR_BAD_REQUEST.field = '[VERSAO] INVÁLIDO (obrigatório, até 20 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (ia.status == undefined || ia.status == null || !STATUS_VALIDOS.includes(String(ia.status))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (valores aceitos: ' + STATUS_VALIDOS.join(', ') + ')'
        return message.ERROR_BAD_REQUEST

    } else if (ia.id_externo != undefined && ia.id_externo != null && String(ia.id_externo).trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = '[ID_EXTERNO] INVÁLIDO (até 255 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovaIA,
    atualizarIA,
    listarIA,
    buscarIA,
    excluirIA,
    validarDados
}