/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_insignia (catálogo de conquistas)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const insigniaDAO = require('../../model/DAO/insignia/insignia.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inteiroPositivo = (valor) =>
    valor !== '' && valor !== null && valor !== undefined &&
    Number.isInteger(Number(valor)) && Number(valor) > 0

const validarDados = function (insignia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!insignia || typeof insignia !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let nome = typeof insignia.nome === 'string' ? insignia.nome.trim() : ''
    let descricao = typeof insignia.descricao === 'string' ? insignia.descricao.trim() : ''
    let unidade = typeof insignia.unidade === 'string' ? insignia.unidade.trim() : ''

    if (nome.length < 1 || nome.length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (1 a 100 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (descricao.length < 1) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (não pode ser vazia)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(insignia.meta)) {
        message.ERROR_BAD_REQUEST.field = '[META] INVÁLIDA (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (unidade.length < 1 || unidade.length > 20) {
        message.ERROR_BAD_REQUEST.field = '[UNIDADE] INVÁLIDA (1 a 20 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (insignia) {
    return {
        nome: insignia.nome.trim(),
        descricao: insignia.descricao.trim(),
        meta: Number(insignia.meta),
        unidade: insignia.unidade.trim()
    }
}

const inserirNovaInsignia = async function (insignia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(insignia)
        if (validar) return validar // 400

        let dados = normalizarDados(insignia)
        let id = await insigniaDAO.insertInsignia(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { insignia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarInsignia = async function (id, insignia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await insigniaDAO.selectInsigniaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(insignia)
        if (validar) return validar // 400

        let dados = normalizarDados(insignia)
        dados.id = Number(id)

        let result = await insigniaDAO.updateInsignia(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { insignia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarInsignias = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await insigniaDAO.selectAllInsignias()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.insignia = result

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

const buscarInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await insigniaDAO.selectInsigniaById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.insignia = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await insigniaDAO.selectInsigniaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await insigniaDAO.countDependenciasInsignia(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] INSÍGNIA EM USO (conquistada ou em progresso por usuários)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await insigniaDAO.deleteInsignia(Number(id))

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
    inserirNovaInsignia,
    atualizarInsignia,
    listarInsignias,
    buscarInsignia,
    excluirInsignia
}