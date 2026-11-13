/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_usuario_missao (progresso do usuário em uma missão)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const usuarioMissaoDAO = require('../../model/DAO/usuario_missao/usuario_missao.js')

const STATUS_VALIDOS = ['em andamento', 'concluida', 'expirada']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (vinculo, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!vinculo || typeof vinculo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(vinculo.id_missao)) {
        message.ERROR_BAD_REQUEST.field = '[ID_MISSAO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let usuario = await usuarioMissaoDAO.selectUsuarioExiste(Number(vinculo.id_usuario))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let missao = await usuarioMissaoDAO.selectMissaoExiste(Number(vinculo.id_missao))
    if (missao === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (missao.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_MISSAO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    let par = await usuarioMissaoDAO.selectParUsuarioMissao(Number(vinculo.id_usuario), Number(vinculo.id_missao), idIgnorar)
    if (par === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (par.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (este usuário já participa desta missão)',
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
    let progresso = vinculo.progresso === undefined ? 0 : vinculo.progresso

    if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use em andamento, concluida ou expirada)'
        return message.ERROR_BAD_REQUEST
    } else if (!Number.isInteger(Number(progresso)) || Number(progresso) < 0) {
        message.ERROR_BAD_REQUEST.field = '[PROGRESSO] INVÁLIDO (inteiro maior ou igual a zero)'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(vinculo.data_inicio)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_INICIO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(vinculo.data_fim) && !dataValida(vinculo.data_fim)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_FIM] INVÁLIDA (use YYYY-MM-DD HH:MM:SS ou vazio)'
        return message.ERROR_BAD_REQUEST
    } else if (!vazio(vinculo.data_fim) && new Date(vinculo.data_fim.trim().replace(' ', 'T')) < new Date(vinculo.data_inicio.trim().replace(' ', 'T'))) {
        message.ERROR_BAD_REQUEST.field = '[DATA_FIM] DEVE SER IGUAL OU POSTERIOR À DATA_INICIO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (vinculo) {
    return {
        id_usuario: Number(vinculo.id_usuario),
        id_missao: Number(vinculo.id_missao),
        progresso: Number(vinculo.progresso === undefined ? 0 : vinculo.progresso),
        status: vinculo.status.trim(),
        data_inicio: vinculo.data_inicio.trim(),
        data_fim: vazio(vinculo.data_fim) ? null : vinculo.data_fim.trim()
    }
}

const inserirNovoUsuarioMissao = async function (vinculo, contentType) {
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
        let id = await usuarioMissaoDAO.insertUsuarioMissao(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { usuario_missao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarUsuarioMissao = async function (id, vinculo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await usuarioMissaoDAO.selectUsuarioMissaoById(Number(id))

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

        let result = await usuarioMissaoDAO.updateUsuarioMissao(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { usuario_missao: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarUsuarioMissoes = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await usuarioMissaoDAO.selectAllUsuarioMissoes()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.usuario_missao = result

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

const buscarUsuarioMissao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await usuarioMissaoDAO.selectUsuarioMissaoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.usuario_missao = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirUsuarioMissao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await usuarioMissaoDAO.selectUsuarioMissaoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await usuarioMissaoDAO.deleteUsuarioMissao(Number(id))

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
    inserirNovoUsuarioMissao,
    atualizarUsuarioMissao,
    listarUsuarioMissoes,
    buscarUsuarioMissao,
    excluirUsuarioMissao
}