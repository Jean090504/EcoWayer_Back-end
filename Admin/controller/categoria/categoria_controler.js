/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de categoria (com img e itens vinculados)
 *  Autor: Maxwillian Santana
 *  Versão: 1.1
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const tipoCategoriaDAO = require('../../model/DAO/tipo_categoria/tipo_categoria.js')

// Acrescenta os itens vinculados (tbl_categoria_item) ao objeto da categoria
const montarCategoria = async function (categoria) {
    let itens = await categoriaDAO.selectItensByCategoria(categoria.id)

    categoria.itens = itens ? itens : []

    return categoria
}

const inserirNovaCategoria = async function (categoria, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(categoria)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(categoria)

                let idInserido = await categoriaDAO.insertCategoria(categoria)

                if (idInserido) {
                    let criada = await categoriaDAO.selectByIdCategoria(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarCategoria(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nome: categoria.nome, pontos: Number(categoria.pontos), img: categoria.img }
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

const atualizarCategoria = async function (categoria, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarCategoria(id)

            if (resultID.status) {
                let validar = await validarDados(categoria)

                if (!validar) {
                    normalizarDados(categoria)
                    categoria.id = Number(id)

                    let result = await categoriaDAO.updateCategoria(categoria)

                    if (result) {
                        let atualizada = await categoriaDAO.selectByIdCategoria(categoria.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarCategoria(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: categoria.id, nome: categoria.nome, pontos: Number(categoria.pontos), img: categoria.img }
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

const listarCategoria = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await categoriaDAO.selectAllCategoria()

        if (result) {
            if (result.length > 0) {
                for (let categoria of result) {
                    await montarCategoria(categoria)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.categoria = result

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

const buscarCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await categoriaDAO.selectByIdCategoria(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.categoria = await montarCategoria(result[0])

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

// Os vínculos com itens são apagados em transação dentro do DAO
const excluirCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarCategoria(id)

        if (resultBuscarID.status) {
            let result = await categoriaDAO.deleteCategoria(id)

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
const normalizarDados = function (categoria) {
    categoria.nome = String(categoria.nome).trim()
    categoria.pontos = Number(categoria.pontos)
    categoria.id_tipo_categoria = Number(categoria.id_tipo_categoria)

    // img é opcional: vazio vira NULL
    if (categoria.img === undefined || categoria.img === null || String(categoria.img).trim() == '') {
        categoria.img = null
    } else {
        categoria.img = String(categoria.img).trim()
    }

    // itens: sem repetição e como número. Se não vier no body, fica undefined (o DAO mantém os vínculos atuais)
    if (Array.isArray(categoria.itens)) {
        categoria.itens = [...new Set(categoria.itens.map(Number))]
    } else {
        categoria.itens = undefined
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (categoria) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (categoria.nome == undefined || categoria.nome == null || String(categoria.nome).trim() == '' || categoria.nome.length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (categoria.pontos === undefined || categoria.pontos === null || categoria.pontos === '' || !Number.isInteger(Number(categoria.pontos)) || Number(categoria.pontos) < 0) {
        message.ERROR_BAD_REQUEST.field = "[PONTOS] INVÁLIDO (número inteiro maior ou igual a 0)"
        return message.ERROR_BAD_REQUEST

    } else if (categoria.id_tipo_categoria === undefined || categoria.id_tipo_categoria === null || categoria.id_tipo_categoria === '' || !Number.isInteger(Number(categoria.id_tipo_categoria))) {
        message.ERROR_BAD_REQUEST.field = "[ID_TIPO_CATEGORIA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (categoria.img !== undefined && categoria.img !== null && (typeof categoria.img != 'string' || categoria.img.trim().length > 245)) {
        message.ERROR_BAD_REQUEST.field = "[IMG] INVÁLIDA (texto com no máximo 245 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (categoria.itens !== undefined && categoria.itens !== null && (!Array.isArray(categoria.itens) || categoria.itens.some(idInvalido))) {
        message.ERROR_BAD_REQUEST.field = "[ITENS] INVÁLIDO (lista de ids de itens, números inteiros maiores que 0)"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o tipo de categoria existe antes de gravar (evita erro de chave estrangeira)
        let tipo = await tipoCategoriaDAO.selectByIdTipoCategoria(categoria.id_tipo_categoria)

        if (!tipo || tipo.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_TIPO_CATEGORIA] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        // Confere se todos os itens informados existem
        if (Array.isArray(categoria.itens) && categoria.itens.length > 0) {
            let ids = [...new Set(categoria.itens.map(Number))]
            let existentes = await categoriaDAO.selectItensExistentes(ids)

            if (!existentes || existentes.length != ids.length) {
                message.ERROR_BAD_REQUEST.field = "[ITENS] contém id de item não encontrado"
                return message.ERROR_BAD_REQUEST
            }
        }

        return false
    }
}

module.exports = {
    inserirNovaCategoria,
    atualizarCategoria,
    listarCategoria,
    buscarCategoria,
    excluirCategoria,
    validarDados
}