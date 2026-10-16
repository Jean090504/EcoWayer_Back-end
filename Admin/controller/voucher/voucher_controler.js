/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de voucher
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const voucherDAO = require('../../model/DAO/voucher/voucher.js')

// ---------- AJUSTAR CONFORME O BANCO (o print estava cortado) ----------
// Conferir com: SHOW COLUMNS FROM tbl_voucher;
const NOME_PARCEIRO_MAX = 150                               // print mostrava "VARCHAR(15..."
const STATUS_VALIDOS = ['ativo', 'utilizado', 'expirado']   // valores do ENUM da coluna status

// ---------- helpers ----------
// Compara só a parte antes do ';' (aceita "application/json; charset=utf-8")
const ehJson = (contentType) =>
    String(contentType || '').split(';')[0].trim().toUpperCase() === 'APPLICATION/JSON'

// Só dígitos, inteiro seguro e maior que zero (isNaN aceita 1e3, 0x1F, Infinity...)
const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Inteiro maior ou igual a zero (pontos)
const inteiroNaoNegativo = (valor) =>
    /^\d+$/.test(String(valor)) && Number.isSafeInteger(Number(valor))

// Texto obrigatório com limite de tamanho
const textoValido = (valor, max) =>
    typeof valor === 'string' && valor.trim() !== '' && valor.trim().length <= max

// Data e hora: aceita "AAAA-MM-DD HH:MM:SS" ou "AAAA-MM-DDTHH:MM:SS".
// Retorna "AAAA-MM-DD HH:MM:SS" se for um instante real do calendário, senão false
const normalizarDataHora = (valor) => {
    if (typeof valor !== 'string') return false
    let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(valor.trim())
    if (!m) return false

    let normal = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
    let d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`)
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 19).replace('T', ' ') !== normal) return false // rejeita 2026-02-31

    return normal
}

// Monta o objeto só com os campos permitidos (já tratados)
const montarDados = (voucher) => ({
    nome_parceiro: voucher.nome_parceiro.trim(),
    beneficio: voucher.beneficio.trim(),
    codigo: voucher.codigo.trim(),
    data_resgate: normalizarDataHora(voucher.data_resgate),
    data_expiracao: normalizarDataHora(voucher.data_expiracao),
    status: voucher.status.trim(),
    pontos_utilizados: Number(voucher.pontos_utilizados),
    id_usuario: Number(voucher.id_usuario)
})

// ---------- INSERIR ----------
const inserirNovoVoucher = async function (voucher, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (ehJson(contentType)) {
            let validar = await validarDados(voucher)

            if (validar) {
                return validar // 400
            } else {
                let dados = montarDados(voucher)
                let idInserido = await voucherDAO.insertVoucher(dados)

                if (idInserido) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = {
                        id: idInserido,
                        ...dados
                    }

                    return message.DEFAULT_MESSAGE // 201
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500 (inclui usuário inexistente e código duplicado)
                }
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- ATUALIZAR ----------
const atualizarVoucher = async function (voucher, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (ehJson(contentType)) {
            let resultID = await buscarVoucher(id)

            if (resultID.status) {
                let validar = await validarDados(voucher)

                if (!validar) {
                    // o id vem SEMPRE da URL
                    let dados = { id: Number(id), ...montarDados(voucher) }
                    let result = await voucherDAO.updateVoucher(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = dados

                        return message.DEFAULT_MESSAGE // 200
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                } else {
                    return validar // 400
                }
            } else {
                return resultID // 400, 404 ou 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- LISTAR ----------
const listarVoucher = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await voucherDAO.selectAllVoucher()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.voucher = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- BUSCAR POR ID ----------
const buscarVoucher = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await voucherDAO.selectByIdVoucher(Number(id))

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.voucher = result[0]

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- EXCLUIR ----------
const excluirVoucher = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarVoucher(id)

        if (resultBuscarID.status) {
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
        } else {
            return resultBuscarID // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- VALIDAÇÃO (retorna false se estiver tudo certo) ----------
const validarDados = async function (voucher) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (voucher === null || typeof voucher !== 'object' || Array.isArray(voucher)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (!textoValido(voucher.nome_parceiro, NOME_PARCEIRO_MAX)) {
        message.ERROR_BAD_REQUEST.field = `[NOME_PARCEIRO] INVÁLIDO (obrigatório, máximo ${NOME_PARCEIRO_MAX} caracteres)`
        return message.ERROR_BAD_REQUEST
    }

    if (!textoValido(voucher.beneficio, 255)) {
        message.ERROR_BAD_REQUEST.field = '[BENEFICIO] INVÁLIDO (obrigatório, máximo 255 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    if (!textoValido(voucher.codigo, 255)) {
        message.ERROR_BAD_REQUEST.field = '[CODIGO] INVÁLIDO (obrigatório, máximo 255 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    let resgate = normalizarDataHora(voucher.data_resgate)
    if (!resgate) {
        message.ERROR_BAD_REQUEST.field = '[DATA_RESGATE] INVÁLIDA (use AAAA-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    }

    let expiracao = normalizarDataHora(voucher.data_expiracao)
    if (!expiracao) {
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] INVÁLIDA (use AAAA-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST
    }

    if (expiracao < resgate) { // mesmo formato, então a comparação de texto funciona
        message.ERROR_BAD_REQUEST.field = '[DATA_EXPIRACAO] não pode ser anterior à data de resgate'
        return message.ERROR_BAD_REQUEST
    }

    if (typeof voucher.status !== 'string' || !STATUS_VALIDOS.includes(voucher.status.trim())) {
        message.ERROR_BAD_REQUEST.field = `[STATUS] INVÁLIDO (valores aceitos: ${STATUS_VALIDOS.join(', ')})`
        return message.ERROR_BAD_REQUEST
    }

    if (!inteiroNaoNegativo(voucher.pontos_utilizados)) {
        message.ERROR_BAD_REQUEST.field = '[PONTOS_UTILIZADOS] INVÁLIDO (inteiro maior ou igual a zero)'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(voucher.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

module.exports = {
    inserirNovoVoucher,
    atualizarVoucher,
    listarVoucher,
    buscarVoucher,
    excluirVoucher,
    validarDados
}