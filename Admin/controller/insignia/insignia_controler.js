/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de insígnia
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const insigniaDAO = require('../../model/DAO/insignia/insignia.js')

// ---------- helpers ----------
// Compara só a parte antes do ';' (aceita "application/json; charset=utf-8")
const ehJson = (contentType) =>
    String(contentType || '').split(';')[0].trim().toUpperCase() === 'APPLICATION/JSON'

// Só dígitos, inteiro seguro e maior que zero (isNaN aceita 1e3, 0x1F, Infinity...)
const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Texto obrigatório com limite de caracteres
const textoValido = (valor, max) =>
    typeof valor === 'string' && valor.trim() !== '' && valor.trim().length <= max

// TEXT do MySQL guarda até 65.535 BYTES (acentos e emojis ocupam mais de 1 byte)
const textoLongoValido = (valor) =>
    typeof valor === 'string' && valor.trim() !== '' && Buffer.byteLength(valor.trim(), 'utf8') <= 65535

// meta: inteiro maior que zero que caiba em um INT do MySQL
const metaValida = (meta) => idValido(meta) && Number(meta) <= 2147483647

// Monta o objeto só com os campos permitidos (já tratados)
const montarDados = (insignia) => ({
    nome: insignia.nome.trim(),
    descricao: insignia.descricao.trim(),
    meta: Number(insignia.meta),
    unidade: insignia.unidade.trim()
})

// ---------- INSERIR ----------
const inserirNovoInsignia = async function (insignia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (ehJson(contentType)) {
            let validar = await validarDados(insignia)

            if (validar) {
                return validar // 400
            } else {
                let dados = montarDados(insignia)
                let idInserido = await insigniaDAO.insertInsignia(dados)

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
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
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
const atualizarInsignia = async function (insignia, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (ehJson(contentType)) {
            let resultID = await buscarInsignia(id)

            if (resultID.status) {
                let validar = await validarDados(insignia)

                if (!validar) {
                    // o id vem SEMPRE da URL
                    let dados = { id: Number(id), ...montarDados(insignia) }
                    let result = await insigniaDAO.updateInsignia(dados)

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
const listarInsignia = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await insigniaDAO.selectAllInsignia()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.insignia = result

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
const buscarInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await insigniaDAO.selectByIdInsignia(Number(id))

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.insignia = result[0]

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
const excluirInsignia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarInsignia(id)

        if (resultBuscarID.status) {
            let result = await insigniaDAO.deleteInsignia(Number(id))

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { id: Number(id) }

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500 (inclui insígnia em uso por outra tabela: FK)
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
const validarDados = async function (insignia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (insignia === null || typeof insignia !== 'object' || Array.isArray(insignia)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    if (!textoValido(insignia.nome, 100)) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, máximo 100 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    if (!textoLongoValido(insignia.descricao)) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (obrigatória, máximo 65535 bytes)'
        return message.ERROR_BAD_REQUEST
    }

    if (!metaValida(insignia.meta)) {
        message.ERROR_BAD_REQUEST.field = '[META] INVÁLIDA (inteiro maior que zero)'
        return message.ERROR_BAD_REQUEST
    }

    if (!textoValido(insignia.unidade, 20)) {
        message.ERROR_BAD_REQUEST.field = '[UNIDADE] INVÁLIDA (obrigatória, máximo 20 caracteres)'
        return message.ERROR_BAD_REQUEST
    }

    return false
}

module.exports = {
    inserirNovoInsignia,
    atualizarInsignia,
    listarInsignia,
    buscarInsignia,
    excluirInsignia,
    validarDados
}