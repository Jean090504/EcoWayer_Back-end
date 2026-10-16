/**************************************************************************************
 * Objetivo: Controller responsável pela validação e regras de negócio do CRUD de pontos
 * Local: controller/pontos/pontos_controler.js
 **************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pontosDAO = require('../../model/DAO/pontos/pontos.js')

// Transforma a linha "achatada" do JOIN no JSON com as chaves estrangeiras aninhadas
const montarPontos = function (row) {
    return {
        id: row.id,
        qntd_pontos: row.qntd_pontos,
        data_registro: row.data_registro,
        usuario: {
            id: row.usuario_id,
            nome: row.usuario_nome,
            imagem: row.imagem_id ? {
                id: row.imagem_id,
                url: row.imagem_url,
                tipo_imagem: {
                    id: row.tipo_imagem_id,
                    tipo: row.tipo_imagem_tipo
                }
            } : null
        },
        categoria: {
            id: row.categoria_id,
            nome: row.categoria_nome,
            pontos: row.categoria_pontos,
            tipo_categoria: {
                id: row.tipo_categoria_id,
                nome: row.tipo_categoria_nome
            }
        }
    }
}

const inserirNovoPontos = async function (pontos, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(pontos, true)

            if (validar) {
                return validar // 400
            } else {
                let idInserido = await pontosDAO.insertPontos(pontos)

                if (idInserido) {
                    let criado = await buscarPontos(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = criado.status
                        ? { pontos: criado.response.pontos }
                        : { id: idInserido }

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

const atualizarPontos = async function (pontos, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarPontos(id)

            if (resultID.status) {
                let validar = await validarDados(pontos, false)

                if (!validar) {
                    pontos.id = Number(id)

                    let result = await pontosDAO.updatePontos(pontos)

                    if (result) {
                        let atualizado = await buscarPontos(id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = atualizado.status
                            ? { pontos: atualizado.response.pontos }
                            : { id: pontos.id }

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

const listarPontos = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pontosDAO.selectAllPontos()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.pontos = result.map(montarPontos)

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

const buscarPontos = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await pontosDAO.selectByIdPontos(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.pontos = montarPontos(result[0])

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

const excluirPontos = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarPontos(id)

        if (resultBuscarID.status) {
            let result = await pontosDAO.deletePontos(id)

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

// id válido = inteiro positivo
const idValido = function (valor) {
    return valor !== undefined && valor !== null && String(valor).trim() !== '' && Number.isInteger(Number(valor)) && Number(valor) > 0
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// "inserir" = true exige id_usuario; na atualização o usuário não é alterado.
const validarDados = async function (pontos, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(pontos.qntd_pontos)) {
        message.ERROR_BAD_REQUEST.field = '[QNTD_PONTOS] INVÁLIDA (obrigatória, inteiro maior que 0)'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(pontos.id_categoria)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else if (inserir && !idValido(pontos.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoPontos,
    atualizarPontos,
    listarPontos,
    buscarPontos,
    excluirPontos,
    validarDados
}