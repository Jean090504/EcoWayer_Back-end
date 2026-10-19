/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de denúncia
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const denunciaDAO = require('../../model/DAO/denuncia/denuncia.js')

// Controllers que já existem e fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerUsuario = require('../usuario/usuario_controler.js')                // buscarUsuario (o denunciante é o usuário)
const controlerTipoDenuncia = require('../tipo_denuncia/tipo_denuncia_controler.js') // buscarTipoDenuncia

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem o mesmo tipo e o mesmo usuário.
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

// Troca os id_... pelos objetos relacionados
const montarDenuncia = async function (denuncia, cache = {}) {
    let denunciante = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, denuncia.id_denunciante)

    // Do denunciante só vão o id e o nome (CPF e demais dados não entram na denúncia)
    denuncia.denunciante = denunciante ? { id: denunciante.id, nome: denunciante.nome } : null
    denuncia.tipo_denuncia = await buscarComCache(cache, 'tipo_denuncia', controlerTipoDenuncia.buscarTipoDenuncia, denuncia.id_tipo_denuncias)

    delete denuncia.id_denunciante
    delete denuncia.id_tipo_denuncias

    return denuncia
}

const inserirNovaDenuncia = async function (denuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(denuncia)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(denuncia)

                let idInserido = await denunciaDAO.insertDenuncia(denuncia)

                if (idInserido) {
                    let criada = await denunciaDAO.selectByIdDenuncia(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarDenuncia(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, descricao: denuncia.descricao }
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

const atualizarDenuncia = async function (denuncia, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarDenuncia(id)

            if (resultID.status) {
                let validar = await validarDados(denuncia)

                if (!validar) {
                    normalizarDados(denuncia)
                    denuncia.id = Number(id)

                    let result = await denunciaDAO.updateDenuncia(denuncia)

                    if (result) {
                        let atualizada = await denunciaDAO.selectByIdDenuncia(denuncia.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarDenuncia(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: denuncia.id, descricao: denuncia.descricao }
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

const listarDenuncia = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await denunciaDAO.selectAllDenuncia()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let denuncia of result) {
                    await montarDenuncia(denuncia, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.denuncia = result

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

const buscarDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await denunciaDAO.selectByIdDenuncia(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.denuncia = await montarDenuncia(result[0])

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

const excluirDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarDenuncia(id)

        if (resultBuscarID.status) {
            let result = await denunciaDAO.deleteDenuncia(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: esta denúncia está sendo usada por outros registros.'

                return message.DEFAULT_MESSAGE // 409
            } else if (result) {
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
const normalizarDados = function (denuncia) {
    denuncia.descricao = String(denuncia.descricao).trim()
    denuncia.id_tipo_denuncias = Number(denuncia.id_tipo_denuncias)
    denuncia.id_denunciante = Number(denuncia.id_denunciante)
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (denuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (denuncia.descricao == undefined || denuncia.descricao == null || String(denuncia.descricao).trim() == '') {
        message.ERROR_BAD_REQUEST.field = "[DESCRICAO] INVÁLIDA (obrigatória)"
        return message.ERROR_BAD_REQUEST

    } else if (Buffer.byteLength(String(denuncia.descricao), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = "[DESCRICAO] INVÁLIDA (limite de 65535 bytes ultrapassado)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(denuncia.id_tipo_denuncias)) {
        message.ERROR_BAD_REQUEST.field = "[ID_TIPO_DENUNCIAS] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(denuncia.id_denunciante)) {
        message.ERROR_BAD_REQUEST.field = "[ID_DENUNCIANTE] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o tipo de denúncia e o denunciante (usuário) existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerTipoDenuncia.buscarTipoDenuncia, denuncia.id_tipo_denuncias)) {
            message.ERROR_BAD_REQUEST.field = "[ID_TIPO_DENUNCIAS] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, denuncia.id_denunciante)) {
            message.ERROR_BAD_REQUEST.field = "[ID_DENUNCIANTE] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovaDenuncia,
    atualizarDenuncia,
    listarDenuncia,
    buscarDenuncia,
    excluirDenuncia,
    validarDados
}