/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_regra_pontuacao (bônus e status por categoria)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const regraDAO = require('../../model/DAO/regra_pontuacao/regra_pontuacao.js')

const STATUS_VALIDOS = ['ativo', 'inativo']

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

const percentualValido = (valor) => {
    if (vazio(valor)) return true
    let numero = Number(valor)
    return !isNaN(numero) && numero >= 0 && numero <= 100
}

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (regra, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(regra.id_categoria)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let categoria = await regraDAO.selectCategoriaExiste(Number(regra.id_categoria))
    if (categoria === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (categoria.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let existe = await regraDAO.selectRegraPorCategoria(Number(regra.id_categoria), idIgnorar)
    if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (existe.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (esta categoria já possui regra de pontuação)',
            field: '[ID_CATEGORIA] JÁ POSSUI REGRA'
        }
    }

    return false
}

const validarDados = function (regra) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!regra || typeof regra !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let status = typeof regra.status === 'string' ? regra.status.trim() : ''

    if (!percentualValido(regra.bonus_campanha_percentual)) {
        message.ERROR_BAD_REQUEST.field = '[BONUS_CAMPANHA_PERCENTUAL] INVÁLIDO (número entre 0 e 100)'
        return message.ERROR_BAD_REQUEST
    } else if (regra.bonus_campanha_ativo !== 0 && regra.bonus_campanha_ativo !== 1 && regra.bonus_campanha_ativo !== true && regra.bonus_campanha_ativo !== false) {
        message.ERROR_BAD_REQUEST.field = '[BONUS_CAMPANHA_ATIVO] INVÁLIDO (use 0, 1, true ou false)'
        return message.ERROR_BAD_REQUEST
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo ou inativo)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (regra) {
    return {
        id_categoria: Number(regra.id_categoria),
        bonus_campanha_percentual: vazio(regra.bonus_campanha_percentual) ? 0 : Number(regra.bonus_campanha_percentual),
        bonus_campanha_ativo: (regra.bonus_campanha_ativo === true || regra.bonus_campanha_ativo === 1) ? 1 : 0,
        status: regra.status.trim()
    }
}

const inserirNovaRegraPontuacao = async function (regra, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(regra)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(regra)
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(regra)
        let id = await regraDAO.insertRegraPontuacao(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { regra_pontuacao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarRegraPontuacao = async function (id, regra, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await regraDAO.selectRegraPontuacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(regra)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(regra, Number(id))
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(regra)
        dados.id = Number(id)

        let result = await regraDAO.updateRegraPontuacao(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { regra_pontuacao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarRegrasPontuacao = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await regraDAO.selectAllRegrasPontuacao()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.regra_pontuacao = result

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

const buscarRegraPontuacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await regraDAO.selectRegraPontuacaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.regra_pontuacao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirRegraPontuacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await regraDAO.selectRegraPontuacaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await regraDAO.countDependenciasRegra(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] REGRA EM USO (multiplicadores ou pontos vinculados)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await regraDAO.deleteRegraPontuacao(Number(id))

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
    inserirNovaRegraPontuacao,
    atualizarRegraPontuacao,
    listarRegrasPontuacao,
    buscarRegraPontuacao,
    excluirRegraPontuacao
}