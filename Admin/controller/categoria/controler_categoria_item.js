/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD da tabela intermediária categoria_item (vínculo categoria <-> item)
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const categoriaItemDAO = require('../../model/DAO/categoria_item/categoria_item.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const itemDAO = require('../../m "odel/DAO/item/item.js')

// AJUSTE o caminho/nome conforme o seu arquivo da controller de categoria
const controllerCategoria = require('../categoria/controller_categoria.js')

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Confere se categoria e item existem. Retorna a mensagem de erro, ou false se estiver tudo certo
const validarExistencia = async function (idCategoria, idItem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let categoria = await categoriaDAO.selectByIdCategoria(idCategoria)
    if (!categoria || categoria.length == 0) {
        message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] não encontrado"
        return message.ERROR_BAD_REQUEST
    }

    if (idItem !== undefined) {
        let item = await itemDAO.selectByIdItem(idItem)
        if (!item || item.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_ITEM] não encontrado"
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

// CREATE - vincula um item a uma categoria. Body: { "id_categoria": 2, "id_item": 3 }
const inserirCategoriaItem = async function (dados, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            if (idInvalido(dados.id_categoria)) {
                message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] INVÁLIDO"
                return message.ERROR_BAD_REQUEST
            }

            if (idInvalido(dados.id_item)) {
                message.ERROR_BAD_REQUEST.field = "[ID_ITEM] INVÁLIDO"
                return message.ERROR_BAD_REQUEST
            }

            let erro = await validarExistencia(dados.id_categoria, dados.id_item)
            if (erro) return erro // 400

            let existe = await categoriaItemDAO.selectVinculo(dados.id_categoria, dados.id_item)
            if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL // 500

            if (existe.length > 0) {
                message.ERROR_BAD_REQUEST.field = "Esse item já está vinculado a essa categoria"
                return message.ERROR_BAD_REQUEST
            }

            let inserido = await categoriaItemDAO.insertCategoriaItem(dados.id_categoria, dados.id_item)

            if (inserido) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                // devolve a categoria já com os itens, no mesmo formato da listagem
                message.DEFAULT_MESSAGE.response = (await controllerCategoria.buscarCategoria(dados.id_categoria)).response.categoria

                return message.DEFAULT_MESSAGE // 201
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// READ - lista todas as categorias com seus itens (mesmo JSON que você mostrou)
const listarCategoriaItem = async function () {
    try {
        return await controllerCategoria.listarCategoria()
    } catch (error) {
        console.log(error)
        let message = JSON.parse(JSON.stringify(configMessages))
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// READ - uma categoria com seus itens
const buscarCategoriaItem = async function (idCategoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (idInvalido(idCategoria)) {
            message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        }

        return await controllerCategoria.buscarCategoria(idCategoria) // 200, 404 ou 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// UPDATE - substitui TODOS os itens de uma categoria. Body: { "itens": [1, 6] }
// (a tabela não tem id próprio, então "atualizar" = redefinir a lista de itens da categoria)
const atualizarCategoriaItem = async function (idCategoria, dados, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            if (idInvalido(idCategoria)) {
                message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] Inválido'
                return message.ERROR_BAD_REQUEST
            }

            if (!Array.isArray(dados.itens) || dados.itens.some(idInvalido)) {
                message.ERROR_BAD_REQUEST.field = "[ITENS] INVÁLIDO (lista de ids de itens, números inteiros maiores que 0)"
                return message.ERROR_BAD_REQUEST
            }

            let erro = await validarExistencia(idCategoria)
            if (erro) return erro // 400

            let ids = [...new Set(dados.itens.map(Number))]

            if (ids.length > 0) {
                let existentes = await categoriaDAO.selectItensExistentes(ids)

                if (!existentes || existentes.length != ids.length) {
                    message.ERROR_BAD_REQUEST.field = "[ITENS] contém id de item não encontrado"
                    return message.ERROR_BAD_REQUEST
                }
            }

            let result = await categoriaItemDAO.replaceItensDaCategoria(idCategoria, ids)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = (await controllerCategoria.buscarCategoria(idCategoria)).response.categoria

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// DELETE - remove o vínculo de um item com uma categoria
const excluirCategoriaItem = async function (idCategoria, idItem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (idInvalido(idCategoria) || idInvalido(idItem)) {
            message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] ou [ID_ITEM] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existe = await categoriaItemDAO.selectVinculo(idCategoria, idItem)

        if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL // 500
        if (existe.length == 0) return message.ERROR_NOT_FOUND // 404

        let result = await categoriaItemDAO.deleteCategoriaItem(idCategoria, idItem)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id_categoria: Number(idCategoria), id_item: Number(idItem) }

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    inserirCategoriaItem,
    listarCategoriaItem,
    buscarCategoriaItem,
    atualizarCategoriaItem,
    excluirCategoriaItem
}