/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de pagamento
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pagamentoDAO = require('../../model/DAO/pagamento/pagamento.js')

// Controllers que fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerUsuario = require('../usuario/usuario_controler.js')   // buscarUsuario (o comprador é o usuário)
const controlerAnuncio = require('../anuncio/anuncio_controler.js')   // buscarAnuncio

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_pagamento LIKE 'status';)
const STATUS_VALIDOS = ['pendente', 'pago', 'cancelado']

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Troca os id_... pelos objetos relacionados e converte o valor (DECIMAL volta como texto)
const montarPagamento = async function (pagamento) {
    let comprador = await buscarRelacionado(controlerUsuario.buscarUsuario, pagamento.id_comprador)

    // Do comprador só vão o id e o nome (o CPF e os outros dados não entram no pagamento)
    pagamento.comprador = comprador ? { id: comprador.id, nome: comprador.nome } : null
    pagamento.anuncio = await buscarRelacionado(controlerAnuncio.buscarAnuncio, pagamento.id_anuncio)
    pagamento.valor = Number(pagamento.valor)

    delete pagamento.id_comprador
    delete pagamento.id_anuncio

    return pagamento
}

const inserirNovoPagamento = async function (pagamento, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(pagamento)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(pagamento)

                let idInserido = await pagamentoDAO.insertPagamento(pagamento)

                if (idInserido) {
                    let criado = await pagamentoDAO.selectByIdPagamento(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarPagamento(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: pagamento.status, valor: pagamento.valor }
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

const atualizarPagamento = async function (pagamento, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarPagamento(id)

            if (resultID.status) {
                let validar = await validarDados(pagamento)

                if (!validar) {
                    normalizarDados(pagamento)
                    pagamento.id = Number(id)

                    let result = await pagamentoDAO.updatePagamento(pagamento)

                    if (result) {
                        let atualizado = await pagamentoDAO.selectByIdPagamento(pagamento.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarPagamento(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: pagamento.id, status: pagamento.status, valor: pagamento.valor }
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

const listarPagamento = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pagamentoDAO.selectAllPagamento()

        if (result) {
            if (result.length > 0) {
                // ids em ordem decrescente (ORDER BY do DAO)
                for (let pagamento of result) {
                    await montarPagamento(pagamento)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.pagamento = result

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

const buscarPagamento = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await pagamentoDAO.selectByIdPagamento(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.pagamento = await montarPagamento(result[0])

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

const excluirPagamento = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarPagamento(id)

        if (resultBuscarID.status) {
            let result = await pagamentoDAO.deletePagamento(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: este pagamento está sendo usado por outros registros.'

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

// Padroniza os dados antes de gravar
const normalizarDados = function (pagamento) {
    pagamento.valor = Number(pagamento.valor)
    pagamento.id_externo = String(pagamento.id_externo).trim()
    pagamento.id_anuncio = Number(pagamento.id_anuncio)
    pagamento.id_comprador = Number(pagamento.id_comprador)
}

// DECIMAL(10,2): até 8 dígitos inteiros e 2 casas decimais, maior que zero
const valorValido = function (valor) {
    if (valor === undefined || valor === null || valor === '') {
        return false
    }

    return /^\d{1,8}(\.\d{1,2})?$/.test(String(valor)) && Number(valor) > 0
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (pagamento) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (pagamento.status == undefined || pagamento.status == null || !STATUS_VALIDOS.includes(String(pagamento.status))) {
        message.ERROR_BAD_REQUEST.field = "[STATUS] INVÁLIDO (valores aceitos: " + STATUS_VALIDOS.join(', ') + ")"
        return message.ERROR_BAD_REQUEST

    } else if (!valorValido(pagamento.valor)) {
        message.ERROR_BAD_REQUEST.field = "[VALOR] INVÁLIDO (número maior que 0, com até 2 casas decimais)"
        return message.ERROR_BAD_REQUEST

    } else if (pagamento.id_externo == undefined || pagamento.id_externo == null || String(pagamento.id_externo).trim() == '' || String(pagamento.id_externo).length > 255) {
        message.ERROR_BAD_REQUEST.field = "[ID_EXTERNO] INVÁLIDO (obrigatório, máximo 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(pagamento.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = "[ID_ANUNCIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(pagamento.id_comprador)) {
        message.ERROR_BAD_REQUEST.field = "[ID_COMPRADOR] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o anúncio e o comprador (usuário) existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerAnuncio.buscarAnuncio, pagamento.id_anuncio)) {
            message.ERROR_BAD_REQUEST.field = "[ID_ANUNCIO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, pagamento.id_comprador)) {
            message.ERROR_BAD_REQUEST.field = "[ID_COMPRADOR] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoPagamento,
    atualizarPagamento,
    listarPagamento,
    buscarPagamento,
    excluirPagamento,
    validarDados
}