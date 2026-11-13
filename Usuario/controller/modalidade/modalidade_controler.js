/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_modalidade (forma de negociação do anúncio)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const modalidadeDAO = require('../../model/DAO/modalidade/modalidade.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (modalidade, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let nome = typeof modalidade.nome === 'string' ? modalidade.nome.trim() : ''

    if (nome.length < 1 || nome.length > 45) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (1 a 45 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    let existe = await modalidadeDAO.selectModalidadePorNome(nome, idIgnorar)
    if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (existe.length > 0) {
        // ERROR_CONFLICT não é exportado pelo configMessages, então monta o 409 aqui
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (esta modalidade já está cadastrada)',
            field: '[NOME] JÁ EXISTENTE'
        }
    }

    if (!idValido(modalidade.id_tipo_modalidade)) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_MODALIDADE] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let tipo = await modalidadeDAO.selectTipoModalidadeExiste(Number(modalidade.id_tipo_modalidade))
    if (tipo === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (tipo.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_MODALIDADE] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

const validarDados = function (modalidade) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!modalidade || typeof modalidade !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    return false
}

const normalizarDados = function (modalidade) {
    return {
        nome: modalidade.nome.trim(),
        id_tipo_modalidade: Number(modalidade.id_tipo_modalidade)
    }
}

const inserirNovaModalidade = async function (modalidade, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(modalidade)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(modalidade)
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(modalidade)
        let id = await modalidadeDAO.insertModalidade(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { modalidade: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarModalidade = async function (id, modalidade, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await modalidadeDAO.selectModalidadeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(modalidade)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(modalidade, Number(id))
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(modalidade)
        dados.id = Number(id)

        let result = await modalidadeDAO.updateModalidade(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { modalidade: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarModalidades = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await modalidadeDAO.selectAllModalidades()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.modalidade = result

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

const buscarModalidade = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await modalidadeDAO.selectModalidadeById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.modalidade = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirModalidade = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await modalidadeDAO.selectModalidadeById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let emUso = await modalidadeDAO.countAnunciosDaModalidade(Number(id))

        if (emUso === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (emUso > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] MODALIDADE EM USO (vinculada a anúncios)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await modalidadeDAO.deleteModalidade(Number(id))

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
    inserirNovaModalidade,
    atualizarModalidade,
    listarModalidades,
    buscarModalidade,
    excluirModalidade
}