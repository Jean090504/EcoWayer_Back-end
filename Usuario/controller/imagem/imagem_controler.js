/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de imagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const imagemDAO = require('../../model/DAO/imagem/imagem.js')
const tipoImagemDAO = require('../../model/DAO/tipo_imagem/tipo_imagem.js')

const inserirNovaImagem = async function (imagem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(imagem)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = tratarDados(imagem)

                let result = await imagemDAO.insertImagem(dados)

                if (result) { // 201
                    // busca o registro gravado para devolver também o nome do tipo
                    let inserido = await imagemDAO.selectByIdImagem(result)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        imagem: (inserido && inserido.length > 0) ? inserido[0] : { id: result, ...dados }
                    }

                    return message.DEFAULT_MESSAGE
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

const atualizarImagem = async function (imagem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarImagem(id)

            if (resultID.status) {
                let validar = await validarDados(imagem)

                if (!validar) {
                    let dados = tratarDados(imagem)
                    dados.id = Number(id)

                    let result = await imagemDAO.updateImagem(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { ...dados }

                        return message.DEFAULT_MESSAGE // 200
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                } else {
                    return validar // 400 ou 500
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

const listarImagem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await imagemDAO.selectAllImagem()

        if (result) {
            if (result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.imagem = result

                return message.DEFAULT_MESSAGE // 200
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarImagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await imagemDAO.selectByIdImagem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.imagem = result[0]

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_NOT_FOUND // 404
                }
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirImagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarImagem(id)

        if (resultBuscarID.status) {
            let emUso = await imagemDAO.selectImagemEmUso(id)

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] IMAGEM EM USO (vinculada a usuário, anúncio, denúncia ou entrega)'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await imagemDAO.deleteImagem(id)

                if (result) {
                    return message.SUCCESS_DELETED_ITEM // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscarID // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Padroniza os dados depois de validados.
const tratarDados = function (imagem) {
    return {
        url: String(imagem.url).trim(),
        id_tipo_imagem: Number(imagem.id_tipo_imagem)
    }
}

const validarDados = async function (imagem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (imagem.url == undefined || imagem.url == null || String(imagem.url).trim() == '' || String(imagem.url).trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = "[URL] INVÁLIDA (1 a 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (imagem.id_tipo_imagem == undefined || imagem.id_tipo_imagem == null || imagem.id_tipo_imagem === '' || isNaN(imagem.id_tipo_imagem) || !Number.isInteger(Number(imagem.id_tipo_imagem)) || Number(imagem.id_tipo_imagem) < 1) {
        message.ERROR_BAD_REQUEST.field = "[ID_TIPO_IMAGEM] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // confere se o tipo de imagem existe (evita erro de chave estrangeira no banco)
        let tipo = await tipoImagemDAO.selectByIdTipoImagem(Number(imagem.id_tipo_imagem))

        if (tipo === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (tipo.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_TIPO_IMAGEM] NÃO ENCONTRADO"
            return message.ERROR_BAD_REQUEST
        } else {
            return false
        }
    }
}

module.exports = {
    inserirNovaImagem,
    atualizarImagem,
    listarImagem,
    buscarImagem,
    excluirImagem,
    validarDados
}