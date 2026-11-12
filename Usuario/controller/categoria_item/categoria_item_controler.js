/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Categoria e Item (usado só pelos controllers da categoria e do item)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const categoriaItemDAO = require('../../model/DAO/categoria_item/categoria_item.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovoCategoriaItem = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await categoriaItemDAO.insertCategoriaItem(relacao)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                return message.DEFAULT_MESSAGE // 201
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarItensIdCategoria = async function (idCategoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idCategoria)) {
            message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await categoriaItemDAO.selectItensByIdCategoria(Number(idCategoria))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.item = result

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

const excluirItensIdCategoria = async function (idCategoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await categoriaItemDAO.deleteItensByIdCategoria(idCategoria)

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

const buscarCategoriasIdItem = async function (idItem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idItem)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ITEM] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await categoriaItemDAO.selectCategoriasByIdItem(Number(idItem))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.categoria = result

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

const excluirCategoriasIdItem = async function (idItem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await categoriaItemDAO.deleteCategoriasByIdItem(idItem)

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

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(relacao.id_categoria)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_item)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ITEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoCategoriaItem,
    buscarItensIdCategoria,
    excluirItensIdCategoria,
    buscarCategoriasIdItem,
    excluirCategoriasIdItem
}