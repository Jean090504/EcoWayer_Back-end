/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_usuario_insignia (progresso do usuário em uma insígnia)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const usuarioInsigniaDAO = require('../../model/DAO/usuario_insignia/usuario_insignia.js')

const STATUS_VALIDOS = ['em andamento', 'concluido']

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (vinculo, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!vinculo || typeof vinculo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_insignia)) {
        message.ERROR_BAD_REQUEST.field = '[ID_INSIGNIA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let usuario = await usuarioInsigniaDAO.selectUsuarioExiste(Number(vinculo.id_usuario))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let insignia = await usuarioInsigniaDAO.selectInsigniaExiste(Number(vinculo.id_insignia))
    if (insignia === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (insignia.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_INSIGNIA] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let par = await usuarioInsigniaDAO.selectParUsuarioInsignia(Number(vinculo.id_usuario), Number(vinculo.id_insignia), idIgnorar)
    if (par === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (par.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (este usuário já possui esta insígnia)',
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

    let status = typeof vinculo.status === 'string' ? vinculo.status.trim() : ''
    let progresso = vinculo.progresso === undefined ? 0 : Number(vinculo.progresso)

    if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use em andamento ou concluido)'
        return message.ERROR_BAD_REQUEST
    } else if (Number.isNaN(progresso) || progresso < 0 || progresso > 100) {
        message.ERROR_BAD_REQUEST.field = '[PROGRESSO] INVÁLIDO (número entre 0 e 100)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (vinculo) {
    return {
        progresso: Number(vinculo.progresso === undefined ? 0 : vinculo.progresso),
        status: vinculo.status.trim(),
        id_usuario: Number(vinculo.id_usuario),
        id_insignia: Number(vinculo.id_insignia)
    }
}

const inserirNovoUsuarioInsignia = async function (vinculo, contentType) {
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
        let id = await usuarioInsigniaDAO.insertUsuarioInsignia(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { usuario_insignia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarUsuarioInsignia = async function (id, vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await usuarioInsigniaDAO.selectUsuarioInsigniaById(Number(id))

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

        let result = await usuarioInsigniaDAO.updateUsuarioInsignia(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { usuario_insignia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarUsuarioInsignias = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await usuarioInsigniaDAO.selectAllUsuarioInsignias()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.usuario_insignia = result

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

const buscarUsuarioInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await usuarioInsigniaDAO.selectUsuarioInsigniaById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.usuario_insignia = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirUsuarioInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await usuarioInsigniaDAO.selectUsuarioInsigniaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await usuarioInsigniaDAO.deleteUsuarioInsignia(Number(id))

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
    inserirNovoUsuarioInsignia,
    atualizarUsuarioInsignia,
    listarUsuarioInsignias,
    buscarUsuarioInsignia,
    excluirUsuarioInsignia
}