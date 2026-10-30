/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de acesso
 *  Local: controller/acesso/acesso_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const acessoDAO = require('../../model/DAO/acesso/acesso.js')

// Controller que já existe e fornece os dados da chave estrangeira.
// CONFIRME o caminho e o nome da função exportada (module.exports).
const controlerUsuario = require('../usuario/usuario_controler.js') // buscarUsuario

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem o mesmo usuário.
// O cache evita consultar o mesmo registro várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Converte Date do MySQL para 'YYYY-MM-DD'
const formatarData = function (data) {
    if (data instanceof Date && !isNaN(data.getTime())) {
        let ano = data.getFullYear()
        let mes = String(data.getMonth() + 1).padStart(2, '0')
        let dia = String(data.getDate()).padStart(2, '0')

        return `${ano}-${mes}-${dia}`
    }

    return data
}

// Troca id_usuario pelo objeto do usuário e formata a data
const montarAcesso = async function (acesso, cache = {}) {
    acesso.usuario = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, acesso.id_usuario)
    acesso.data_acesso = formatarData(acesso.data_acesso)

    delete acesso.id_usuario

    return acesso
}

const inserirNovoAcesso = async function (acesso, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(acesso)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(acesso)

                let idInserido = await acessoDAO.insertAcesso(acesso)

                if (idInserido) {
                    let criado = await acessoDAO.selectByIdAcesso(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarAcesso(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, id_usuario: acesso.id_usuario, data_acesso: acesso.data_acesso }
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

const atualizarAcesso = async function (acesso, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarAcesso(id)

            if (resultID.status) {
                let validar = await validarDados(acesso)

                if (!validar) {
                    normalizarDados(acesso)
                    acesso.id = Number(id)

                    let result = await acessoDAO.updateAcesso(acesso)

                    if (result) {
                        let atualizado = await acessoDAO.selectByIdAcesso(acesso.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarAcesso(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: acesso.id, id_usuario: acesso.id_usuario, data_acesso: acesso.data_acesso }
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

const listarAcesso = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await acessoDAO.selectAllAcesso()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                for (let acesso of result) {
                    await montarAcesso(acesso, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.acessos = result

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

const buscarAcesso = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await acessoDAO.selectByIdAcesso(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.acesso = await montarAcesso(result[0])

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

const excluirAcesso = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarAcesso(id)

        if (resultBuscarID.status) {
            let result = await acessoDAO.deleteAcesso(id)

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
const normalizarDados = function (acesso) {
    acesso.id_usuario = Number(acesso.id_usuario)
    acesso.data_acesso = String(acesso.data_acesso).trim()
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Confere se a string é uma data real no formato YYYY-MM-DD
const dataInvalida = function (valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor.trim())) {
        return true
    }

    let data = new Date(valor.trim() + 'T00:00:00Z')

    return isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor.trim()
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
const validarDados = async function (acesso) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (idInvalido(acesso.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else if (dataInvalida(acesso.data_acesso)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_ACESSO] INVÁLIDA (obrigatória, formato YYYY-MM-DD)'
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se o usuário existe (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, acesso.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoAcesso,
    atualizarAcesso,
    listarAcesso,
    buscarAcesso,
    excluirAcesso,
    validarDados
}