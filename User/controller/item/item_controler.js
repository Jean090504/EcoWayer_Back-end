/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            do Item (e das categorias vinculadas a ele)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const itemDAO = require('../../model/DAO/item/item.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const controllerCategoriaItem = require('../categoria_item/categoria_item_controler.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// INT do MySQL: inteiro >= 0 e até 2147483647
const inteiroValido = (valor) =>
    (typeof valor === 'number' || typeof valor === 'string') &&
    /^\d+$/.test(String(valor)) && Number.isSafeInteger(Number(valor)) && Number(valor) <= 2147483647

// Inserir um novo item (com as categorias vinculadas, se vierem no body)
const inserirNovoItem = async function (item, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(item)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = normalizarDados(item)
                let idItem = await itemDAO.insertItem(dados)

                if (idItem) {
                    let vinculosOk = await inserirCategoriasDoItem(idItem, dados.categoria)
                    let itemCriado = await buscarItemCompleto(idItem)

                    if (itemCriado) {
                        let sucesso = vinculosOk ? message.SUCCESS_CREATED_ITEM : message.SUCCESS_CREATED_WARNING

                        message.DEFAULT_MESSAGE.status = sucesso.status
                        message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                        message.DEFAULT_MESSAGE.message = sucesso.message
                        message.DEFAULT_MESSAGE.response = { item: itemCriado }

                        return message.DEFAULT_MESSAGE // 201
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
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

// Atualizar um item pelo ID
// Se o body trouxer "categoria", os vínculos antigos são apagados e regravados; se não trouxer, os vínculos ficam como estão
const atualizarItem = async function (item, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarItem(id)

            if (resultBuscar.status_code == 200) {
                let validar = await validarDados(item)

                if (validar) {
                    return validar // 400 ou 500
                } else {
                    let dados = normalizarDados(item)
                    dados.id = Number(id)

                    let result = await itemDAO.updateItem(dados)

                    if (result) {
                        let vinculosOk = true

                        if (dados.categoria !== undefined) {
                            let apagou = await controllerCategoriaItem.excluirCategoriasIdItem(dados.id)

                            if (apagou.status_code == 200) {
                                vinculosOk = await inserirCategoriasDoItem(dados.id, dados.categoria)
                            } else {
                                return message.ERROR_INTERNAL_SEVER_MODEL // 500
                            }
                        }

                        let itemAtualizado = await buscarItemCompleto(dados.id)

                        if (itemAtualizado) {
                            let sucesso = vinculosOk ? message.SUCCESS_UPDETED_ITEM : message.SUCCESS_CREATED_WARNING

                            message.DEFAULT_MESSAGE.status = sucesso.status
                            message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                            message.DEFAULT_MESSAGE.message = sucesso.message
                            message.DEFAULT_MESSAGE.response = { item: itemAtualizado }

                            return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                        } else {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
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

// Listar todos os itens (cada um com suas categorias)
const listarItem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await itemDAO.selectAllItem()

        if (result && result.length > 0) {
            for (let item of result) {
                await anexarRelacoes(item)
            }

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.item = result

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

// Buscar um item pelo ID (com suas categorias)
const buscarItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await itemDAO.selectByIdItem(Number(id))

            if (result && result.length > 0) {
                await anexarRelacoes(result[0])

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.item = result[0]

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

// Excluir um item pelo ID (apaga os vínculos com categoria ANTES, por causa da FK)
const excluirItem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarItem(id)

        if (resultBuscar.status_code == 200) {
            let apagou = await controllerCategoriaItem.excluirCategoriasIdItem(Number(id))

            if (apagou.status_code == 200) {
                let result = await itemDAO.deleteItem(Number(id))

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
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        } else {
            return resultBuscar // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ----------------------------------- HELPERS -----------------------------------

// Monta o ERROR_BAD_REQUEST (clone) com o campo inválido
const erroCampo = function (field) {
    let message = JSON.parse(JSON.stringify(configMessages))

    message.ERROR_BAD_REQUEST.field = field
    return message.ERROR_BAD_REQUEST // 400
}

// Busca o item já com as categorias (ou false)
const buscarItemCompleto = async function (id) {
    let result = await itemDAO.selectByIdItem(Number(id))

    if (result && result.length > 0) {
        return await anexarRelacoes(result[0])
    } else {
        return false
    }
}

// Preenche item.categoria (se a busca falhar ou vier vazia, fica [])
const anexarCategorias = async function (item) {
    let result = await controllerCategoriaItem.buscarCategoriasIdItem(item.id)

    item.categoria = result.status_code == 200 ? result.response.categoria : []

    return item
}

const anexarRelacoes = async function (item) {
    await anexarCategorias(item)

    return item
}

// Grava os vínculos item x categoria; devolve false no primeiro que falhar
const inserirCategoriasDoItem = async function (idItem, lista) {
    if (!lista || lista.length == 0) {
        return true
    }

    for (let categoria of lista) {
        let result = await controllerCategoriaItem.inserirNovoCategoriaItem({
            id_categoria: Number(categoria.id),
            id_item: Number(idItem)
        })

        if (result.status_code != 201) {
            return false
        }
    }

    return true
}

// Remove ids repetidos e converte/limpa os campos
const normalizarDados = function (item) {
    let dados = {
        nome: item.nome.trim(),
        descricao: item.descricao.trim(),
        pontos_base: Number(item.pontos_base),
        status: item.status.trim()
    }

    if (Array.isArray(item.categoria)) {
        dados.categoria = [...new Set(item.categoria.map(categoria => Number(categoria.id)))].map(id => ({ id }))
    }

    return dados
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
const validarDados = async function (item) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        return erroCampo('[BODY] INVÁLIDO')
    } else if (typeof item.nome !== 'string' || item.nome.trim() == '' || item.nome.trim().length > 45) {
        return erroCampo('[NOME] INVÁLIDO')
    } else if (typeof item.descricao !== 'string' || item.descricao.trim() == '' || item.descricao.trim().length > 500) {
        return erroCampo('[DESCRICAO] INVÁLIDA')
    } else if (!inteiroValido(item.pontos_base)) {
        return erroCampo('[PONTOS_BASE] INVÁLIDO')
    } else if (typeof item.status !== 'string' || item.status.trim() == '' || item.status.trim().length > 45) {
        return erroCampo('[STATUS] INVÁLIDO')
    } else if (item.categoria !== undefined && !Array.isArray(item.categoria)) {
        return erroCampo('[CATEGORIA] INVÁLIDA (envie uma lista de objetos { "id": 1 })')
    } else {
        // FK: cada categoria da lista precisa ser { id } válido e existir
        if (Array.isArray(item.categoria)) {
            for (let categoria of item.categoria) {
                if (categoria === null || typeof categoria !== 'object' || !idValido(categoria.id)) {
                    return erroCampo('[CATEGORIA] INVÁLIDA (cada categoria precisa de um id inteiro maior que 0)')
                }

                let existe = await categoriaDAO.selectByIdCategoria(Number(categoria.id))

                if (existe === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (existe.length == 0) {
                    return erroCampo(`[CATEGORIA] O ID ${Number(categoria.id)} NÃO EXISTE`)
                }
            }
        }

        return false
    }
}

module.exports = {
    inserirNovoItem,
    atualizarItem,
    listarItem,
    buscarItem,
    excluirItem
}