/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de dataset
 *  Local: controller/dataset/dataset_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const datasetDAO = require('../../model/DAO/dataset/dataset.js')

const inserirNovoDataset = async function (dataset, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = validarDados(dataset)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(dataset)

                let idInserido = await datasetDAO.insertDataset(dataset)

                if (idInserido) {
                    let criado = await datasetDAO.selectByIdDataset(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = criado[0]
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nome: dataset.nome }
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

const atualizarDataset = async function (dataset, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarDataset(id)

            if (resultID.status) {
                let validar = validarDados(dataset)

                if (!validar) {
                    normalizarDados(dataset)
                    dataset.id = Number(id)

                    let result = await datasetDAO.updateDataset(dataset)

                    if (result) {
                        let atualizado = await datasetDAO.selectByIdDataset(dataset.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = atualizado[0]
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: dataset.id, nome: dataset.nome }
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

const listarDataset = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await datasetDAO.selectAllDataset()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.dataset = result

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

const buscarDataset = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await datasetDAO.selectByIdDataset(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.dataset = result[0]

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

const excluirDataset = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarDataset(id)

        if (resultBuscarID.status) {
            let result = await datasetDAO.deleteDataset(id)

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

// Padroniza os dados antes de gravar (descricao é opcional: vazio vira null)
const normalizarDados = function (dataset) {
    dataset.nome = String(dataset.nome).trim()
    dataset.descricao = (dataset.descricao == undefined || dataset.descricao == null || String(dataset.descricao).trim() == '')
        ? null
        : String(dataset.descricao).trim()
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
const validarDados = function (dataset) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (dataset.nome == undefined || dataset.nome == null || String(dataset.nome).trim() == '' || String(dataset.nome).trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, até 100 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (dataset.descricao != undefined && dataset.descricao != null && Buffer.byteLength(String(dataset.descricao), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDO (limite de 65535 bytes ultrapassado)'
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoDataset,
    atualizarDataset,
    listarDataset,
    buscarDataset,
    excluirDataset,
    validarDados
}