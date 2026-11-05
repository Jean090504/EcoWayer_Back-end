/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de alertas
 *  Local: controller/alertas/alertas_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const alertasDAO = require('../../model/DAO/alertas/alertas.js')

const controlerUsuario = require('../usuario/usuario_controler.js') // buscarUsuario
const controlerIa = require('../ia/ia_controler.js') // buscarIa
const controlerAlertasAnuncio = require('./alertas_anuncio_controler.js') // NOVO: relação alerta <-> anúncio


// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem a mesma IA / o mesmo usuário.
// O cache evita consultar o mesmo registro várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca id_ia e id_usuario pelos objetos correspondentes e anexa a lista de anúncios
const montarAlerta = async function (alerta, cache = {}) {
    alerta.ia = await buscarComCache(cache, 'ia', controlerIa.buscarIA, alerta.id_ia)
    alerta.usuario = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, alerta.id_usuario)

    delete alerta.id_ia
    delete alerta.id_usuario

    // NOVO: alerta.anuncio = [ {...}, {...} ] (lista vazia se o alerta não tem anúncio)
    await controlerAlertasAnuncio.anexarAnunciosAoAlerta(alerta)

    return alerta
}

const inserirNovoAlerta = async function (alerta, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(alerta, true)

            if (validar) {
                return validar // 400
            } else {
                // NOVO: "anuncio" é opcional. Se vier, valida e remove ids repetidos
                let anuncios = []

                if (alerta.anuncio !== undefined) {
                    let validarAnuncios = await controlerAlertasAnuncio.validarListaAnuncios(alerta.anuncio)

                    if (validarAnuncios) {
                        return validarAnuncios // 400
                    }

                    anuncios = controlerAlertasAnuncio.normalizarListaAnuncios(alerta.anuncio)
                }

                // O DAO do alerta não deve receber o campo "anuncio"
                delete alerta.anuncio

                normalizarDados(alerta)

                let idInserido = await alertasDAO.insertAlerta(alerta)

                if (idInserido) {
                    // NOVO: grava os vínculos com os anúncios
                    if (anuncios.length > 0) {
                        let gravou = await controlerAlertasAnuncio.inserirAnunciosDoAlerta(idInserido, anuncios)

                        if (!gravou) {
                            // desfaz o que foi gravado para não deixar alerta sem os anúncios
                            await controlerAlertasAnuncio.excluirAnunciosIdAlerta(idInserido)
                            await alertasDAO.deleteAlerta(idInserido)

                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
                    }

                    let criado = await alertasDAO.selectByIdAlerta(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarAlerta(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = {
                            id: idInserido,
                            motivo: alerta.motivo,
                            status: alerta.status,
                            acao: alerta.acao,
                            id_ia: alerta.id_ia,
                            id_usuario: alerta.id_usuario,
                            anuncio: anuncios
                        }
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

const atualizarAlerta = async function (alerta, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarAlerta(id)

            if (resultID.status) {
                // No update só motivo, status, acao (e a lista de anúncios) são alterados
                let validar = await validarDados(alerta, false)

                if (!validar) {
                    // NOVO: se "anuncio" não vier no body, os vínculos atuais são mantidos
                    let anuncios = null

                    if (alerta.anuncio !== undefined) {
                        let validarAnuncios = await controlerAlertasAnuncio.validarListaAnuncios(alerta.anuncio)

                        if (validarAnuncios) {
                            return validarAnuncios // 400
                        }

                        anuncios = controlerAlertasAnuncio.normalizarListaAnuncios(alerta.anuncio)
                    }

                    delete alerta.anuncio

                    normalizarDados(alerta)
                    alerta.id = Number(id)

                    let result = await alertasDAO.updateAlerta(alerta)

                    if (result) {
                        // NOVO: troca os vínculos antigos pela lista nova
                        if (anuncios !== null) {
                            let gravou = await controlerAlertasAnuncio.substituirAnunciosDoAlerta(alerta.id, anuncios)

                            if (!gravou) {
                                return message.ERROR_INTERNAL_SEVER_MODEL // 500
                            }
                        }

                        let atualizado = await alertasDAO.selectByIdAlerta(alerta.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarAlerta(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = {
                                id: alerta.id,
                                motivo: alerta.motivo,
                                status: alerta.status,
                                acao: alerta.acao
                            }
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

const listarAlertas = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await alertasDAO.selectAllAlertas()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                for (let alerta of result) {
                    await montarAlerta(alerta, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.alertas = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarAlerta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await alertasDAO.selectByIdAlerta(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.alerta = await montarAlerta(result[0])

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
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

const excluirAlerta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarAlerta(id)

        if (resultBuscarID.status) {
            // NOVO: remove primeiro os vínculos (filha) para não dar erro de chave estrangeira.
            // O resultado é ignorado de propósito: se o alerta não tinha anúncio, não há o que apagar.
            // Se der erro real, o deleteAlerta abaixo falha e cai no 500.
            await controlerAlertasAnuncio.excluirAnunciosIdAlerta(Number(id))

            let result = await alertasDAO.deleteAlerta(id)

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
const normalizarDados = function (alerta) {
    alerta.motivo = String(alerta.motivo).trim()
    alerta.status = String(alerta.status).trim()
    alerta.acao = String(alerta.acao).trim()

    // id_ia e id_usuario só existem no cadastro (no update não são enviados)
    if (alerta.id_ia !== undefined) {
        alerta.id_ia = Number(alerta.id_ia)
    }

    if (alerta.id_usuario !== undefined) {
        alerta.id_usuario = Number(alerta.id_usuario)
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const textoInvalido = function (valor, tamanhoMaximo) {
    return typeof valor !== 'string' || valor.trim() === '' || valor.trim().length > tamanhoMaximo
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// verificarRelacionamentos = true  -> cadastro (valida id_ia e id_usuario)
// verificarRelacionamentos = false -> atualização (só motivo, status e acao)
// AJUSTE os tamanhos máximos conforme os VARCHAR da tabela tbl_alertas.
const validarDados = async function (alerta, verificarRelacionamentos = true) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (textoInvalido(alerta.motivo, 255)) {
        message.ERROR_BAD_REQUEST.field = '[MOTIVO] INVÁLIDO (obrigatório, máximo 255 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(alerta.status, 45)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (obrigatório, máximo 45 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (textoInvalido(alerta.acao, 255)) {
        message.ERROR_BAD_REQUEST.field = '[ACAO] INVÁLIDA (obrigatória, máximo 255 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (verificarRelacionamentos) {
        if (idInvalido(alerta.id_ia)) {
            message.ERROR_BAD_REQUEST.field = '[ID_IA] INVÁLIDO (obrigatório, número)'
            return message.ERROR_BAD_REQUEST

        } else if (idInvalido(alerta.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
            return message.ERROR_BAD_REQUEST
        }

        // Confere se a IA e o usuário existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerIa.buscarIA, alerta.id_ia)) {
            message.ERROR_BAD_REQUEST.field = '[ID_IA] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, alerta.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

module.exports = {
    inserirNovoAlerta,
    atualizarAlerta,
    listarAlertas,
    buscarAlerta,
    excluirAlerta,
    validarDados
}