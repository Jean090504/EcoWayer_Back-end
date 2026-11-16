/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_regra_pontuacao_condicao (multiplicador por condição do item)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const condicaoDAO = require('../../model/DAO/regra_pontuacao_condicao/regra_pontuacao_condicao.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// multiplicador DECIMAL(4,2): até 2 casas, maior que 0 e no máximo 99.99
const multiplicadorValido = (valor) => {
    if (typeof valor !== 'number' && typeof valor !== 'string') return false
    let texto = String(valor).trim()
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) return false
    let numero = Number(texto)
    return numero > 0 && numero <= 99.99
}

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (vinculo, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(vinculo.id_regra_pontuacao)) {
        message.ERROR_BAD_REQUEST.field = '[ID_REGRA_PONTUACAO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let regra = await condicaoDAO.selectExiste('tbl_regra_pontuacao', Number(vinculo.id_regra_pontuacao))
    if (regra === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (regra.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_REGRA_PONTUACAO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(vinculo.id_condicao_item)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONDICAO_ITEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let condicao = await condicaoDAO.selectExiste('tbl_condicao_item', Number(vinculo.id_condicao_item))
    if (condicao === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (condicao.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONDICAO_ITEM] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let par = await condicaoDAO.selectParRegraCondicao(Number(vinculo.id_regra_pontuacao), Number(vinculo.id_condicao_item), idIgnorar)
    if (par === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (par.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (esta condição já possui multiplicador nesta regra)',
            field: '[PAR] VÍNCULO JÁ EXISTE'
        }
    }

    return false
}

const validarDados = function (vinculo) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!vinculo || typeof vinculo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (!multiplicadorValido(vinculo.multiplicador)) {
        message.ERROR_BAD_REQUEST.field = '[MULTIPLICADOR] INVÁLIDO (maior que 0, até 99.99, com até 2 casas)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (vinculo) {
    return {
        id_regra_pontuacao: Number(vinculo.id_regra_pontuacao),
        id_condicao_item: Number(vinculo.id_condicao_item),
        multiplicador: Number(vinculo.multiplicador)
    }
}

const inserirNovaRegraCondicao = async function (vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(vinculo)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(vinculo)
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(vinculo)
        let id = await condicaoDAO.insertRegraCondicao(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { regra_pontuacao_condicao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarRegraCondicao = async function (id, vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await condicaoDAO.selectRegraCondicaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(vinculo)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(vinculo, Number(id))
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(vinculo)
        dados.id = Number(id)

        let result = await condicaoDAO.updateRegraCondicao(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { regra_pontuacao_condicao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarRegraCondicoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await condicaoDAO.selectAllRegraCondicoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.regra_pontuacao_condicao = result

            return message.DEFAULT_MESSAGE // 200
        } else if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarRegraCondicao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await condicaoDAO.selectRegraCondicaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.regra_pontuacao_condicao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirRegraCondicao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await condicaoDAO.selectRegraCondicaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await condicaoDAO.deleteRegraCondicao(Number(id))

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: Number(id) }

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    inserirNovaRegraCondicao,
    atualizarRegraCondicao,
    listarRegraCondicoes,
    buscarRegraCondicao,
    excluirRegraCondicao
}