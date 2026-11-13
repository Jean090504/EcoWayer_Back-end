/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da Negociação (propostas e contrapropostas dentro da conversa de um anúncio)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const negociacaoDAO = require('../../model/DAO/negociacao/negociacao.js')
const conversaDAO = require('../../model/DAO/conversa/conversa.js')
const usuarioDAO = require('../../model/DAO/usuario/usuario.js')

const STATUS_PERMITIDOS = ['pendente', 'aceita', 'recusada', 'cancelada']

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// DECIMAL(10,2): até 2 casas, maior que 0 e no máximo 99999999.99
const valorValido = (valor) => {
    if (typeof valor !== 'number' && typeof valor !== 'string') {
        return false
    }

    let texto = String(valor).trim()

    if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
        return false
    }

    let numero = Number(texto)
    return numero > 0 && numero <= 99999999.99
}

// Inserir uma nova proposta (sempre começa como "pendente")
const inserirNovoNegociacao = async function (negociacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(negociacao, true)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = normalizarDados(negociacao)
                dados.status = 'pendente'

                let idNegociacao = await negociacaoDAO.insertNegociacao(dados)

                if (idNegociacao) {
                    let criada = await negociacaoDAO.selectByIdNegociacao(Number(idNegociacao))

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { negociacao: formatarNegociacao(criada[0]) }

                        return message.DEFAULT_MESSAGE // 201
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
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

// Atualizar valor e status de uma proposta (só enquanto ela estiver "pendente")
const atualizarNegociacao = async function (negociacao, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarNegociacao(id)

            if (resultBuscar.status_code == 200) {
                if (resultBuscar.response.negociacao.status !== 'pendente') {
                    message.ERROR_BAD_REQUEST.field = `[ID] NEGOCIAÇÃO JÁ FINALIZADA (status "${resultBuscar.response.negociacao.status}")`
                    return message.ERROR_BAD_REQUEST // 400
                }

                let validar = await validarDados(negociacao, false)

                if (validar) {
                    return validar // 400 ou 500
                } else {
                    let dados = normalizarDados(negociacao)
                    dados.id = Number(id)

                    let result = await negociacaoDAO.updateNegociacao(dados)

                    if (result) {
                        let atualizada = await negociacaoDAO.selectByIdNegociacao(dados.id)

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                            message.DEFAULT_MESSAGE.response = { negociacao: formatarNegociacao(atualizada[0]) }

                            return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                        } else {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                }
            } else {
                return resultBuscar // 400, 404 ou 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Listar todas as negociações
const listarNegociacao = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await negociacaoDAO.selectAllNegociacao()

        if (result && result.length > 0) {
            result.forEach(formatarNegociacao)

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.negociacao = result

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

// Listar o histórico de propostas de uma conversa
const listarNegociacaoConversa = async function (idConversa) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idConversa)) {
            message.ERROR_BAD_REQUEST.field = '[ID_CONVERSA] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await negociacaoDAO.selectNegociacaoByIdConversa(Number(idConversa))

            if (result && result.length > 0) {
                result.forEach(formatarNegociacao)

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.negociacao = result

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

// Buscar uma negociação pelo ID
const buscarNegociacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await negociacaoDAO.selectByIdNegociacao(Number(id))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.negociacao = formatarNegociacao(result[0])

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

// Excluir uma negociação pelo ID
const excluirNegociacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarNegociacao(id)

        if (resultBuscar.status_code == 200) {
            let result = await negociacaoDAO.deleteNegociacao(Number(id))

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
            return resultBuscar // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// DECIMAL vem como texto do mysql2: converte o valor para número
const formatarNegociacao = function (negociacao) {
    negociacao.valor = Number(negociacao.valor)

    return negociacao
}

// Limpa e converte os campos (conversa e usuário só existem no POST)
const normalizarDados = function (negociacao) {
    let dados = {
        valor: Number(String(negociacao.valor).trim()),
        status: (typeof negociacao.status === 'string') ? negociacao.status.trim().toLowerCase() : undefined
    }

    if (negociacao.id_conversa !== undefined) {
        dados.id_conversa = Number(negociacao.id_conversa)
    }

    if (negociacao.id_usuario !== undefined) {
        dados.id_usuario = Number(negociacao.id_usuario)
    }

    return dados
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
// ehPost = true: valida conversa e usuário (FK) e só aceita status "pendente"; ehPost = false (PUT): valor e status são obrigatórios
const validarDados = async function (negociacao, ehPost) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (negociacao === null || typeof negociacao !== 'object' || Array.isArray(negociacao)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (ehPost && !idValido(negociacao.id_conversa)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONVERSA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (ehPost && !idValido(negociacao.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!valorValido(negociacao.valor)) {
        message.ERROR_BAD_REQUEST.field = '[VALOR] INVÁLIDO (número maior que 0, com até 2 casas decimais)'
        return message.ERROR_BAD_REQUEST
    } else if (ehPost && negociacao.status !== undefined && negociacao.status !== null &&
        (typeof negociacao.status !== 'string' || negociacao.status.trim().toLowerCase() !== 'pendente')) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (uma nova proposta começa como "pendente")'
        return message.ERROR_BAD_REQUEST
    } else if (!ehPost && (typeof negociacao.status !== 'string' || !STATUS_PERMITIDOS.includes(negociacao.status.trim().toLowerCase()))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use "pendente", "aceita", "recusada" ou "cancelada")'
        return message.ERROR_BAD_REQUEST
    } else if (ehPost) {
        // FK: a conversa e o usuário precisam existir
        let conversa = await conversaDAO.selectByIdConversa(Number(negociacao.id_conversa))

        if (conversa === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (conversa.length == 0) {
            message.ERROR_BAD_REQUEST.field = '[ID_CONVERSA] NÃO EXISTE'
            return message.ERROR_BAD_REQUEST // 400
        }

        let usuario = await usuarioDAO.selectByIdUsuario(Number(negociacao.id_usuario))

        if (usuario === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (usuario.length == 0) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] NÃO EXISTE'
            return message.ERROR_BAD_REQUEST // 400
        }

        return false
    } else {
        return false
    }
}

module.exports = {
    inserirNovoNegociacao,
    atualizarNegociacao,
    listarNegociacao,
    listarNegociacaoConversa,
    buscarNegociacao,
    excluirNegociacao
}