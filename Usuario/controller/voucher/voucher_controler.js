/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_voucher (vouchers resgatados com pontos)
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const voucherDAO = require('../../model/DAO/voucher/voucher.js')

const STATUS_VALIDOS = ['ativo', 'utilizado', 'expirado', 'cancelado']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const inteiroNaoNegativo = (valor) =>
    valor !== '' && valor !== null && valor !== undefined &&
    Number.isInteger(Number(valor)) && Number(valor) >= 0

// Devolve false se válido, ou a resposta de erro pronta (400, 409 ou 500)
const validarVinculos = async function (voucher, idIgnorar = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!voucher || typeof voucher !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    // id_voucher_catalogo é obrigatório e precisa existir em tbl_voucher_catalogo
    if (!idValido(voucher.id_voucher_catalogo)) {
        message.ERROR_BAD_REQUEST.field = '[ID_VOUCHER_CATALOGO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let catalogo = await voucherDAO.selectVoucherCatalogoExiste(Number(voucher.id_voucher_catalogo))
    if (catalogo === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (catalogo.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_VOUCHER_CATALOGO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(voucher.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let usuario = await voucherDAO.selectUsuarioExiste(Number(voucher.id_usuario))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    // código único: 409 montado aqui (ERROR_CONFLICT não é exportado pelo configMessages)
    let codigo = typeof voucher.codigo === 'string' ? voucher.codigo.trim() : ''
    let repetido = await voucherDAO.selectVoucherByCodigo(codigo, idIgnorar)
    if (repetido === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (repetido.length > 0) {
        return {
            status: false,
            status_code: 409,
            message: 'JÁ EXISTE UM REGISTRO COM ESTES DADOS (código de voucher já cadastrado)',
            field: '[CODIGO] JÁ EXISTENTE'
        }
    }

    return false
}

const validarDados = function (voucher) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!voucher || typeof voucher !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let nomeParceiro = typeof voucher.nome_parceiro === 'string' ? voucher.nome_parceiro.trim() : ''
    let beneficio = typeof voucher.beneficio === 'string' ? voucher.beneficio.trim() : ''
    let codigo = typeof voucher.codigo === 'string' ? voucher.codigo.trim() : ''
    let status = typeof voucher.status === 'string' ? voucher.status.trim() : ''

    if (nomeParceiro.length < 1 || nomeParceiro.length > 150) {
        message.ERROR_BAD_REQUEST.field = '[NOME_PARCEIRO] INVÁLIDO (1 a 150 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (beneficio.length < 1 || beneficio.length > 255) {
        message.ERROR_BAD_REQUEST.field = '[BENEFICIO] INVÁLIDO (1 a 255 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (codigo.length < 1 || codigo.length > 255) {
        message.ERROR_BAD_REQUEST.field = '[CODIGO] INVÁLIDO (1 a 255 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(voucher.data_resgate)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_RESGATE] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else if (!dataValida(voucher.data_expiracao)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    } else if (new Date(voucher.data_expiracao.trim().replace(' ', 'T')) <= new Date(voucher.data_resgate.trim().replace(' ', 'T'))) {
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] DEVE SER POSTERIOR À DATA_RESGATE'
        return message.ERROR_BAD_REQUEST
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use ativo, utilizado, expirado ou cancelado)'
        return message.ERROR_BAD_REQUEST
    } else if (!inteiroNaoNegativo(voucher.pontos_utilizados)) {
        message.ERROR_BAD_REQUEST.field = '[PONTOS_UTILIZADOS] INVÁLIDO (inteiro maior ou igual a zero)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (voucher) {
    return {
        nome_parceiro: voucher.nome_parceiro.trim(),
        beneficio: voucher.beneficio.trim(),
        codigo: voucher.codigo.trim(),
        data_resgate: voucher.data_resgate.trim(),
        data_expiracao: voucher.data_expiracao.trim(),
        status: voucher.status.trim(),
        pontos_utilizados: Number(voucher.pontos_utilizados),
        id_usuario: Number(voucher.id_usuario),
        id_voucher_catalogo: Number(voucher.id_voucher_catalogo)
    }
}

const inserirNovoVoucher = async function (voucher, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(voucher)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(voucher)
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(voucher)
        let id = await voucherDAO.insertVoucher(dados)

        if (id) {
            dados.id = id

            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            message.DEFAULT_MESSAGE.response = { voucher: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarVoucher = async function (id, voucher, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await voucherDAO.selectVoucherById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(voucher)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(voucher, Number(id))
        if (vinculos) return vinculos // 400, 409 ou 500

        let dados = normalizarDados(voucher)
        dados.id = Number(id)

        let result = await voucherDAO.updateVoucher(dados)

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { voucher: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarVouchers = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await voucherDAO.selectAllVouchers()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.voucher = result

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

const buscarVoucher = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await voucherDAO.selectVoucherById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.voucher = result[0]

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirVoucher = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await voucherDAO.selectVoucherById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await voucherDAO.countDependenciasVoucher(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] VOUCHER EM USO (vinculado a QR Code)'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await voucherDAO.deleteVoucher(Number(id))

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
    inserirNovoVoucher,
    atualizarVoucher,
    listarVouchers,
    buscarVoucher,
    excluirVoucher
}