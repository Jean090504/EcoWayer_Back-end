/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Alertas e Anúncio (usado só pelo controller de alertas).
 *            Toda a lógica de anúncio do alerta fica aqui; para conferir e montar o anúncio,
 *            chama o controller de anúncio.
 *  Local: controller/alertas/alertas_anuncio_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const alertasAnuncioDAO = require('../../model/DAO/alertas_anuncio/alertas_anuncio.js')

// CONFIRME o caminho e o nome da função exportada (module.exports) do controller de anúncio
const controlerAnuncio = require('../anuncio/anuncio_controler.js') // buscarAnuncio

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovoAlertaAnuncio = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await alertasAnuncioDAO.insertAlertaAnuncio(relacao)

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

// Busca os ids no DAO e monta cada anúncio completo chamando o controller de anúncio
const buscarAnunciosIdAlerta = async function (idAlerta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idAlerta)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ALERTAS] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await alertasAnuncioDAO.selectAnunciosByIdAlerta(Number(idAlerta))

            if (result && result.length > 0) {
                let anuncios = []

                for (let registro of result) {
                    let resultAnuncio = await controlerAnuncio.buscarAnuncio(registro.id_anuncio)

                    if (resultAnuncio.status) {
                        anuncios.push(resultAnuncio.response.anuncio)
                    }
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.anuncio = anuncios

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

const excluirAnunciosIdAlerta = async function (idAlerta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await alertasAnuncioDAO.deleteAnunciosByIdAlerta(idAlerta)

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

// ---------------- Funções usadas pelo controller de alertas ----------------

// Valida a lista "anuncio" enviada no alerta. Retorna false se está correta, ou o ERROR_BAD_REQUEST.
// Cada anúncio é conferido no controller de anúncio (evita erro de chave estrangeira).
const validarListaAnuncios = async function (anuncios) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(anuncios)) {
        message.ERROR_BAD_REQUEST.field = '[ANUNCIO] INVÁLIDO (envie uma lista, ex: [{ "id": 1 }])'
        return message.ERROR_BAD_REQUEST
    }

    for (let item of anuncios) {
        if (item == null || !idValido(item.id)) {
            message.ERROR_BAD_REQUEST.field = '[ANUNCIO] cada item precisa de um id válido, ex: { "id": 1 }'
            return message.ERROR_BAD_REQUEST
        }

        let resultAnuncio = await controlerAnuncio.buscarAnuncio(Number(item.id))

        if (!resultAnuncio.status) {
            message.ERROR_BAD_REQUEST.field = '[ANUNCIO] id ' + item.id + ' não encontrado'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

// Remove ids de anúncio repetidos da lista
const normalizarListaAnuncios = function (anuncios) {
    let ids = [...new Set(anuncios.map(item => Number(item.id)))]

    return ids.map(idAnuncio => ({ id: idAnuncio }))
}

// Grava os vínculos do alerta com cada anúncio da lista (true se todos gravaram)
const inserirAnunciosDoAlerta = async function (idAlerta, anuncios) {
    for (let anuncio of anuncios) {
        let resultRelacao = await inserirNovoAlertaAnuncio({
            id_alertas: idAlerta,
            id_anuncio: anuncio.id
        })

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

// Apaga os vínculos antigos e grava a lista nova (usado no PUT do alerta)
const substituirAnunciosDoAlerta = async function (idAlerta, anuncios) {
    let resultDelete = await excluirAnunciosIdAlerta(idAlerta)

    if (!resultDelete.status) {
        return false
    }

    return await inserirAnunciosDoAlerta(idAlerta, anuncios)
}

// Busca os anúncios do alerta e anexa no objeto (alerta.anuncio)
const anexarAnunciosAoAlerta = async function (alerta) {
    let resultAnuncios = await buscarAnunciosIdAlerta(alerta.id)

    alerta.anuncio = resultAnuncios.status ? resultAnuncios.response.anuncio : []

    return alerta
}

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(relacao.id_alertas)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ALERTAS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoAlertaAnuncio,
    buscarAnunciosIdAlerta,
    excluirAnunciosIdAlerta,
    validarListaAnuncios,
    normalizarListaAnuncios,
    inserirAnunciosDoAlerta,
    substituirAnunciosDoAlerta,
    anexarAnunciosAoAlerta
}