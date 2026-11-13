/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de notificação
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const notificacaoDAO = require('../../model/DAO/notificacao/notificacao.js')

// Controller que já existe e fornece os dados da chave estrangeira.
// CONFIRME o caminho e o nome da função exportada (module.exports).
const controlerUsuario = require('../usuario/usuario_controler.js')   // buscarUsuario

// Tipos usados hoje: 'mensagem' e 'proposta' (gravadas pelo chat e pela negociação),
// 'pontos', 'denuncia' e 'sistema'. A coluna é livre (até 45 caracteres), então não há lista fechada.

const inserirNovaNotificacao = async function (notificacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(notificacao)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = {
                    id_usuario: Number(notificacao.id_usuario),
                    tipo: String(notificacao.tipo).trim(),
                    texto: String(notificacao.texto).trim()
                }

                let result = await notificacaoDAO.insertNotificacao(dados)

                if (result) { // 201
                    // busca a notificação gravada para devolver também a data de criação
                    let inserida = await buscarNotificacao(result)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        notificacao: inserida.status ? inserida.response.notificacao : { id: result, ...dados, lida: 0 }
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

// O texto da notificação não é editado: o PUT só marca como lida (ou não lida). Corpo: { "lida": true }
const atualizarNotificacao = async function (notificacao, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarNotificacao(id)

            if (resultID.status) {
                let valoresAceitos = [true, false, 1, 0, '1', '0', 'true', 'false']

                if (notificacao.lida === undefined || !valoresAceitos.includes(notificacao.lida)) {
                    message.ERROR_BAD_REQUEST.field = '[LIDA] INVÁLIDA (true/false ou 1/0)'
                    return message.ERROR_BAD_REQUEST // 400
                }

                let lida = (notificacao.lida === true || notificacao.lida === 1 || notificacao.lida === '1' || notificacao.lida === 'true') ? 1 : 0

                let result = await notificacaoDAO.updateLidaNotificacao({ id: Number(id), lida: lida })

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

// idUsuario vem de ?id_usuario= na rota e é obrigatório (notificação é pessoal).
// naoLidas vem de ?nao_lidas= ('true' traz só as não lidas; 'false' ou vazio traz todas).
const listarNotificacao = async function (idUsuario, naoLidas) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!ehIdValido(idUsuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] OBRIGATÓRIO E VÁLIDO (use ?id_usuario=1)'
            return message.ERROR_BAD_REQUEST // 400
        } else if (naoLidas !== undefined && naoLidas !== '' && naoLidas !== 'true' && naoLidas !== 'false') {
            message.ERROR_BAD_REQUEST.field = '[NAO_LIDAS] INVÁLIDO (true ou false)'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await notificacaoDAO.selectAllNotificacaoByUsuario(Number(idUsuario), naoLidas === 'true')

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.count = result.length
                    message.DEFAULT_MESSAGE.response.nao_lidas = result.filter(item => item.lida == 0).length
                    message.DEFAULT_MESSAGE.response.notificacao = result

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

const buscarNotificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await notificacaoDAO.selectByIdNotificacao(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.notificacao = result[0]

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

const excluirNotificacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarNotificacao(id)

        if (resultBuscarID.status) {
            let result = await notificacaoDAO.deleteNotificacao(id)

            if (result) {
                return message.SUCCESS_DELETED_ITEM // 200
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

const ehIdValido = function (valor) {
    return !(valor === undefined || valor === null || valor === '' || isNaN(valor) || !Number.isInteger(Number(valor)) || Number(valor) < 1)
}

const validarDados = async function (notificacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!ehIdValido(notificacao.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (notificacao.tipo == undefined || notificacao.tipo == null || String(notificacao.tipo).trim() == '' || String(notificacao.tipo).trim().length > 45) {
        message.ERROR_BAD_REQUEST.field = "[TIPO] INVÁLIDO (1 a 45 caracteres, ex.: mensagem, pontos, proposta, denuncia, sistema)"
        return message.ERROR_BAD_REQUEST

    } else if (notificacao.texto == undefined || notificacao.texto == null || String(notificacao.texto).trim() == '' || String(notificacao.texto).trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = "[TEXTO] INVÁLIDO (1 a 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else {
        // o usuário precisa existir: checagem direta na tabela
        let usuario = await notificacaoDAO.selectUsuarioExiste(Number(notificacao.id_usuario))

        if (usuario === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (usuario.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] NÃO ENCONTRADO"
            return message.ERROR_BAD_REQUEST // 400
        }

        return false
    }
}

module.exports = {
    inserirNovaNotificacao,
    atualizarNotificacao,
    listarNotificacao,
    buscarNotificacao,
    excluirNotificacao,
    validarDados
}