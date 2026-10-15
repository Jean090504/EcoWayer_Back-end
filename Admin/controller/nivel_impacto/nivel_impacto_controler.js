/**************************************************************************************
 * Objetivo: Controller responsável pela validação e regras de negócio do CRUD de nível de impacto
 * Autor: Seu Nome
 * Versão: 1.0
 **************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const nivelImpactoDAO = require('../../model/DAO/nivel_impacto/nivel_impacto.js')

// DECIMAL volta como texto no mysql2: converte meta para número antes de responder
const formatarNivelImpacto = function (registro) {
    return {
        id: Number(registro.id),
        nome: registro.nome,
        numero: Number(registro.numero),
        meta: Number(registro.meta),
        unidade: registro.unidade
    }
}

const inserirNovoNivelImpacto = async function (nivelImpacto, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(nivelImpacto)

            if (validar) {
                return validar // 400
            } else {
                let idInserido = await nivelImpactoDAO.insertNivelImpacto(nivelImpacto)

                if (idInserido) {
                    nivelImpacto.id = idInserido

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = formatarNivelImpacto(nivelImpacto)

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

const atualizarNivelImpacto = async function (nivelImpacto, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarNivelImpacto(id)

            if (resultID.status) {
                let validar = await validarDados(nivelImpacto)

                if (!validar) {
                    nivelImpacto.id = Number(id)

                    let result = await nivelImpactoDAO.updateNivelImpacto(nivelImpacto)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = formatarNivelImpacto(nivelImpacto)

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

const listarNivelImpacto = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await nivelImpactoDAO.selectAllNivelImpacto()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.nivel_impacto = result.map(formatarNivelImpacto)

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

const buscarNivelImpacto = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await nivelImpactoDAO.selectByIdNivelImpacto(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.nivel_impacto = formatarNivelImpacto(result[0])

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

const excluirNivelImpacto = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarNivelImpacto(id)

        if (resultBuscarID.status) {
            let result = await nivelImpactoDAO.deleteNivelImpacto(id)

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
const validarDados = async function (nivelImpacto) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (nivelImpacto.nome == undefined || nivelImpacto.nome == null || String(nivelImpacto.nome).trim() == '' || String(nivelImpacto.nome).length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, máximo 100 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (nivelImpacto.numero === undefined || nivelImpacto.numero === null || String(nivelImpacto.numero).trim() === '' || !Number.isInteger(Number(nivelImpacto.numero))) {
        message.ERROR_BAD_REQUEST.field = '[NUMERO] INVÁLIDO (obrigatório, número inteiro)'
        return message.ERROR_BAD_REQUEST
    } else if (nivelImpacto.meta === undefined || nivelImpacto.meta === null || String(nivelImpacto.meta).trim() === '' || isNaN(nivelImpacto.meta) || Math.abs(Number(nivelImpacto.meta)) >= 100000000) {
        message.ERROR_BAD_REQUEST.field = '[META] INVÁLIDA (obrigatória, número com até 2 casas decimais, máximo 99999999.99)'
        return message.ERROR_BAD_REQUEST
    } else if (nivelImpacto.unidade == undefined || nivelImpacto.unidade == null || String(nivelImpacto.unidade).trim() == '' || String(nivelImpacto.unidade).length > 20) {
        message.ERROR_BAD_REQUEST.field = '[UNIDADE] INVÁLIDA (obrigatória, máximo 20 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoNivelImpacto,
    atualizarNivelImpacto,
    listarNivelImpacto,
    buscarNivelImpacto,
    excluirNivelImpacto,
    validarDados
}