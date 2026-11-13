/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Imagem e Entrega (usado só pelo controller da entrega)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const imagemEntregaDAO = require('../../model/model/DAO/imagem_entrega/imagem_entrega.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const inserirNovoImagemEntrega = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await imagemEntregaDAO.insertImagemEntrega(relacao)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                return message.DEFAULT_MESSAGE // 201
            } else {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const buscarImagensIdEntrega = async function (idEntrega) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idEntrega)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ENTREGA] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await imagemEntregaDAO.selectImagensByIdEntrega(Number(idEntrega))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.imagem = result

                return message.DEFAULT_MESSAGE // 200
            } else if (result === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else {
                return message.ERROR_NOT_FOUND // 404
            }
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const excluirImagensIdEntrega = async function (idEntrega) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await imagemEntregaDAO.deleteImagensByIdEntrega(idEntrega)

        if (result) {
            return message.SUCCESS_DELETED_ITEM // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(relacao.id_entrega)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ENTREGA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_imagem)) {
        message.ERROR_BAD_REQUEST.field = '[ID_IMAGEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoImagemEntrega,
    buscarImagensIdEntrega,
    excluirImagensIdEntrega
}