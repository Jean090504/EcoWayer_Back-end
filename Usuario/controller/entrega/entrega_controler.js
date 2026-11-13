/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_entrega (entregas de itens negociados)
 *            e das imagens vinculadas a ela (tbl_imagem_entrega)
 *  Autor: Gustavo
 *  Versão: 1.1
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const entregaDAO = require('../../model/DAO/entrega/entrega.js')
const imagemDAO = require('../../model/DAO/imagem/imagem.js')
const controllerImagemEntrega = require('./imagem_entrega_controler.js')

const STATUS_VALIDOS = ['pendente', 'concluida', 'cancelada']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const pesoValido = (peso) => {
    let valor = Number(peso)
    return typeof peso !== 'boolean' && peso !== null && peso !== '' && Number.isFinite(valor) && valor > 0
}

const inserirNovaEntrega = async function (entrega, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(entrega)

        if (validar) {
            return validar // 400
        }

        let validarImg = await validarImagens(entrega.imagem)

        if (validarImg) {
            return validarImg // 400 ou 500
        } else {
            let entregaNormalizada = normalizarDados(entrega)
            let imagens = normalizarImagens(entrega.imagem)
            let id = await entregaDAO.insertEntrega(entregaNormalizada)

            if (id) {
                let vinculosOk = await inserirImagensDaEntrega(id, imagens)
                let entregaCriada = await buscarEntregaCompleta(id)

                if (entregaCriada) {
                    let sucesso = vinculosOk ? message.SUCCESS_CREATED_ITEM : message.SUCCESS_CREATED_WARNING

                    message.DEFAULT_MESSAGE.status = sucesso.status
                    message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                    message.DEFAULT_MESSAGE.message = sucesso.message
                    message.DEFAULT_MESSAGE.response = { entrega: entregaCriada }

                    return message.DEFAULT_MESSAGE // 201
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
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

// Se o body trouxer "imagem", os vínculos antigos são apagados e regravados; se não trouxer, as imagens ficam como estão
const atualizarEntrega = async function (id, entrega, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await entregaDAO.selectEntregaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(entrega)

        if (validar) {
            return validar // 400
        }

        let validarImg = await validarImagens(entrega.imagem)

        if (validarImg) {
            return validarImg // 400 ou 500
        } else {
            let entregaNormalizada = normalizarDados(entrega)
            entregaNormalizada.id = Number(id)

            let imagens = normalizarImagens(entrega.imagem)
            let result = await entregaDAO.updateEntrega(entregaNormalizada)

            if (result) {
                let vinculosOk = true

                if (imagens !== undefined) {
                    let apagou = await controllerImagemEntrega.excluirImagensIdEntrega(Number(id))

                    if (apagou.status_code == 200) {
                        vinculosOk = await inserirImagensDaEntrega(Number(id), imagens)
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                }

                let entregaAtualizada = await buscarEntregaCompleta(Number(id))

                if (entregaAtualizada) {
                    let sucesso = vinculosOk ? message.SUCCESS_UPDETED_ITEM : message.SUCCESS_CREATED_WARNING

                    message.DEFAULT_MESSAGE.status = sucesso.status
                    message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                    message.DEFAULT_MESSAGE.message = sucesso.message
                    message.DEFAULT_MESSAGE.response = { entrega: entregaAtualizada }

                    return message.DEFAULT_MESSAGE // 201
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
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

const listarEntregas = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await entregaDAO.selectAllEntregas()

        if (result && result.length > 0) {
            for (let entrega of result) {
                formatarEntrega(entrega)
                await anexarRelacoes(entrega)
            }

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.entrega = result

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

const buscarEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await entregaDAO.selectEntregaById(Number(id))

        if (result && result.length > 0) {
            formatarEntrega(result[0])
            await anexarRelacoes(result[0])

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.entrega = result[0]

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

// Apaga os vínculos com imagem ANTES de excluir a entrega, por causa da FK
const excluirEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await entregaDAO.selectEntregaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let apagou = await controllerImagemEntrega.excluirImagensIdEntrega(Number(id))

        if (apagou.status_code != 200) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }

        let result = await entregaDAO.deleteEntrega(Number(id))

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: Number(id) }

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const validarDados = function (entrega) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!entrega || typeof entrega !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let status = typeof entrega.status === 'string' ? entrega.status.trim() : ''

    if (!pesoValido(entrega.peso_estimado)) {
        message.ERROR_BAD_REQUEST.field = '[PESO_ESTIMADO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use pendente, concluida ou cancelada)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataValida(entrega.data_entrega)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_ENTREGA] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(entrega.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(entrega.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (entrega) {
    return {
        peso_estimado: Number(entrega.peso_estimado),
        status: entrega.status.trim(),
        data_entrega: entrega.data_entrega.trim(),
        id_anuncio: Number(entrega.id_anuncio),
        id_usuario: Number(entrega.id_usuario)
    }
}

// ----------------------------------- IMAGENS (tbl_imagem_entrega) -----------------------------------

// "imagem" é opcional; se vier, precisa ser lista de { id } e cada imagem precisa existir
const validarImagens = async function (imagens) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (imagens === undefined) {
        return false
    }

    if (!Array.isArray(imagens)) {
        message.ERROR_BAD_REQUEST.field = '[IMAGEM] INVÁLIDO (envie uma lista de objetos { "id": 1 })'
        return message.ERROR_BAD_REQUEST // 400
    }

    for (let imagem of imagens) {
        if (imagem === null || typeof imagem !== 'object' || !idValido(imagem.id)) {
            message.ERROR_BAD_REQUEST.field = '[IMAGEM] INVÁLIDO (cada imagem precisa de um id inteiro maior que 0)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existe = await imagemDAO.selectByIdImagem(Number(imagem.id))

        if (existe === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existe.length == 0) {
            message.ERROR_BAD_REQUEST.field = `[IMAGEM] O ID ${Number(imagem.id)} NÃO EXISTE`
            return message.ERROR_BAD_REQUEST // 400
        }
    }

    return false
}

// Remove ids repetidos (undefined quando "imagem" não veio no body)
const normalizarImagens = function (imagens) {
    if (!Array.isArray(imagens)) {
        return undefined
    }

    return [...new Set(imagens.map(imagem => Number(imagem.id)))].map(id => ({ id }))
}

// Grava os vínculos entrega x imagem; devolve false no primeiro que falhar
const inserirImagensDaEntrega = async function (idEntrega, imagens) {
    if (!imagens || imagens.length == 0) {
        return true
    }

    for (let imagem of imagens) {
        let result = await controllerImagemEntrega.inserirNovoImagemEntrega({
            id_imagem: Number(imagem.id),
            id_entrega: Number(idEntrega)
        })

        if (result.status_code != 201) {
            return false
        }
    }

    return true
}

// Preenche entrega.imagem (se a busca falhar ou vier vazia, fica [])
const anexarImagens = async function (entrega) {
    let result = await controllerImagemEntrega.buscarImagensIdEntrega(entrega.id)

    entrega.imagem = result.status_code == 200 ? result.response.imagem : []

    return entrega
}

const anexarRelacoes = async function (entrega) {
    await anexarImagens(entrega)

    return entrega
}

// DECIMAL vem como texto do mysql2: converte o peso para número
const formatarEntrega = function (entrega) {
    entrega.peso_estimado = Number(entrega.peso_estimado)

    return entrega
}

// Busca a entrega já formatada e com as imagens (ou false)
const buscarEntregaCompleta = async function (id) {
    let result = await entregaDAO.selectEntregaById(Number(id))

    if (result && result.length > 0) {
        formatarEntrega(result[0])
        return await anexarRelacoes(result[0])
    } else {
        return false
    }
}

module.exports = {
    inserirNovaEntrega,
    atualizarEntrega,
    listarEntregas,
    buscarEntrega,
    excluirEntrega
}