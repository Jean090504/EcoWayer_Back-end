/***********************************************************************************************
 *  Objetivo: Validação, tratamento e manipulação de dados para o CRUD de status de usuário
 *  Data: 10/11/2026
 *  Autor: Maxw
 *  Versão: 1.0
 **********************************************************************************************/
const configMessages = require("../modulo/configMessages.js")
const statusUsuarioDAO = require("../../model/DAO/status_usuario/status_usuario.js")

// ---------- helpers ----------
const ehJson = (contentType) =>
    String(contentType || "").split(";")[0].trim().toUpperCase() === "APPLICATION/JSON"

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// ---------- INSERIR ----------
const inserirNovoStatusUsuario = async function (statusUsuario, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))
    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }
        let validar = await validarDados(statusUsuario)
        if (validar) {
            return validar // 400
        }
        let result = await statusUsuarioDAO.insertStatusUsuario({ status: statusUsuario.status.trim() })
        if (result) { // 201
            message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
            return message.DEFAULT_MESSAGE
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500 (controler)
    }
}

// ---------- ATUALIZAR ----------
const atualizarStatusUsuario = async function (statusUsuario, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))
    try {
        if (!ehJson(contentType)) {
            return message.ERROR_CONTENT_TYPE // 415
        }
        let resultID = await buscarStatusUsuario(id)
        if (!resultID.status) {
            return resultID // 400 ou 404 ou 500
        }
        let validar = await validarDados(statusUsuario)
        if (validar) {
            return validar // 400
        }
        // monta objeto só com campos permitidos (id vem da URL, nunca do body)
        let dados = {
            id: Number(id),
            status: statusUsuario.status.trim()
        }
        let result = await statusUsuarioDAO.updateStatusUsuario(dados)
        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
            message.DEFAULT_MESSAGE.response = dados
            return message.DEFAULT_MESSAGE // 201 (config atual)
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- LISTAR ----------
const listarStatusUsuario = async function (limit = 50, offset = 0) {
    let message = JSON.parse(JSON.stringify(configMessages))
    try {
        let result = await statusUsuarioDAO.selectAllStatusUsuarios(limit, offset)
        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.status_usuario = result
                return message.DEFAULT_MESSAGE // 200
            }
            return message.ERROR_NOT_FOUND // 404
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- BUSCAR POR ID ----------
const buscarStatusUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))
    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = "[ID] Inválido"
            return message.ERROR_BAD_REQUEST // 400
        }
        let result = await statusUsuarioDAO.selectStatusUsuarioById(Number(id))
        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
        if (result.length > 0) {   // array vazio é truthy: checar length
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.status_usuario = result[0]
            return message.DEFAULT_MESSAGE // 200
        }
        return message.ERROR_NOT_FOUND // 404
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- EXCLUIR ----------
const excluirStatusUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))
    try {
        let resultBuscarID = await buscarStatusUsuario(id)
        if (!resultBuscarID.status) {
            return resultBuscarID // 400 ou 404 ou 500
        }
        let result = await statusUsuarioDAO.deleteStatusUsuario(Number(id))
        if (result) {
            return message.SUCCESS_DELETED_ITEM // 200
        }
        return message.ERROR_INTERNAL_SEVER_MODEL // 500 (inclui violação de FK)
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ---------- VALIDAÇÃO (retorna false se OK) ----------
const validarDados = async function (statusUsuario) {
    let message = JSON.parse(JSON.stringify(configMessages))   // clone: NUNCA mutar o singleton
    const invalido = (campo) => {
        message.ERROR_BAD_REQUEST.field = campo
        return message.ERROR_BAD_REQUEST
    }

    if (statusUsuario === null || typeof statusUsuario !== "object" || Array.isArray(statusUsuario)) {
        return invalido("[BODY] INVÁLIDO")
    }
    if (typeof statusUsuario.status !== "string" ||
        statusUsuario.status.trim() === "" ||
        statusUsuario.status.trim().length > 50) {
        return invalido("[STATUS] Inválido ou acima do limite de 50 caracteres")
    }
    return false
}

module.exports = {
    inserirNovoStatusUsuario,
    atualizarStatusUsuario,
    listarStatusUsuario,
    buscarStatusUsuario,
    excluirStatusUsuario,
    validarDados
}