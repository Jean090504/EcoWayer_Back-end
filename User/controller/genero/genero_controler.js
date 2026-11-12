/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            do Gênero
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const generoDAO = require('../../model/DAO/genero/genero.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Inserir um novo gênero
const inserirNovoGenero = async function (genero, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = validarDados(genero)

            if (validar) {
                return validar // 400
            } else {
                let dados = { nome: genero.nome.trim(), sigla: genero.sigla.trim() }

                let duplicado = await verificarDuplicidade(dados)

                if (duplicado) {
                    return duplicado // 400 ou 500
                } else {
                    let result = await generoDAO.insertGenero(dados)

                    if (result) {
                        message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                        message.DEFAULT_MESSAGE.response = { genero: { id: Number(result), nome: dados.nome, sigla: dados.sigla } }

                        return message.DEFAULT_MESSAGE // 201
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
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

// Atualizar um gênero pelo ID
const atualizarGenero = async function (genero, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarGenero(id)

            if (resultBuscar.status_code == 200) {
                let validar = validarDados(genero)

                if (validar) {
                    return validar // 400
                } else {
                    let dados = { id: Number(id), nome: genero.nome.trim(), sigla: genero.sigla.trim() }

                    let duplicado = await verificarDuplicidade(dados, dados.id)

                    if (duplicado) {
                        return duplicado // 400 ou 500
                    } else {
                        let result = await generoDAO.updateGenero(dados)

                        if (result) {
                            message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                            message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                            message.DEFAULT_MESSAGE.response = { genero: dados }

                            return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                        } else {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
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

// Listar todos os gêneros
const listarGenero = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await generoDAO.selectAllGenero()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.genero = result

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

// Buscar um gênero pelo ID
const buscarGenero = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await generoDAO.selectByIdGenero(Number(id))

            if (result && result.length > 0) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.genero = result[0]

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

// Excluir um gênero pelo ID
const excluirGenero = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarGenero(id)

        if (resultBuscar.status_code == 200) {
            // FK: não deixa estourar erro do banco se ainda existem usuários com este gênero
            let emUso = await generoDAO.countUsuarioByIdGenero(Number(id))

            if (emUso === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (emUso > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] EM USO: existem usuários vinculados a este gênero'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let result = await generoDAO.deleteGenero(Number(id))

                if (result) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
                    message.DEFAULT_MESSAGE.response = { id: Number(id) }

                    return message.DEFAULT_MESSAGE // 200
                } else {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscar // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// nome e sigla são UNIQUE no banco: confere antes de gravar para devolver 400 em vez de erro do banco
// idIgnorar: no PUT, o próprio registro não conta como duplicado
const verificarDuplicidade = async function (genero, idIgnorar) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let porNome = await generoDAO.selectByNomeGenero(genero.nome)

    if (porNome === false) {
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } else if (porNome.some(item => item.id !== idIgnorar)) {
        message.ERROR_BAD_REQUEST.field = '[NOME] JÁ CADASTRADO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let porSigla = await generoDAO.selectBySiglaGenero(genero.sigla)

    if (porSigla === false) {
        return message.ERROR_INTERNAL_SEVER_MODEL // 500
    } else if (porSigla.some(item => item.id !== idIgnorar)) {
        message.ERROR_BAD_REQUEST.field = '[SIGLA] JÁ CADASTRADA'
        return message.ERROR_BAD_REQUEST // 400
    }

    return false
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
const validarDados = function (genero) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (genero === null || typeof genero !== 'object' || Array.isArray(genero)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (typeof genero.nome !== 'string' || genero.nome.trim() == '' || genero.nome.trim().length > 50) {
        message.ERROR_BAD_REQUEST.field = '[NOME] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (typeof genero.sigla !== 'string' || genero.sigla.trim() == '' || genero.sigla.trim().length > 5) {
        message.ERROR_BAD_REQUEST.field = '[SIGLA] INVÁLIDA'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoGenero,
    atualizarGenero,
    listarGenero,
    buscarGenero,
    excluirGenero
}