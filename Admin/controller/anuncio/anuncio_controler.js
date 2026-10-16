/**************************************************************************************
 * Objetivo: Controller responsável pela validação e regras de negócio do CRUD de anúncio
 * Local: controller/anuncio/anuncio_controler.js
 **************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const anuncioDAO = require('../../model/DAO/anuncio/anuncio.js')

// Transforma a linha "achatada" do JOIN no JSON com as chaves estrangeiras aninhadas
const montarAnuncio = function (row) {
    return {
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        data_publicacao: row.data_publicacao,
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
        },
        modalidade: {
            id: row.modalidade_id,
            nome: row.modalidade_nome,
            tipo_modalidade: {
                id: row.tipo_modalidade_id,
                tipo: row.tipo_modalidade_tipo
            }
        },
        condicao_item: {
            id: row.condicao_item_id,
            nome: row.condicao_item_nome
        }
    }
}

const inserirNovoAnuncio = async function (anuncio, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(anuncio, true)

            if (validar) {
                return validar // 400
            } else {
                let idInserido = await anuncioDAO.insertAnuncio(anuncio)

                if (idInserido) {
                    // devolve o anúncio completo, já com as chaves estrangeiras expandidas
                    let criado = await buscarAnuncio(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                    message.DEFAULT_MESSAGE.response = criado.status
                        ? { anuncio: criado.response.anuncio }
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

const atualizarAnuncio = async function (anuncio, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarAnuncio(id)

            if (resultID.status) {
                let validar = await validarDados(anuncio, false)

                if (!validar) {
                    anuncio.id = Number(id)

                    let result = await anuncioDAO.updateAnuncio(anuncio)

                    if (result) {
                        let atualizado = await buscarAnuncio(id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = atualizado.status
                            ? { anuncio: atualizado.response.anuncio }
                            : { id: anuncio.id }

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

const listarAnuncio = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await anuncioDAO.selectAllAnuncio()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.anuncio = result.map(montarAnuncio)

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

const buscarAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await anuncioDAO.selectByIdAnuncio(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.anuncio = montarAnuncio(result[0])

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

const excluirAnuncio = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarAnuncio(id)

        if (resultBuscarID.status) {
            let result = await anuncioDAO.deleteAnuncio(id)

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
// "inserir" = true exige id_usuario (dono do anúncio); na atualização ele não é alterado.
const validarDados = async function (anuncio, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (anuncio.nome == undefined || anuncio.nome == null || String(anuncio.nome).trim() == '' || String(anuncio.nome).length > 100) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO (obrigatório, máximo 100 caracteres)'
        return message.ERROR_BAD_REQUEST
    } else if (anuncio.descricao == undefined || anuncio.descricao == null || String(anuncio.descricao).trim() == '') {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (obrigatória)'
        return message.ERROR_BAD_REQUEST
    } else if (inserir && !idValido(anuncio.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(anuncio.id_categoria)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CATEGORIA] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(anuncio.id_modalidade)) {
        message.ERROR_BAD_REQUEST.field = '[ID_MODALIDADE] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(anuncio.id_condicao_item)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONDICAO_ITEM] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoAnuncio,
    atualizarAnuncio,
    listarAnuncio,
    buscarAnuncio,
    excluirAnuncio,
    validarDados
}