/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de nível de impacto
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const nivelImpactoDAO = require('../../model/DAO/nivel_impacto/nivel_impacto.js')

const inserirNovoNivelImpacto = async function (nivelImpacto, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(nivelImpacto)

            if (validar) {
                return validar // 400
            } else {
                let dados = tratarDados(nivelImpacto)

                let result = await nivelImpactoDAO.insertNivelImpacto(dados)

                if (result) { // 201
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        nivel_impacto: {
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

const atualizarNivelImpacto = async function (nivelImpacto, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarNivelImpacto(id)

            if (resultID.status) {
                let validar = await validarDados(nivelImpacto)

                if (!validar) {
                    let dados = tratarDados(nivelImpacto)
                    dados.id = Number(id)

                    let result = await nivelImpactoDAO.updateNivelImpacto(dados)

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

const listarNivelImpacto = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await nivelImpactoDAO.selectAllNivelImpacto()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.nivel_impacto = result

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
                    message.DEFAULT_MESSAGE.response.nivel_impacto = result[0]

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

const excluirNivelImpacto = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarNivelImpacto(id)

        if (resultBuscarID.status) {
            let emUso = await nivelImpactoDAO.selectNivelImpactoEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] NÍVEL EM USO (existem usuários neste nível)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await nivelImpactoDAO.deleteNivelImpacto(id)

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

// Padroniza os dados depois de validados (texto sem espaços nas pontas e números como Number).
const tratarDados = function (nivelImpacto) {
    return {
        nome: String(nivelImpacto.nome).trim(),
        numero: Number(nivelImpacto.numero),
        meta: Number(nivelImpacto.meta),
        unidade: String(nivelImpacto.unidade).trim()
    }
}

const validarDados = async function (nivelImpacto) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!temValor(nivelImpacto.nome) || String(nivelImpacto.nome).trim() == '' || String(nivelImpacto.nome).trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (1 a 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(nivelImpacto.numero) || isNaN(nivelImpacto.numero) || !Number.isInteger(Number(nivelImpacto.numero)) || Number(nivelImpacto.numero) < 1) {
        message.ERROR_BAD_REQUEST.field = "[NUMERO] INVÁLIDO (inteiro maior que 0)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(nivelImpacto.meta) || isNaN(nivelImpacto.meta) || Number(nivelImpacto.meta) <= 0 || Number(nivelImpacto.meta) > 99999999.99) {
        message.ERROR_BAD_REQUEST.field = "[META] INVÁLIDA (número maior que 0)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(nivelImpacto.unidade) || String(nivelImpacto.unidade).trim() == '' || String(nivelImpacto.unidade).trim().length > 20) {
        message.ERROR_BAD_REQUEST.field = "[UNIDADE] INVÁLIDA (1 a 20 caracteres, ex.: kg)"
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