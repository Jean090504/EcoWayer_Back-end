/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            do Material Aceito
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const materialAceitoDAO = require('../../model/DAO/material_aceito/material_aceito.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Inserir um novo material aceito
const inserirNovoMaterialAceito = async function (material, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = validarDados(material)

            if (validar) {
                return validar // 400
            } else {
                let dados = { nome: material.nome.trim(), icone: material.icone.trim() }

                let duplicado = await verificarDuplicidade(dados)

                if (duplicado) {
                    return duplicado // 400 ou 500
                } else {
                    let result = await materialAceitoDAO.insertMaterialAceito(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { material_aceito: { id: Number(result), nome: dados.nome, icone: dados.icone } }

                        return message.DEFAULT_MESSAGE // 201
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
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

// Atualizar um material aceito pelo ID
const atualizarMaterialAceito = async function (material, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarMaterialAceito(id)

            if (resultBuscar.status_code == 200) {
                let validar = validarDados(material)

                if (validar) {
                    return validar // 400
                } else {
                    let dados = { id: Number(id), nome: material.nome.trim(), icone: material.icone.trim() }

                    let duplicado = await verificarDuplicidade(dados, dados.id)

                    if (duplicado) {
                        return duplicado // 400 ou 500
                    } else {
                        let result = await materialAceitoDAO.updateMaterialAceito(dados)

                        if (result) {
                            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                            message.DEFAULT_MESSAGE.response = { material_aceito: dados }

                            return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                        } else {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
                    }
                }
            } else {
                return resultBuscar // 400, 404 ou 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Listar todos os materiais aceitos
const listarMaterialAceito = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await materialAceitoDAO.selectAllMaterialAceito()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.material_aceito = result

            return message.DEFAULT_MESSAGE // 200
        } else if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Buscar um material aceito pelo ID
const buscarMaterialAceito = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await materialAceitoDAO.selectByIdMaterialAceito(Number(id))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.material_aceito = result[0]

                return message.DEFAULT_MESSAGE // 200
            } else if (result === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Excluir um material aceito pelo ID
const excluirMaterialAceito = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarMaterialAceito(id)

        if (resultBuscar.status_code == 200) {
            // FK: não deixa estourar erro do banco se ainda existem pontos de coleta que aceitam este material
            let emUso = await materialAceitoDAO.countPontoColetaByIdMaterialAceito(Number(id))

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] EM USO: existem pontos de coleta que aceitam este material'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await materialAceitoDAO.deleteMaterialAceito(Number(id))

                if (result) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
                    message.DEFAULT_MESSAGE.response = { id: Number(id) }

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscar // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// nome é UNIQUE no banco: confere antes de gravar para devolver 400 em vez de erro do banco
// idIgnorar: no PUT, o próprio registro não conta como duplicado
const verificarDuplicidade = async function (material, idIgnorar) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let porNome = await materialAceitoDAO.selectByNomeMaterialAceito(material.nome)

    if (porNome === false) {
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } else if (porNome.some(item => item.id !== idIgnorar)) {
        message.ERROR_BAD_REQUEST.field = '[NOME] JÁ CADASTRADO'
        return message.ERROR_BAD_REQUEST // 400
    }

    return false
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
const validarDados = function (material) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (material === null || typeof material !== 'object' || Array.isArray(material)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (typeof material.nome !== 'string' || material.nome.trim() == '' || material.nome.trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (typeof material.icone !== 'string' || material.icone.trim() == '' || material.icone.trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = '[ICONE] INVÁLIDO'
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
    excluirMaterialAceito
}