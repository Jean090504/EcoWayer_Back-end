/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de ponto de coleta
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pontoColetaDAO = require('../../model/DAO/ponto_coleta/ponto_coleta.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_ponto_coleta LIKE 'status';)
const STATUS_VALIDOS = ['ativo', 'inativo']

// O mysql2 devolve DECIMAL como texto; aqui converte para número
const formatarPonto = function (ponto) {
    return {
        ...ponto,
        latitude: Number(ponto.latitude),
        longitude: Number(ponto.longitude)
    }
}

const inserirNovoPontoColeta = async function (ponto, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(ponto)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(ponto)

                let idInserido = await pontoColetaDAO.insertPontoColeta(ponto)

                if (idInserido) {
                    let criado = await pontoColetaDAO.selectByIdPontoColeta(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = (criado && criado.length > 0)
                        ? formatarPonto(criado[0])
                        : { id: idInserido, nome: ponto.nome }

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

const atualizarPontoColeta = async function (ponto, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarPontoColeta(id)

            if (resultID.status) {
                let validar = await validarDados(ponto)

                if (!validar) {
                    normalizarDados(ponto)
                    ponto.id = Number(id)

                    let result = await pontoColetaDAO.updatePontoColeta(ponto)

                    if (result) {
                        let atualizado = await pontoColetaDAO.selectByIdPontoColeta(ponto.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = (atualizado && atualizado.length > 0)
                            ? formatarPonto(atualizado[0])
                            : { id: ponto.id, nome: ponto.nome }

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

const listarPontoColeta = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pontoColetaDAO.selectAllPontoColeta()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.ponto_coleta = result.map(formatarPonto) // ids em ordem decrescente (ORDER BY do DAO)

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

const buscarPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await pontoColetaDAO.selectByIdPontoColeta(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.ponto_coleta = formatarPonto(result[0])

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

const excluirPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarPontoColeta(id)

        if (resultBuscarID.status) {
            let result = await pontoColetaDAO.deletePontoColeta(id)

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
const normalizarDados = function (ponto) {
    ponto.nome = String(ponto.nome).trim()
    ponto.descricao = ponto.descricao ? String(ponto.descricao).trim() : null
    ponto.latitude = Number(ponto.latitude)
    ponto.longitude = Number(ponto.longitude)
    ponto.id_categoria = Number(ponto.id_categoria)
}

const numeroForaDoLimite = function (valor, min, max) {
    return valor === undefined || valor === null || valor === '' || isNaN(Number(valor)) || Number(valor) < min || Number(valor) > max
}

const validarDados = async function (ponto) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (ponto.nome == undefined || ponto.nome == null || String(ponto.nome).trim() == '' || String(ponto.nome).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (ponto.status == undefined || ponto.status == null || !STATUS_VALIDOS.includes(String(ponto.status))) {
        message.ERROR_BAD_REQUEST.field = "[STATUS] INVÁLIDO (valores aceitos: " + STATUS_VALIDOS.join(', ') + ")"
        return message.ERROR_BAD_REQUEST

    } else if (numeroForaDoLimite(ponto.latitude, -90, 90)) {
        message.ERROR_BAD_REQUEST.field = "[LATITUDE] INVÁLIDA (número entre -90 e 90)"
        return message.ERROR_BAD_REQUEST

    } else if (numeroForaDoLimite(ponto.longitude, -180, 180)) {
        message.ERROR_BAD_REQUEST.field = "[LONGITUDE] INVÁLIDA (número entre -180 e 180)"
        return message.ERROR_BAD_REQUEST

    } else if (ponto.id_categoria === undefined || ponto.id_categoria === null || ponto.id_categoria === '' || !Number.isInteger(Number(ponto.id_categoria))) {
        message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se a categoria existe antes de gravar (evita erro de chave estrangeira)
        let categoria = await categoriaDAO.selectByIdCategoria(ponto.id_categoria)

        if (!categoria || categoria.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] não encontrada"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoPontoColeta,
    atualizarPontoColeta,
    listarPontoColeta,
    buscarPontoColeta,
    excluirPontoColeta,
    validarDados
}