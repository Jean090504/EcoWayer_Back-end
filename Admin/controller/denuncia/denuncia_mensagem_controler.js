/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Denúncia e Mensagens (usado só pelo controller da denúncia)
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const denunciaMensagemDAO = require('../../model/DAO/denuncia_mensagem/denuncia_mensagem.js')

const inserirNovaDenunciaMensagem = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await denunciaMensagemDAO.insertDenunciaMensagem(relacao)

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

const buscarMensagensIdDenuncia = async function (idDenuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (idDenuncia == undefined || idDenuncia == '' || idDenuncia == null || isNaN(idDenuncia)) {
            message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIA] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await denunciaMensagemDAO.selectMensagensByIdDenuncia(idDenuncia)

            if (result && result.length > 0) {
                // Monta o formato da resposta: remetente sem expor id_remetente, lida como true/false
                let mensagens = result.map(function (item) {
                    return {
                        id: item.id,
                        texto: item.texto,
                        envio: item.envio,
                        lida: Boolean(item.lida),
                        remetente: { id: item.remetente_id, nome: item.remetente_nome }
                    }
                })

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.mensagem = mensagens

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirMensagensIdDenuncia = async function (idDenuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await denunciaMensagemDAO.deleteMensagensByIdDenuncia(idDenuncia)

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

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (relacao.id_denuncias == undefined || relacao.id_denuncias == null || relacao.id_denuncias == '' || isNaN(relacao.id_denuncias)) {
        message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIAS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (relacao.id_mensagens == undefined || relacao.id_mensagens == null || relacao.id_mensagens == '' || isNaN(relacao.id_mensagens)) {
        message.ERROR_BAD_REQUEST.field = '[ID_MENSAGENS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovaDenunciaMensagem,
    buscarMensagensIdDenuncia,
    excluirMensagensIdDenuncia
}