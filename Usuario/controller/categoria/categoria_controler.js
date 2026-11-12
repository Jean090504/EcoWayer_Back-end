/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da Categoria (e dos itens vinculados a ela)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const tipoCategoriaDAO = require('../../model/DAO/tipo_categoria/tipo_categoria.js')
const itemDAO = require('../../model/DAO/item/item.js')
const controllerCategoriaItem = require('../categoria_item/categoria_item_controler.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// INT do MySQL: inteiro >= 0 e até 2147483647
const inteiroValido = (valor) =>
    (typeof valor === 'number' || typeof valor === 'string') &&
    /^\d+$/.test(String(valor)) && Number.isSafeInteger(Number(valor)) && Number(valor) <= 2147483647

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// Inserir uma nova categoria (com os itens vinculados, se vierem no body)
const inserirNovoCategoria = async function (categoria, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(categoria)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = normalizarDados(categoria)
                let idCategoria = await categoriaDAO.insertCategoria(dados)

                if (idCategoria) {
                    let vinculosOk = await inserirItensDaCategoria(idCategoria, dados.item)
                    let categoriaCriada = await buscarCategoriaCompleta(idCategoria)

                    if (categoriaCriada) {
                        let sucesso = vinculosOk ? message.SUCCESS_CREATED_ITEM : message.SUCCESS_CREATED_WARNING

                        message.DEFAULT_MESSAGE.status = sucesso.status
                        message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                        message.DEFAULT_MESSAGE.message = sucesso.message
                        message.DEFAULT_MESSAGE.response = { categoria: categoriaCriada }

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

// Atualizar uma categoria pelo ID
// Se o body trouxer "item", os vínculos antigos são apagados e regravados; se não trouxer, os vínculos ficam como estão
const atualizarCategoria = async function (categoria, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarCategoria(id)

            if (resultBuscar.status_code == 200) {
                let validar = await validarDados(categoria, Number(id))

                if (validar) {
                    return validar // 400 ou 500
                } else {
                    let dados = normalizarDados(categoria)
                    dados.id = Number(id)

                    let result = await categoriaDAO.updateCategoria(dados)

                    if (result) {
                        let vinculosOk = true

                        if (dados.item !== undefined) {
                            let apagou = await controllerCategoriaItem.excluirItensIdCategoria(dados.id)

                            if (apagou.status_code == 200) {
                                vinculosOk = await inserirItensDaCategoria(dados.id, dados.item)
                            } else {
                                return message.ERROR_INTERNAL_SEVER_MODEL // 500
                            }
                        }

                        let categoriaAtualizada = await buscarCategoriaCompleta(dados.id)

                        if (categoriaAtualizada) {
                            let sucesso = vinculosOk ? message.SUCCESS_UPDETED_ITEM : message.SUCCESS_CREATED_WARNING

                            message.DEFAULT_MESSAGE.status = sucesso.status
                            message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                            message.DEFAULT_MESSAGE.message = sucesso.message
                            message.DEFAULT_MESSAGE.response = { categoria: categoriaAtualizada }

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

// Listar todas as categorias (cada uma com seus itens)
const listarCategoria = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await categoriaDAO.selectAllCategoria()

        if (result && result.length > 0) {
            for (let categoria of result) {
                await anexarRelacoes(categoria)
            }

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.categoria = result

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

// Buscar uma categoria pelo ID (com seus itens)
const buscarCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await categoriaDAO.selectByIdCategoria(Number(id))

            if (result && result.length > 0) {
                await anexarRelacoes(result[0])

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.categoria = result[0]

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

// Excluir uma categoria pelo ID (apaga os vínculos com item ANTES, por causa da FK)
const excluirCategoria = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarCategoria(id)

        if (resultBuscar.status_code == 200) {
            // FK de outras tabelas: não deixa estourar erro do banco se a categoria está em uso
            let emUso = await categoriaDAO.countVinculosByIdCategoria(Number(id))

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] EM USO: existem anúncios, pontos de coleta, pontos ou regra de pontuação vinculados a esta categoria'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let apagou = await controllerCategoriaItem.excluirItensIdCategoria(Number(id))

                if (apagou.status_code == 200) {
                    let result = await categoriaDAO.deleteCategoria(Number(id))

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

// Busca a categoria já com os itens (ou false)
const buscarCategoriaCompleta = async function (id) {
    let result = await categoriaDAO.selectByIdCategoria(Number(id))

    if (result && result.length > 0) {
        return await anexarRelacoes(result[0])
    } else {
        return false
    }
}

// Preenche categoria.item (se a busca falhar ou vier vazia, fica [])
const anexarItens = async function (categoria) {
    let result = await controllerCategoriaItem.buscarItensIdCategoria(categoria.id)

    categoria.item = result.status_code == 200 ? result.response.item : []

    return categoria
}

// Preenche categoria.tipo_categoria com { id, nome } (se a busca falhar ou vier vazia, fica null)
const anexarTipoCategoria = async function (categoria) {
    let result = await tipoCategoriaDAO.selectByIdTipoCategoria(Number(categoria.id_tipo_categoria))

    categoria.tipo_categoria = result && result.length > 0 ? result[0] : null

    return categoria
}

const anexarRelacoes = async function (categoria) {
    await anexarTipoCategoria(categoria)
    await anexarItens(categoria)

    return categoria
}

// Grava os vínculos categoria x item; devolve false no primeiro que falhar
const inserirItensDaCategoria = async function (idCategoria, lista) {
    if (!lista || lista.length == 0) {
        return true
    }

    for (let item of lista) {
        let result = await controllerCategoriaItem.inserirNovoCategoriaItem({
            id_categoria: Number(idCategoria),
            id_item: Number(item.id)
        })

        if (result.status_code != 201) {
            return false
        }
    }

    return true
}

// Remove ids repetidos e converte/limpa os campos
const normalizarDados = function (categoria) {
    let dados = {
        nome: categoria.nome.trim(),
        pontos: Number(categoria.pontos),
        id_tipo_categoria: Number(categoria.id_tipo_categoria),
        img: vazio(categoria.img) ? null : categoria.img.trim(),
        cor: vazio(categoria.cor) ? null : categoria.cor.trim()
    }

    if (Array.isArray(categoria.item)) {
        dados.item = [...new Set(categoria.item.map(item => Number(item.id)))].map(id => ({ id }))
    }

    return dados
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
// idIgnorar: no PUT, a própria categoria não conta como nome duplicado
const validarDados = async function (categoria, idIgnorar) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (categoria === null || typeof categoria !== 'object' || Array.isArray(categoria)) {
        return erroCampo('[BODY] INVÁLIDO')
    } else if (typeof categoria.nome !== 'string' || categoria.nome.trim() == '' || categoria.nome.trim().length > 100) {
        return erroCampo('[NOME] INVÁLIDO')
    } else if (!inteiroValido(categoria.pontos)) {
        return erroCampo('[PONTOS] INVÁLIDO')
    } else if (!idValido(categoria.id_tipo_categoria)) {
        return erroCampo('[ID_TIPO_CATEGORIA] INVÁLIDO')
    } else if (!vazio(categoria.img) && (typeof categoria.img !== 'string' || categoria.img.trim().length > 245)) {
        return erroCampo('[IMG] INVÁLIDA')
    } else if (!vazio(categoria.cor) && (typeof categoria.cor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(categoria.cor.trim()))) {
        return erroCampo('[COR] INVÁLIDA (use o formato #RRGGBB)')
    } else if (categoria.item !== undefined && !Array.isArray(categoria.item)) {
        return erroCampo('[ITEM] INVÁLIDO (envie uma lista de objetos { "id": 1 })')
    } else {
        // FK: o tipo de categoria precisa existir
        let tipo = await tipoCategoriaDAO.selectByIdTipoCategoria(Number(categoria.id_tipo_categoria))

        if (tipo === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (tipo.length == 0) {
            return erroCampo('[ID_TIPO_CATEGORIA] NÃO EXISTE')
        }

        // nome é UNIQUE no banco: confere antes de gravar
        let duplicado = await categoriaDAO.selectByNomeCategoria(categoria.nome.trim())

        if (duplicado === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (duplicado.some(item => item.id !== idIgnorar)) {
            return erroCampo('[NOME] JÁ CADASTRADO')
        }

        // FK: cada item da lista precisa ser { id } válido e existir
        if (Array.isArray(categoria.item)) {
            for (let item of categoria.item) {
                if (item === null || typeof item !== 'object' || !idValido(item.id)) {
                    return erroCampo('[ITEM] INVÁLIDO (cada item precisa de um id inteiro maior que 0)')
                }

                let existe = await itemDAO.selectByIdItem(Number(item.id))

                if (existe === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (existe.length == 0) {
                    return erroCampo(`[ITEM] O ID ${Number(item.id)} NÃO EXISTE`)
                }
            }
        }

        return false
    }
}

module.exports = {
    inserirNovoCategoria,
    atualizarCategoria,
    listarCategoria,
    buscarCategoria,
    excluirCategoria
}