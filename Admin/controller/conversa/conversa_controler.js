/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de conversa
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const conversaDAO = require('../../model/DAO/conversa/conversa.js')

// Controllers que fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerUsuario = require('../usuario/usuario_controler.js')   // buscarUsuario
const controlerAnuncio = require('../anuncio/anuncio_controler.js')   // buscarAnuncio

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Troca os id_... pelos objetos relacionados
const montarConversa = async function (conversa) {
    let usuario = await buscarRelacionado(controlerUsuario.buscarUsuario, conversa.id_usuario)

    // Do usuário só vão o id e o nome (CPF e demais dados não entram na conversa)
    conversa.usuario = usuario ? { id: usuario.id, nome: usuario.nome } : null
    conversa.anuncio = await buscarRelacionado(controlerAnuncio.buscarAnuncio, conversa.id_anuncio)

    delete conversa.id_usuario
    delete conversa.id_anuncio

    return conversa
}

const respostaConversaDuplicada = function (message) {
    message.DEFAULT_MESSAGE.status = false
    message.DEFAULT_MESSAGE.status_code = 409
    message.DEFAULT_MESSAGE.message = 'Já existe uma conversa deste usuário para este anúncio.'

    return message.DEFAULT_MESSAGE // 409
}

const inserirNovaConversa = async function (conversa, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(conversa)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(conversa)

                let idInserido = await conversaDAO.insertConversa(conversa)

                if (idInserido === 'DUPLICADA') {
                    return respostaConversaDuplicada(message) // 409
                } else if (idInserido) {
                    let criada = await conversaDAO.selectByIdConversa(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarConversa(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido }
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

const atualizarConversa = async function (conversa, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarConversa(id)

            if (resultID.status) {
                let validar = await validarDados(conversa)

                if (!validar) {
                    normalizarDados(conversa)
                    conversa.id = Number(id)

                    let result = await conversaDAO.updateConversa(conversa)

                    if (result === 'DUPLICADA') {
                        return respostaConversaDuplicada(message) // 409
                    } else if (result) {
                        let atualizada = await conversaDAO.selectByIdConversa(conversa.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarConversa(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: conversa.id }
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

const listarConversa = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await conversaDAO.selectAllConversa()

        if (result) {
            if (result.length > 0) {
                // ids em ordem decrescente (ORDER BY do DAO)
                for (let conversa of result) {
                    await montarConversa(conversa)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.conversa = result

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

const buscarConversa = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await conversaDAO.selectByIdConversa(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.conversa = await montarConversa(result[0])

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

const excluirConversa = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarConversa(id)

        if (resultBuscarID.status) {
            let result = await conversaDAO.deleteConversa(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: esta conversa está sendo usada por outros registros (ex: mensagens).'

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
const normalizarDados = function (conversa) {
    conversa.id_anuncio = Number(conversa.id_anuncio)
    conversa.id_usuario = Number(conversa.id_usuario)
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (conversa) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (idInvalido(conversa.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = "[ID_ANUNCIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(conversa.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o anúncio e o usuário existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerAnuncio.buscarAnuncio, conversa.id_anuncio)) {
            message.ERROR_BAD_REQUEST.field = "[ID_ANUNCIO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, conversa.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovaConversa,
    atualizarConversa,
    listarConversa,
    buscarConversa,
    excluirConversa,
    validarDados
}