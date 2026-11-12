/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de conversa
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const conversaDAO = require('../../model/DAO/conversa/conversa.js')

// Abre a conversa de um interessado (id_usuario) sobre um anúncio (id_anuncio).
// A conversa não tem campo editável, por isso não existe atualizarConversa (sem PUT).
const inserirNovaConversa = async function (conversa, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(conversa)

            if (validar) {
                return validar // 400
            } else {
                let dados = {
                    id_anuncio: Number(conversa.id_anuncio),
                    id_usuario: Number(conversa.id_usuario)
                }

                // regras do anúncio: existe, está ativo e não é do próprio interessado
                let anuncio = await conversaDAO.selectAnuncioParaConversa(dados.id_anuncio)

                if (anuncio === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (anuncio.length == 0) {
                    message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] NÃO ENCONTRADO'
                    return message.ERROR_BAD_REQUEST
                } else if (anuncio[0].status != 'ativo') {
                    message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] ANÚNCIO NÃO ESTÁ ATIVO'
                    return message.ERROR_BAD_REQUEST
                } else if (anuncio[0].id_usuario == dados.id_usuario) {
                    message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO PODE INICIAR CONVERSA NO PRÓPRIO ANÚNCIO'
                    return message.ERROR_BAD_REQUEST
                }

                let usuarioExiste = await conversaDAO.selectExisteUsuario(dados.id_usuario)

                if (usuarioExiste === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (usuarioExiste == 0) {
                    message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO ENCONTRADO'
                    return message.ERROR_BAD_REQUEST
                }

                // uma conversa por interessado em cada anúncio
                let existente = await conversaDAO.selectConversaExistente(dados.id_anuncio, dados.id_usuario)

                if (existente === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (existente.length > 0) {
                    // usa o 409 se o ERROR_CONFLICT existir no configMessages; senão, cai no 400
                    let erro = message.ERROR_CONFLICT ? message.ERROR_CONFLICT : message.ERROR_BAD_REQUEST
                    erro.field = '[CONVERSA] JÁ EXISTE PARA ESTE ANÚNCIO (id ' + existente[0].id + ')'
                    return erro
                }

                let result = await conversaDAO.insertConversa(dados)

                if (result) { // 201
                    let inserida = await buscarConversa(result)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        conversa: inserida.status ? inserida.response.conversa : { id: result, ...dados }
                    }

                    return message.DEFAULT_MESSAGE
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

// idUsuario é opcional (vem de ?id_usuario= na rota): lista só as conversas desse usuário,
// com a quantidade de mensagens não lidas (tela "Mensagens" do app).
const listarConversa = async function (idUsuario) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let filtro = null

        if (idUsuario !== undefined && idUsuario !== null && idUsuario !== '') {
            if (isNaN(idUsuario) || !Number.isInteger(Number(idUsuario)) || Number(idUsuario) < 1) {
                message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] Inválido'
                return message.ERROR_BAD_REQUEST // 400
            }

            filtro = Number(idUsuario)
        }

        let result = await conversaDAO.selectAllConversa(filtro)

        if (result) {
            if (result.length > 0) {
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
                    message.DEFAULT_MESSAGE.response.conversa = result[0]

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirConversa = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarConversa(id)

        if (resultBuscarID.status) {
            let emUso = await conversaDAO.selectConversaEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] CONVERSA EM USO (possui mensagens ou propostas)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await conversaDAO.deleteConversa(id)

                if (result) {
                    return message.SUCCESS_DELETED_ITEM // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscarID // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const ehIdValido = function (valor) {
    return !(valor === undefined || valor === null || valor === '' || isNaN(valor) || !Number.isInteger(Number(valor)) || Number(valor) < 1)
}

const validarDados = async function (conversa) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!ehIdValido(conversa.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = "[ID_ANUNCIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!ehIdValido(conversa.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        return false
    }
}

module.exports = {
    inserirNovaConversa,
    listarConversa,
    buscarConversa,
    excluirConversa,
    validarDados
}