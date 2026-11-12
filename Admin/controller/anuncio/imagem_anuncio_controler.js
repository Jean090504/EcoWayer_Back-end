/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Imagem e Anúncio (usado só pelo controller do anúncio).
 *            Toda a lógica de imagem do anúncio fica aqui; para conferir se a imagem existe,
 *            chama o controller de imagem.
 *  Local: controller/anuncio/imagem_anuncio_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const imagemAnuncioDAO = require('../../model/DAO/imagem_anuncio/imagem_anuncio.js')
const controlerImagem = require('../imagem/imagem_controler.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovaImagemAnuncio = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await imagemAnuncioDAO.insertImagemAnuncio(relacao)

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

const buscarImagensIdAnuncio = async function (idAnuncio) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idAnuncio)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await imagemAnuncioDAO.selectImagensByIdAnuncio(Number(idAnuncio))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.imagem = result.map(function (row) {
                    return {
                        id: row.id,
                        url: row.url,
                        tipo_imagem: {
                            id: row.tipo_imagem_id,
                            tipo: row.tipo_imagem_tipo
                        }
                    }
                })

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

const excluirImagensIdAnuncio = async function (idAnuncio) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await imagemAnuncioDAO.deleteImagensByIdAnuncio(idAnuncio)

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

// ---------------- Funções usadas pelo controller do anúncio ----------------

// Valida a lista "imagem" enviada no anúncio. Retorna false se está correta, ou o ERROR_BAD_REQUEST.
// Cada imagem é conferida no controller de imagem (evita erro de chave estrangeira).
const validarListaImagens = async function (imagens) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(imagens)) {
        message.ERROR_BAD_REQUEST.field = '[IMAGEM] INVÁLIDO (envie uma lista, ex: [{ "id": 1 }])'
        return message.ERROR_BAD_REQUEST
    }

    for (let item of imagens) {
        if (item == null || !idValido(item.id)) {
            message.ERROR_BAD_REQUEST.field = '[IMAGEM] cada item precisa de um id válido, ex: { "id": 1 }'
            return message.ERROR_BAD_REQUEST
        }

        let resultImagem = await controlerImagem.buscarImagem(Number(item.id))

        if (!resultImagem.status) {
            message.ERROR_BAD_REQUEST.field = '[IMAGEM] id ' + item.id + ' não encontrado'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

// Remove ids de imagem repetidos da lista
const normalizarListaImagens = function (imagens) {
    let ids = [...new Set(imagens.map(item => Number(item.id)))]

    return ids.map(idImagem => ({ id: idImagem }))
}

// Grava os vínculos do anúncio com cada imagem da lista (true se todos gravaram)
const inserirImagensDoAnuncio = async function (idAnuncio, imagens) {
    for (let imagem of imagens) {
        let resultRelacao = await inserirNovaImagemAnuncio({
            id_imagem: imagem.id,
            id_anuncio: idAnuncio
        })

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

// Apaga os vínculos antigos e grava a lista nova (usado no PUT do anúncio)
const substituirImagensDoAnuncio = async function (idAnuncio, imagens) {
    let resultDelete = await excluirImagensIdAnuncio(idAnuncio)

    if (!resultDelete.status) {
        return false
    }

    return await inserirImagensDoAnuncio(idAnuncio, imagens)
}

// Busca as imagens do anúncio e anexa no objeto (anuncio.imagem)
const anexarImagensAoAnuncio = async function (anuncio) {
    let resultImagens = await buscarImagensIdAnuncio(anuncio.id)

    anuncio.imagem = resultImagens.status ? resultImagens.response.imagem : []

    return anuncio
}

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(relacao.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_imagem)) {
        message.ERROR_BAD_REQUEST.field = '[ID_IMAGEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovaImagemAnuncio,
    buscarImagensIdAnuncio,
    excluirImagensIdAnuncio,
    validarListaImagens,
    normalizarListaImagens,
    inserirImagensDoAnuncio,
    substituirImagensDoAnuncio,
    anexarImagensAoAnuncio
}