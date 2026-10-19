/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de treinamento de IA
 *  Local: controller/treinamento_ia/treinamento_ia_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const treinamentoIADAO = require('../../model/DAO/treinamento_ia/treinamento_ia.js')

// Controllers que já existem e fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports).
const controlerIA = require('../ia/ia_controler.js')              // buscarIA
const controlerDataset = require('../dataset/dataset_controler.js') // buscarDataset

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_treinamento_ia LIKE 'status';)
const STATUS_VALIDOS = ['PENDENTE', 'TREINANDO', 'CONCLUIDO', 'FALHOU']

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem a mesma IA / dataset.
// O cache evita consultar o mesmo registro várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca id_ia e id_dataset pelos objetos correspondentes
const montarTreinamento = async function (treinamento, cache = {}) {
    treinamento.ia = await buscarComCache(cache, 'ia', controlerIA.buscarIA, treinamento.id_ia)
    treinamento.dataset = await buscarComCache(cache, 'dataset', controlerDataset.buscarDataset, treinamento.id_dataset)

    delete treinamento.id_ia
    delete treinamento.id_dataset

    return treinamento
}

const inserirNovoTreinamentoIA = async function (treinamento, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(treinamento, true)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(treinamento)

                let idInserido = await treinamentoIADAO.insertTreinamentoIA(treinamento)

                if (idInserido) {
                    let criado = await treinamentoIADAO.selectByIdTreinamentoIA(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarTreinamento(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: treinamento.status }
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

const atualizarTreinamentoIA = async function (treinamento, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarTreinamentoIA(id)

            if (resultID.status) {
                let validar = await validarDados(treinamento, false)

                if (!validar) {
                    normalizarDados(treinamento)
                    treinamento.id = Number(id)

                    let result = await treinamentoIADAO.updateTreinamentoIA(treinamento)

                    if (result) {
                        let atualizado = await treinamentoIADAO.selectByIdTreinamentoIA(treinamento.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarTreinamento(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: treinamento.id, status: treinamento.status }
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

const listarTreinamentoIA = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await treinamentoIADAO.selectAllTreinamentoIA()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                for (let treinamento of result) {
                    await montarTreinamento(treinamento, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.treinamento_ia = result

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

const buscarTreinamentoIA = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await treinamentoIADAO.selectByIdTreinamentoIA(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.treinamento_ia = await montarTreinamento(result[0])

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

const excluirTreinamentoIA = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarTreinamentoIA(id)

        if (resultBuscarID.status) {
            let result = await treinamentoIADAO.deleteTreinamentoIA(id)

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
const normalizarDados = function (treinamento) {
    treinamento.status = String(treinamento.status)
    treinamento.id_externo = (treinamento.id_externo == undefined || treinamento.id_externo == null || String(treinamento.id_externo).trim() == '')
        ? null
        : String(treinamento.id_externo).trim()

    if (treinamento.id_ia !== undefined) {
        treinamento.id_ia = Number(treinamento.id_ia)
    }

    if (treinamento.id_dataset !== undefined) {
        treinamento.id_dataset = Number(treinamento.id_dataset)
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// "inserir" = true exige id_ia e id_dataset; na atualização eles não são alterados.
const validarDados = async function (treinamento, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (treinamento.status == undefined || treinamento.status == null || !STATUS_VALIDOS.includes(String(treinamento.status))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (valores aceitos: ' + STATUS_VALIDOS.join(', ') + ')'
        return message.ERROR_BAD_REQUEST

    } else if (treinamento.id_externo != undefined && treinamento.id_externo != null && String(treinamento.id_externo).trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = '[ID_EXTERNO] INVÁLIDO (até 255 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(treinamento.id_ia)) {
        message.ERROR_BAD_REQUEST.field = '[ID_IA] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(treinamento.id_dataset)) {
        message.ERROR_BAD_REQUEST.field = '[ID_DATASET] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se IA e dataset existem (evita erro de chave estrangeira)
        if (inserir && !await buscarRelacionado(controlerIA.buscarIA, treinamento.id_ia)) {
            message.ERROR_BAD_REQUEST.field = '[ID_IA] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        if (inserir && !await buscarRelacionado(controlerDataset.buscarDataset, treinamento.id_dataset)) {
            message.ERROR_BAD_REQUEST.field = '[ID_DATASET] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoTreinamentoIA,
    atualizarTreinamentoIA,
    listarTreinamentoIA,
    buscarTreinamentoIA,
    excluirTreinamentoIA,
    validarDados
}