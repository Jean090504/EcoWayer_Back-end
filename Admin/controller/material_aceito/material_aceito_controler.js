/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de material aceito
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const materialAceitoDAO = require('../../model/DAO/material_aceito/material_aceito.js')

// ---------- helpers ----------
const ehJson = (contentType) =>
    String(contentType || '').split(';')[0].trim().toUpperCase() === 'APPLICATION/JSON'

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovoMaterialAceito = async function (material, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = await validarDados(material)

        if (validar) {
            return validar // 400
        }

        let dados = {
            nome: material.nome.trim(),
            icone: material.icone.trim()
        }

        let result = await materialAceitoDAO.insertMaterialAceito(dados)

        if (result) { // 201
            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = {
                material_aceito: {
                    id: result,
                    nome: dados.nome,
                    icone: dados.icone
                }
            }

            return message.DEFAULT_MESSAGE
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarMaterialAceito = async function (material, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let resultID = await buscarMaterialAceito(id)

        if (!resultID.status) {
            return resultID // 400, 404 ou 500
        }

        let validar = await validarDados(material)

        if (validar) {
            return validar // 400
        }

        // Somente campos permitidos; o ID vem sempre da URL
        let dados = {
            id: Number(id),
            nome: material.nome.trim(),
            icone: material.icone.trim()
        }

        let result = await materialAceitoDAO.updateMaterialAceito(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = {
                material_aceito: { id: dados.id, nome: dados.nome, icone: dados.icone }
            }

            return message.DEFAULT_MESSAGE // status_code conforme configMessages
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarMaterialAceito = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await materialAceitoDAO.selectAllMaterialAceito()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.material_aceito = result

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

const buscarMaterialAceito = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await materialAceitoDAO.selectByIdMaterialAceito(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }

        if (result.length > 0) { // array vazio é truthy: checar length
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.material_aceito = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirMaterialAceito = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarMaterialAceito(id)

        if (!resultBuscarID.status) {
            return resultBuscarID // 400, 404 ou 500
        }

        let result = await materialAceitoDAO.deleteMaterialAceito(Number(id))

        if (result === 'EM_USO') {
            message.ERROR_BAD_REQUEST.field = '[MATERIAL] Em uso por outro registro, não pode ser excluído'
            return message.ERROR_BAD_REQUEST // 400
        }

        if (result) {
            return message.SUCCESS_DELETED_ITEM // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Retorna false quando válido, ou ERROR_BAD_REQUEST com .field
const validarDados = async function (material) {
    let message = JSON.parse(JSON.stringify(configMessages)) // clone: nunca mutar o singleton

    if (material === null || typeof material !== 'object' || Array.isArray(material)) {
        message.ERROR_BAD_REQUEST.field = "[BODY] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (typeof material.nome !== 'string' || material.nome.trim() === '' || material.nome.trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (até 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (typeof material.icone !== 'string' || material.icone.trim() === '' || material.icone.trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = "[ICONE] INVÁLIDO (até 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovoMaterialAceito,
    atualizarMaterialAceito,
    listarMaterialAceito,
    buscarMaterialAceito,
    excluirMaterialAceito,
    validarDados
}