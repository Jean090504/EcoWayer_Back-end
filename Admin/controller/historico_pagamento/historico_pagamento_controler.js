/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de histórico de pagamento
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const historicoPagamentoDAO = require('../../model/DAO/historico_pagamento/historico_pagamento.js')

// Controller que fornece os dados da chave estrangeira.
// CONFIRME o caminho e o nome da função exportada (module.exports) dele.
const controlerPagamento = require('../pagamento/pagamento_controler.js') // buscarPagamento

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_historico_pagamento LIKE 'status';)
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

// Na listagem, vários registros são do mesmo pagamento.
// O cache evita consultar o mesmo pagamento várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca o id_pagamento por um resumo do pagamento (sem o anúncio completo, para a resposta não ficar pesada)
const montarHistoricoPagamento = async function (historico, cache = {}) {
    let pagamento = await buscarComCache(cache, 'pagamento', controlerPagamento.buscarPagamento, historico.id_pagamento)

    historico.pagamento = pagamento
        ? {
            id: pagamento.id,
            status: pagamento.status,
            valor: pagamento.valor,
            id_externo: pagamento.id_externo,
            comprador: pagamento.comprador
        }
        : null

    delete historico.id_pagamento

    return historico
}

const inserirNovoHistoricoPagamento = async function (historico, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(historico)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(historico)

                let idInserido = await historicoPagamentoDAO.insertHistoricoPagamento(historico)

                if (idInserido) {
                    let criado = await historicoPagamentoDAO.selectByIdHistoricoPagamento(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarHistoricoPagamento(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: historico.status }
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

const atualizarHistoricoPagamento = async function (historico, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarHistoricoPagamento(id)

            if (resultID.status) {
                let validar = await validarDados(historico)

                if (!validar) {
                    normalizarDados(historico)
                    historico.id = Number(id)

                    let result = await historicoPagamentoDAO.updateHistoricoPagamento(historico)

                    if (result) {
                        let atualizado = await historicoPagamentoDAO.selectByIdHistoricoPagamento(historico.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarHistoricoPagamento(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: historico.id, status: historico.status }
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

const listarHistoricoPagamento = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await historicoPagamentoDAO.selectAllHistoricoPagamento()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let historico of result) {
                    await montarHistoricoPagamento(historico, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.historico_pagamento = result

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

const buscarHistoricoPagamento = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await historicoPagamentoDAO.selectByIdHistoricoPagamento(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.historico_pagamento = await montarHistoricoPagamento(result[0])

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

const excluirHistoricoPagamento = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarHistoricoPagamento(id)

        if (resultBuscarID.status) {
            let result = await historicoPagamentoDAO.deleteHistoricoPagamento(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: este registro está sendo usado por outros registros.'

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

// Padroniza os dados antes de gravar.
// data_alteracao e detalhes ficam null quando não enviados: o DAO usa COALESCE para a data.
const normalizarDados = function (historico) {
    historico.data_alteracao = (historico.data_alteracao === undefined || historico.data_alteracao === null || historico.data_alteracao === '') ? null : String(historico.data_alteracao).trim()
    historico.detalhes = (historico.detalhes === undefined || historico.detalhes === null || String(historico.detalhes).trim() === '') ? null : String(historico.detalhes).trim()
    historico.id_pagamento = Number(historico.id_pagamento)
}

// Valida data e hora no formato AAAA-MM-DD HH:MM:SS, existentes
const dataHoraValida = function (valor) {
    let partes = String(valor).trim().match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)

    if (!partes) {
        return false
    }

    let [ano, mes, dia, hora, minuto, segundo] = partes.slice(1).map(Number)
    let data = new Date(ano, mes - 1, dia, hora, minuto, segundo)

    return data.getFullYear() == ano && data.getMonth() == mes - 1 && data.getDate() == dia &&
           data.getHours() == hora && data.getMinutes() == minuto && data.getSeconds() == segundo
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (historico) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (historico.status == undefined || historico.status == null || !STATUS_VALIDOS.includes(String(historico.status))) {
        message.ERROR_BAD_REQUEST.field = "[STATUS] INVÁLIDO (valores aceitos: " + STATUS_VALIDOS.join(', ') + ")"
        return message.ERROR_BAD_REQUEST

    } else if (historico.data_alteracao !== undefined && historico.data_alteracao !== null && historico.data_alteracao !== '' && !dataHoraValida(historico.data_alteracao)) {
        message.ERROR_BAD_REQUEST.field = "[DATA_ALTERACAO] INVÁLIDA (formato AAAA-MM-DD HH:MM:SS, ou não envie para usar a data e hora atuais)"
        return message.ERROR_BAD_REQUEST

    } else if (historico.detalhes !== undefined && historico.detalhes !== null && Buffer.byteLength(String(historico.detalhes), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = "[DETALHES] INVÁLIDO (limite de 65535 bytes ultrapassado)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(historico.id_pagamento)) {
        message.ERROR_BAD_REQUEST.field = "[ID_PAGAMENTO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o pagamento existe (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerPagamento.buscarPagamento, historico.id_pagamento)) {
            message.ERROR_BAD_REQUEST.field = "[ID_PAGAMENTO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoHistoricoPagamento,
    atualizarHistoricoPagamento,
    listarHistoricoPagamento,
    buscarHistoricoPagamento,
    excluirHistoricoPagamento,
    validarDados
}