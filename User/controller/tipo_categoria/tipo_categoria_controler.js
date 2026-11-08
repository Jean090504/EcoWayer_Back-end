/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            do Tipo de Categoria
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const tipoCategoriaDAO = require('../../model/DAO/tipo_categoria/tipo_categoria.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Inserir um novo tipo de categoria
const inserirNovoTipoCategoria = async function (tipoCategoria, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = validarDados(tipoCategoria)

            if (validar) {
                return validar // 400
            } else {
                let dados = { nome: tipoCategoria.nome.trim() }
                let result = await tipoCategoriaDAO.insertTipoCategoria(dados)

                if (result) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = { tipo_categoria: { id: Number(result), nome: dados.nome } }

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

// Atualizar um tipo de categoria pelo ID
const atualizarTipoCategoria = async function (tipoCategoria, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarTipoCategoria(id)

            if (resultBuscar.status_code == 200) {
                let validar = validarDados(tipoCategoria)

                if (validar) {
                    return validar // 400
                } else {
                    let dados = { id: Number(id), nome: tipoCategoria.nome.trim() }
                    let result = await tipoCategoriaDAO.updateTipoCategoria(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { tipo_categoria: dados }

                        return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
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

// Listar todos os tipos de categoria
const listarTipoCategoria = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await tipoCategoriaDAO.selectAllTipoCategoria()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.tipo_categoria = result

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

// Buscar um tipo de categoria pelo ID
const buscarTipoCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await tipoCategoriaDAO.selectByIdTipoCategoria(Number(id))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.tipo_categoria = result[0]

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

// Excluir um tipo de categoria pelo ID
const excluirTipoCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarTipoCategoria(id)

        if (resultBuscar.status_code == 200) {
            // FK: não deixa estourar erro do banco se ainda existem categorias usando este tipo
            let emUso = await tipoCategoriaDAO.countCategoriaByIdTipoCategoria(Number(id))

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] EM USO: existem categorias vinculadas a este tipo'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await tipoCategoriaDAO.deleteTipoCategoria(Number(id))

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

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
const validarDados = function (tipoCategoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (tipoCategoria === null || typeof tipoCategoria !== 'object' || Array.isArray(tipoCategoria)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (typeof tipoCategoria.nome !== 'string' || tipoCategoria.nome.trim() == '' || tipoCategoria.nome.trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoTipoCategoria,
    atualizarTipoCategoria,
    listarTipoCategoria,
    buscarTipoCategoria,
    excluirTipoCategoria
}