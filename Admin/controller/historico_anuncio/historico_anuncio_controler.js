/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de histórico do anúncio
 *  Local: controller/historico_anuncio/historico_anuncio_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const historicoAnuncioDAO = require('../../model/DAO/historico_anuncio/historico_anuncio.js')

// Controller que já existe e fornece os dados da chave estrangeira.
// CONFIRME o caminho e o nome da função exportada (module.exports).
const controlerAnuncio = require('../anuncio/anuncio_controler.js') // buscarAnuncio

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_historico_anuncio LIKE 'status';)
const STATUS_VALIDOS = ['pendente', 'aprovado', 'rejeitado']

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem o mesmo anúncio.
// O cache evita consultar o mesmo anúncio várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca o id_anuncio pelo objeto do anúncio (já com as chaves estrangeiras dele)
const montarHistorico = async function (historico, cache = {}) {
    historico.anuncio = await buscarComCache(cache, 'anuncio', controlerAnuncio.buscarAnuncio, historico.id_anuncio)

    delete historico.id_anuncio

    return historico
}

const inserirNovoHistoricoAnuncio = async function (historico, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(historico, true)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(historico)

                let idInserido = await historicoAnuncioDAO.insertHistoricoAnuncio(historico)

                if (idInserido) {
                    let criado = await historicoAnuncioDAO.selectByIdHistoricoAnuncio(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarHistorico(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: historico.status }
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

const atualizarHistoricoAnuncio = async function (historico, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarHistoricoAnuncio(id)

            if (resultID.status) {
                let validar = await validarDados(historico, false)

                if (!validar) {
                    normalizarDados(historico)
                    historico.id = Number(id)

                    let result = await historicoAnuncioDAO.updateHistoricoAnuncio(historico)

                    if (result) {
                        let atualizado = await historicoAnuncioDAO.selectByIdHistoricoAnuncio(historico.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarHistorico(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: historico.id, status: historico.status }
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

const listarHistoricoAnuncio = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await historicoAnuncioDAO.selectAllHistoricoAnuncio()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let historico of result) {
                    await montarHistorico(historico, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.historico_anuncio = result

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

const buscarHistoricoAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await historicoAnuncioDAO.selectByIdHistoricoAnuncio(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.historico_anuncio = await montarHistorico(result[0])

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

const excluirHistoricoAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarHistoricoAnuncio(id)

        if (resultBuscarID.status) {
            let result = await historicoAnuncioDAO.deleteHistoricoAnuncio(id)

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

// Padroniza os dados antes de gravar (detalhes é opcional: vazio vira null)
const normalizarDados = function (historico) {
    historico.status = String(historico.status)
    historico.detalhes = (historico.detalhes == undefined || historico.detalhes == null || String(historico.detalhes).trim() == '')
        ? null
        : String(historico.detalhes).trim()

    if (historico.id_anuncio !== undefined) {
        historico.id_anuncio = Number(historico.id_anuncio)
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// "inserir" = true exige id_anuncio; na atualização o anúncio do registro não é alterado.
const validarDados = async function (historico, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (historico.status == undefined || historico.status == null || !STATUS_VALIDOS.includes(String(historico.status))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (valores aceitos: ' + STATUS_VALIDOS.join(', ') + ')'
        return message.ERROR_BAD_REQUEST

    } else if (historico.detalhes != undefined && historico.detalhes != null && Buffer.byteLength(String(historico.detalhes), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DETALHES] INVÁLIDO (limite de 65535 bytes ultrapassado)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(historico.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o anúncio existe (evita erro de chave estrangeira)
        if (inserir && !await buscarRelacionado(controlerAnuncio.buscarAnuncio, historico.id_anuncio)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoHistoricoAnuncio,
    atualizarHistoricoAnuncio,
    listarHistoricoAnuncio,
    buscarHistoricoAnuncio,
    excluirHistoricoAnuncio,
    validarDados
}