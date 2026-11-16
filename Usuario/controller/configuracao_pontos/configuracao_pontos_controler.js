/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_configuracao_pontos (taxa global de conversão de pontos)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const configDAO = require('../../model/DAO/configuracao_pontos/configuracao_pontos.js')

const STATUS_VALIDOS = ['ativo', 'inativo']

// taxa DECIMAL(5,2): maior que zero e no máximo 999.99
const taxaValida = (valor) => {
    if (typeof valor !== 'number' && typeof valor !== 'string') return false
    let texto = String(valor).trim()
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) return false
    let numero = Number(texto)
    return numero > 0 && numero <= 999.99
}

const listarConfiguracaoPontos = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await configDAO.selectConfiguracaoPontos()

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let config = result[0]
        config.taxa_conversao = Number(config.taxa_conversao)

        message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
        message.DEFAULT_MESSAGE.response.configuracao_pontos = config

        return message.DEFAULT_MESSAGE // 200
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Não há POST nem DELETE: a linha id = 1 é a configuração global, criada pelo banco
const atualizarConfiguracaoPontos = async function (corpo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!corpo || typeof corpo !== 'object') {
            message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        if (!taxaValida(corpo.taxa_conversao)) {
            message.ERROR_BAD_REQUEST.field = '[TAXA_CONVERSAO] INVÁLIDA (maior que 0, até 999.99, com até 2 casas)'
            return message.ERROR_BAD_REQUEST // 400
        }

        if (!STATUS_VALIDOS.includes(corpo.status)) {
            message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo ou inativo)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let dados = { taxa_conversao: Number(corpo.taxa_conversao), status: corpo.status }

        let result = await configDAO.updateConfiguracaoPontos(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { configuracao_pontos: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    listarConfiguracaoPontos,
    atualizarConfiguracaoPontos
}