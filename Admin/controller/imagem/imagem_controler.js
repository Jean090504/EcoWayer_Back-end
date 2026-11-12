/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de imagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const imagemDAO = require('../../model/DAO/imagem/imagem.js')

// Controller que já existe e fornece os dados da chave estrangeira.
// CONFIRME o caminho e o nome da função exportada (module.exports) dele.
const controlerTipoImagem = require('../tipo_imagem/tipo_imagem_controler.js') // buscarTipoImagem

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Troca o id_tipo_imagem pelo objeto do tipo
const montarImagem = async function (imagem) {
    imagem.tipo_imagem = await buscarRelacionado(controlerTipoImagem.buscarTipoImagem, imagem.id_tipo_imagem)

    delete imagem.id_tipo_imagem

    return imagem
}

const inserirNovaImagem = async function (imagem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(imagem)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(imagem)

                let idInserido = await imagemDAO.insertImagem(imagem)

                if (idInserido) {
                    let criada = await imagemDAO.selectByIdImagem(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarImagem(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, url: imagem.url }
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

const atualizarImagem = async function (imagem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarImagem(id)

            if (resultID.status) {
                let validar = await validarDados(imagem)

                if (!validar) {
                    normalizarDados(imagem)
                    imagem.id = Number(id)

                    let result = await imagemDAO.updateImagem(imagem)

                    if (result) {
                        let atualizada = await imagemDAO.selectByIdImagem(imagem.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarImagem(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: imagem.id, url: imagem.url }
                        }

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

const listarImagem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await imagemDAO.selectAllImagem()

        if (result) {
            if (result.length > 0) {
                // ids em ordem decrescente (ORDER BY do DAO)
                for (let imagem of result) {
                    await montarImagem(imagem)
                }

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
        console.log(error)
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
                    message.DEFAULT_MESSAGE.response.imagem = await montarImagem(result[0])

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

const excluirImagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarImagem(id)

        if (resultBuscarID.status) {
            let result = await imagemDAO.deleteImagem(id)

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

// Padroniza os dados antes de gravar
const normalizarDados = function (imagem) {
    imagem.url = String(imagem.url).trim()
    imagem.id_tipo_imagem = Number(imagem.id_tipo_imagem)
}

// Aceita apenas endereços http ou https
const urlValida = function (valor) {
    try {
        let url = new URL(String(valor).trim())

        return url.protocol == 'http:' || url.protocol == 'https:'
    } catch (error) {
        return false
    }
}

const validarDados = async function (imagem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (imagem.url == undefined || imagem.url == null || String(imagem.url).trim() == '' || String(imagem.url).length > 255 || !urlValida(imagem.url)) {
        message.ERROR_BAD_REQUEST.field = "[URL] INVÁLIDA (endereço http ou https, máximo 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (imagem.id_tipo_imagem === undefined || imagem.id_tipo_imagem === null || imagem.id_tipo_imagem === '' || !Number.isInteger(Number(imagem.id_tipo_imagem)) || Number(imagem.id_tipo_imagem) <= 0) {
        message.ERROR_BAD_REQUEST.field = "[ID_TIPO_IMAGEM] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o tipo de imagem existe (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerTipoImagem.buscarTipoImagem, imagem.id_tipo_imagem)) {
            message.ERROR_BAD_REQUEST.field = "[ID_TIPO_IMAGEM] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
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