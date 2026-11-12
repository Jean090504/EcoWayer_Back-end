/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de mensagens
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const mensagensDAO = require('../../model/DAO/mensagens/mensagens.js')

const inserirNovaMensagem = async function (mensagem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(mensagem)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = {
                    texto: String(mensagem.texto).trim(),
                    id_conversa: Number(mensagem.id_conversa),
                    id_remetente: Number(mensagem.id_remetente)
                }

                let result = await mensagensDAO.insertMensagem(dados)

                if (result) { // 201
                    // busca a mensagem gravada para devolver também a data de envio e o nome do remetente
                    let inserida = await buscarMensagem(result)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        mensagem: inserida.status ? inserida.response.mensagem : { id: result, ...dados, lida: 0 }
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

// A mensagem enviada não é editada: o PUT só marca como lida (ou não lida). Corpo: { "lida": true }
const atualizarMensagem = async function (mensagem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarMensagem(id)

            if (resultID.status) {
                let valoresAceitos = [true, false, 1, 0, '1', '0', 'true', 'false']

                if (mensagem.lida === undefined || !valoresAceitos.includes(mensagem.lida)) {
                    message.ERROR_BAD_REQUEST.field = '[LIDA] INVÁLIDA (true/false ou 1/0)'
                    return message.ERROR_BAD_REQUEST // 400
                }

                let lida = (mensagem.lida === true || mensagem.lida === 1 || mensagem.lida === '1' || mensagem.lida === 'true') ? 1 : 0

                let result = await mensagensDAO.updateLidaMensagem({ id: Number(id), lida: lida })

                if (result) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                    message.DEFAULT_MESSAGE.response = { id: Number(id), lida: lida }

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
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

// idConversa vem de ?id_conversa= na rota e é obrigatório: listar as mensagens de todas as conversas
// juntas expõe conversa alheia.
const listarMensagem = async function (idConversa) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehIdValido(idConversa)) {
            message.ERROR_BAD_REQUEST.field = '[ID_CONVERSA] OBRIGATÓRIO E VÁLIDO (use ?id_conversa=1)'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await mensagensDAO.selectAllMensagemByConversa(Number(idConversa))

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.count = result.length
                    message.DEFAULT_MESSAGE.response.mensagem = result

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404 (conversa sem mensagens)
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarMensagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await mensagensDAO.selectByIdMensagem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.mensagem = result[0]

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

const excluirMensagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarMensagem(id)

        if (resultBuscarID.status) {
            let emUso = await mensagensDAO.selectMensagemEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] MENSAGEM EM USO (citada em denúncia ou alerta)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await mensagensDAO.deleteMensagem(id)

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

const validarDados = async function (mensagem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (mensagem.texto == undefined || mensagem.texto == null || String(mensagem.texto).trim() == '' || String(mensagem.texto).trim().length > 2000) {
        message.ERROR_BAD_REQUEST.field = "[TEXTO] INVÁLIDO (1 a 2000 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (!ehIdValido(mensagem.id_conversa)) {
        message.ERROR_BAD_REQUEST.field = "[ID_CONVERSA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!ehIdValido(mensagem.id_remetente)) {
        message.ERROR_BAD_REQUEST.field = "[ID_REMETENTE] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // a conversa existe e o remetente é uma das duas pessoas dela (interessado ou anunciante)
        let participantes = await mensagensDAO.selectParticipantesConversa(Number(mensagem.id_conversa))

        if (participantes === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (participantes.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_CONVERSA] NÃO ENCONTRADA"
            return message.ERROR_BAD_REQUEST
        } else if (participantes[0].id_interessado != Number(mensagem.id_remetente) && participantes[0].id_anunciante != Number(mensagem.id_remetente)) {
            message.ERROR_BAD_REQUEST.field = "[ID_REMETENTE] NÃO PARTICIPA DESTA CONVERSA"
            return message.ERROR_BAD_REQUEST
        } else {
            return false
        }
    }
}

module.exports = {
    inserirNovaMensagem,
    atualizarMensagem,
    listarMensagem,
    buscarMensagem,
    excluirMensagem,
    validarDados
}