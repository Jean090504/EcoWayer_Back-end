/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de alertas
 *  Local: controller/alertas/alertas_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const alertasDAO = require('../../model/DAO/alertas/alertas.js')

// Controllers das tabelas intermediárias (anúncios e denúncias do alerta).
// Eles é que chamam os controllers de anúncio e de denúncia.
const controlerAlertasAnuncio = require('./alertas_anuncio_controler.js')
const controlerAlertasDenuncia = require('./alertas_denuncia_controler.js')

// Controllers que já existem e fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports).
const controlerIA = require('../ia/ia_controler.js')                // buscarIA
const controlerUsuario = require('../usuario/usuario_controler.js') // buscarUsuario

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_alertas LIKE 'status';)
const STATUS_VALIDOS = ['PENDENTE', 'EM_ANALISE', 'RESOLVIDO', 'IGNORADO']

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem a mesma IA / usuário.
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

// Troca id_ia e id_usuario pelos objetos correspondentes e anexa os anúncios e as denúncias do alerta
const montarAlerta = async function (alerta, cache = {}) {
    alerta.ia = await buscarComCache(cache, 'ia', controlerIA.buscarIA, alerta.id_ia)
    alerta.usuario = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, alerta.id_usuario)

    delete alerta.id_ia
    delete alerta.id_usuario

    // Tabela intermediária: o controller dos anúncios do alerta busca e anexa (alerta.anuncio)
    await controlerAlertasAnuncio.anexarAnunciosAoAlerta(alerta)

    // Denúncias: o controller das denúncias do alerta busca e anexa (alerta.denuncia)
    await controlerAlertasDenuncia.anexarDenunciasAoAlerta(alerta)

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
                normalizarDados(alerta)

                let idInserido = await alertasDAO.insertAlerta(alerta)

                if (idInserido) {
                    // Anúncios: o controller da intermediária grava os vínculos (lista opcional)
                    if (Array.isArray(alerta.anuncio)) {
                        let relacionouAnuncios = await controlerAlertasAnuncio.inserirAnunciosDoAlerta(idInserido, alerta.anuncio)

                        if (!relacionouAnuncios) {
                            return message.SUCCESS_CREATED_WARNING // 201 com alerta de dados não inseridos
                        }
                    }

                    // Denúncias: o controller da intermediária grava os vínculos (lista opcional)
                    if (Array.isArray(alerta.denuncia)) {
                        let relacionouDenuncias = await controlerAlertasDenuncia.inserirDenunciasDoAlerta(idInserido, alerta.denuncia)

                        if (!relacionouDenuncias) {
                            return message.SUCCESS_CREATED_WARNING // 201 com alerta de dados não inseridos
                        }
                    }

                    let criado = await alertasDAO.selectByIdAlerta(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarAlerta(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: alerta.status }
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
                let validar = await validarDados(alerta, false)

                if (!validar) {
                    normalizarDados(alerta)
                    alerta.id = Number(id)

                    let result = await alertasDAO.updateAlerta(alerta)

                    if (result) {
                        // Anúncios: só troca se a lista "anuncio" foi enviada (sem a lista, mantém os atuais)
                        if (Array.isArray(alerta.anuncio)) {
                            let trocouAnuncios = await controlerAlertasAnuncio.substituirAnunciosDoAlerta(alerta.id, alerta.anuncio)

                            if (!trocouAnuncios) {
                                return message.ERROR_INTERNAL_SEVER_MODEL // 500
                            }
                        }

                        // Denúncias: só troca se a lista "denuncia" foi enviada (sem a lista, mantém as atuais)
                        if (Array.isArray(alerta.denuncia)) {
                            let trocouDenuncias = await controlerAlertasDenuncia.substituirDenunciasDoAlerta(alerta.id, alerta.denuncia)

                            if (!trocouDenuncias) {
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
                            message.DEFAULT_MESSAGE.response = { id: alerta.id, status: alerta.status }
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
            // Guarda os vínculos atuais: se a exclusão do alerta falhar, eles são devolvidos
            let anunciosAtuais = resultBuscarID.response.alerta.anuncio || []
            let denunciasAtuais = resultBuscarID.response.alerta.denuncia || []

            // Tabelas intermediárias: precisa apagar os vínculos antes (chave estrangeira)
            let resultFilhosAnuncios = await controlerAlertasAnuncio.excluirAnunciosIdAlerta(id)

            if (!resultFilhosAnuncios.status) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }

            // Denúncias: se falhar, devolve os anúncios que acabaram de ser desvinculados
            let resultFilhosDenuncias = await controlerAlertasDenuncia.excluirDenunciasIdAlerta(id)

            if (!resultFilhosDenuncias.status) {
                await controlerAlertasAnuncio.inserirAnunciosDoAlerta(Number(id), anunciosAtuais)

                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }

            let result = await alertasDAO.deleteAlerta(id)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { id: Number(id) }

                return message.DEFAULT_MESSAGE // 200
            } else {
                await controlerAlertasAnuncio.inserirAnunciosDoAlerta(Number(id), anunciosAtuais)
                await controlerAlertasDenuncia.inserirDenunciasDoAlerta(Number(id), denunciasAtuais)

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
    alerta.status = String(alerta.status)
    alerta.acao = String(alerta.acao).trim()

    if (alerta.id_ia !== undefined) {
        alerta.id_ia = Number(alerta.id_ia)
    }

    if (alerta.id_usuario !== undefined) {
        alerta.id_usuario = Number(alerta.id_usuario)
    }

    // Remove ids de anúncio repetidos na lista (se ela foi enviada)
    if (Array.isArray(alerta.anuncio)) {
        alerta.anuncio = controlerAlertasAnuncio.normalizarListaAnuncios(alerta.anuncio)
    }

    // Remove ids de denúncia repetidos na lista (se ela foi enviada)
    if (Array.isArray(alerta.denuncia)) {
        alerta.denuncia = controlerAlertasDenuncia.normalizarListaDenuncias(alerta.denuncia)
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// "inserir" = true exige id_ia e id_usuario; na atualização eles não são alterados.
// "anuncio" e "denuncia" são opcionais: se vierem, quem valida são os controllers das intermediárias.
const validarDados = async function (alerta, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (alerta.motivo == undefined || alerta.motivo == null || String(alerta.motivo).trim() == '' || Buffer.byteLength(String(alerta.motivo), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = '[MOTIVO] INVÁLIDO (obrigatório, até 65535 bytes)'
        return message.ERROR_BAD_REQUEST

    } else if (alerta.status == undefined || alerta.status == null || !STATUS_VALIDOS.includes(String(alerta.status))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (valores aceitos: ' + STATUS_VALIDOS.join(', ') + ')'
        return message.ERROR_BAD_REQUEST

    } else if (alerta.acao == undefined || alerta.acao == null || String(alerta.acao).trim() == '' || String(alerta.acao).trim().length > 100) {
        message.ERROR_BAD_REQUEST.field = '[ACAO] INVÁLIDO (obrigatório, até 100 caracteres)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(alerta.id_ia)) {
        message.ERROR_BAD_REQUEST.field = '[ID_IA] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(alerta.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se IA e usuário existem (evita erro de chave estrangeira)
        if (inserir && !await buscarRelacionado(controlerIA.buscarIA, alerta.id_ia)) {
            message.ERROR_BAD_REQUEST.field = '[ID_IA] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        if (inserir && !await buscarRelacionado(controlerUsuario.buscarUsuario, alerta.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        // Confere a lista de anúncios (opcional)
        if (alerta.anuncio !== undefined) {
            let erroAnuncios = await controlerAlertasAnuncio.validarListaAnuncios(alerta.anuncio)

            if (erroAnuncios) {
                return erroAnuncios
            }
        }

        // Confere a lista de denúncias (opcional)
        if (alerta.denuncia !== undefined) {
            let erroDenuncias = await controlerAlertasDenuncia.validarListaDenuncias(alerta.denuncia)

            if (erroDenuncias) {
                return erroDenuncias
            }
        }

        return false
    }
}

module.exports = {
    inserirNovoAlerta,
    atualizarAlerta,
    listarAlertas,
    buscarAlerta,
    excluirAlerta,
    validarDados
}