/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_pontos (registro de pontos acumulados pelo usuário)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pontosDAO = require('../../model/DAO/pontos/pontos.js')

const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

// Confere os ids obrigatórios e os opcionais (id_entrega e id_regra_pontuacao) nas tabelas de referência.
// Devolve false se OK, ou a resposta de erro pronta (400 ou 500).
const validarReferencias = async function (pontos) {
    let message = JSON.parse(JSON.stringify(configMessages))

    const checagens = [
        ['tbl_usuario', pontos.id_usuario, 'ID_USUARIO', true],
        ['tbl_categoria', pontos.id_categoria, 'ID_CATEGORIA', true],
        ['tbl_entrega', pontos.id_entrega, 'ID_ENTREGA', false],
        ['tbl_regra_pontuacao', pontos.id_regra_pontuacao, 'ID_REGRA_PONTUACAO', false]
    ]

    for (let [tabela, valor, campo, obrigatorio] of checagens) {
        if (vazio(valor)) {
            if (obrigatorio) {
                message.ERROR_BAD_REQUEST.field = `[${campo}] INVÁLIDO`
                return message.ERROR_BAD_REQUEST
            }
            continue
        }

        if (!idValido(valor)) {
            message.ERROR_BAD_REQUEST.field = `[${campo}] INVÁLIDO`
            return message.ERROR_BAD_REQUEST
        }

        let existe = await pontosDAO.selectExiste(tabela, Number(valor))
        if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL

        if (existe.length == 0) {
            message.ERROR_BAD_REQUEST.field = `[${campo}] NÃO EXISTE`
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

const validarDados = function (pontos) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!pontos || typeof pontos !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let qntd = Number(pontos.qntd_pontos)

    if (vazio(pontos.qntd_pontos) || !Number.isInteger(qntd) || qntd <= 0) {
        message.ERROR_BAD_REQUEST.field = '[QNTD_PONTOS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(pontos.data_registro)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_REGISTRO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (pontos) {
    return {
        qntd_pontos: Number(pontos.qntd_pontos),
        data_registro: pontos.data_registro.trim(),
        id_categoria: Number(pontos.id_categoria),
        id_usuario: Number(pontos.id_usuario),
        id_entrega: vazio(pontos.id_entrega) ? null : Number(pontos.id_entrega),
        id_regra_pontuacao: vazio(pontos.id_regra_pontuacao) ? null : Number(pontos.id_regra_pontuacao)
    }
}

const inserirNovoPontos = async function (pontos, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(pontos)
        if (validar) return validar // 400

        let referencias = await validarReferencias(pontos)
        if (referencias) return referencias // 400 ou 500

        let dados = normalizarDados(pontos)
        let id = await pontosDAO.insertPontos(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { pontos: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarPontos = async function (id, pontos, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await pontosDAO.selectPontosById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(pontos)
        if (validar) return validar // 400

        let referencias = await validarReferencias(pontos)
        if (referencias) return referencias // 400 ou 500

        let dados = normalizarDados(pontos)
        dados.id = Number(id)

        let result = await pontosDAO.updatePontos(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { pontos: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarPontos = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pontosDAO.selectAllPontos()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.pontos = result

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

const buscarPontos = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await pontosDAO.selectPontosById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.pontos = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

module.exports = {
    inserirNovoPontos,
    atualizarPontos,
    listarPontos,
    buscarPontos
}