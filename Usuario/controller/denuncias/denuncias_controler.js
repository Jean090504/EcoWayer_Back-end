/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_denuncias (denúncias feitas pelos usuários)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const denunciasDAO = require('../../model/DAO/denuncias/denuncias.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// Devolve false se válido, ou a resposta de erro pronta (400 ou 500)
const validarVinculos = async function (denuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(denuncia.id_tipo_denuncias)) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_DENUNCIAS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let tipo = await denunciasDAO.selectExiste('tbl_tipo_denuncias', Number(denuncia.id_tipo_denuncias))
    if (tipo === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (tipo.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_DENUNCIAS] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(denuncia.id_denunciante)) {
        message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIANTE] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let usuario = await denunciasDAO.selectExiste('tbl_usuario', Number(denuncia.id_denunciante))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIANTE] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

const validarDados = function (denuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!denuncia || typeof denuncia !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let descricao = typeof denuncia.descricao === 'string' ? denuncia.descricao.trim() : ''

    if (descricao.length < 1) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (não pode ser vazia)'
        return message.ERROR_BAD_REQUEST
    } else if (descricao.length > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] MUITO LONGA'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (denuncia) {
    return {
        descricao: denuncia.descricao.trim(),
        id_tipo_denuncias: Number(denuncia.id_tipo_denuncias),
        id_denunciante: Number(denuncia.id_denunciante)
    }
}

const inserirNovaDenuncia = async function (denuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(denuncia)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(denuncia)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(denuncia)
        let id = await denunciasDAO.insertDenuncia(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { denuncia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarDenuncia = async function (id, denuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await denunciasDAO.selectDenunciaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(denuncia)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(denuncia)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(denuncia)
        dados.id = Number(id)

        let result = await denunciasDAO.updateDenuncia(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { denuncia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarDenuncias = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await denunciasDAO.selectAllDenuncias()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.denuncia = result

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

const buscarDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await denunciasDAO.selectDenunciaById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.denuncia = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Exclusão só se a denúncia não estiver vinculada a moderação (mensagem, anúncio, imagem ou alerta)
const excluirDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await denunciasDAO.selectDenunciaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await denunciasDAO.countDependenciasDenuncia(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] DENÚNCIA EM USO (vinculada a moderação ou alerta)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await denunciasDAO.deleteDenuncia(Number(id))

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
    inserirNovaDenuncia,
    atualizarDenuncia,
    listarDenuncias,
    buscarDenuncia,
    excluirDenuncia
}   