/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_voucher_catalogo (itens disponíveis para resgate)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const catalogoDAO = require('../../model/DAO/voucher_catalogo/voucher_catalogo.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inteiroPositivo = (valor) =>
    valor !== '' && valor !== null && valor !== undefined &&
    Number.isInteger(Number(valor)) && Number(valor) > 0

const validarDados = function (catalogo) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!catalogo || typeof catalogo !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let nomeParceiro = typeof catalogo.nome_parceiro === 'string' ? catalogo.nome_parceiro.trim() : ''
    let beneficio = typeof catalogo.beneficio === 'string' ? catalogo.beneficio.trim() : ''

    if (nomeParceiro.length < 1 || nomeParceiro.length > 150) {
        message.ERROR_BAD_REQUEST.field = '[NOME_PARCEIRO] INVÁLIDO (1 a 150 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (beneficio.length < 1 || beneficio.length > 255) {
        message.ERROR_BAD_REQUEST.field = '[BENEFICIO] INVÁLIDO (1 a 255 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(catalogo.pontos_necessarios)) {
        message.ERROR_BAD_REQUEST.field = '[PONTOS_NECESSARIOS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroPositivo(catalogo.validade_dias)) {
        message.ERROR_BAD_REQUEST.field = '[VALIDADE_DIAS] INVÁLIDO (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    } else if (catalogo.ativo !== 0 && catalogo.ativo !== 1 && catalogo.ativo !== true && catalogo.ativo !== false) {
        message.ERROR_BAD_REQUEST.field = '[ATIVO] INVÁLIDO (use 0, 1, true ou false)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (catalogo) {
    return {
        nome_parceiro: catalogo.nome_parceiro.trim(),
        beneficio: catalogo.beneficio.trim(),
        pontos_necessarios: Number(catalogo.pontos_necessarios),
        validade_dias: Number(catalogo.validade_dias),
        ativo: (catalogo.ativo === true || catalogo.ativo === 1) ? 1 : 0
    }
}

const inserirNovoVoucherCatalogo = async function (catalogo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(catalogo)
        if (validar) return validar // 400

        let dados = normalizarDados(catalogo)
        let id = await catalogoDAO.insertVoucherCatalogo(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { voucher_catalogo: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarVoucherCatalogo = async function (id, catalogo, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await catalogoDAO.selectVoucherCatalogoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(catalogo)
        if (validar) return validar // 400

        let dados = normalizarDados(catalogo)
        dados.id = Number(id)

        let result = await catalogoDAO.updateVoucherCatalogo(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { voucher_catalogo: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarVoucherCatalogo = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await catalogoDAO.selectAllVoucherCatalogo()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.voucher_catalogo = result

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

const buscarVoucherCatalogo = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await catalogoDAO.selectVoucherCatalogoById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.voucher_catalogo = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirVoucherCatalogo = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await catalogoDAO.selectVoucherCatalogoById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await catalogoDAO.countDependenciasVoucherCatalogo(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] ITEM EM USO (vinculado a voucher)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await catalogoDAO.deleteVoucherCatalogo(Number(id))

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
    inserirNovoVoucherCatalogo,
    atualizarVoucherCatalogo,
    listarVoucherCatalogo,
    buscarVoucherCatalogo,
    excluirVoucherCatalogo
}