/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Endereço e Ponto de Coleta (usado só pelo controller do ponto)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const enderecoPontoColetaDAO = require('../../model/DAO/endereco_ponto_coleta/endereco_ponto_coleta.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// DECIMAL vem como texto do mysql2: converte latitude e longitude do endereço para número
const formatarEndereco = function (endereco) {
    endereco.latitude = (endereco.latitude === null || endereco.latitude === undefined) ? null : Number(endereco.latitude)
    endereco.longitude = (endereco.longitude === null || endereco.longitude === undefined) ? null : Number(endereco.longitude)

    return endereco
}

const inserirNovoEnderecoPontoColeta = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await enderecoPontoColetaDAO.insertEnderecoPontoColeta(relacao)

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

const buscarEnderecosIdPontoColeta = async function (idPontoColeta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idPontoColeta)) {
            message.ERROR_BAD_REQUEST.field = '[ID_PONTO_COLETA] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await enderecoPontoColetaDAO.selectEnderecosByIdPontoColeta(Number(idPontoColeta))

            if (result && result.length > 0) {
                result.forEach(formatarEndereco)

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.endereco = result

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

const excluirEnderecosIdPontoColeta = async function (idPontoColeta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await enderecoPontoColetaDAO.deleteEnderecosByIdPontoColeta(idPontoColeta)

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

    if (!idValido(relacao.id_ponto_coleta)) {
        message.ERROR_BAD_REQUEST.field = '[ID_PONTO_COLETA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_endereco)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ENDERECO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoEnderecoPontoColeta,
    buscarEnderecosIdPontoColeta,
    excluirEnderecosIdPontoColeta
}