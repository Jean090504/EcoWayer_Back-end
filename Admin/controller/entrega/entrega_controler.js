/***********************************************************************************************
 *  Objetivo: Validação, tratamento e manipulação de dados para o CRUD de entrega
 *  Local: controller/entrega/entrega_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const entregaDAO = require('../../model/DAO/entrega/entrega.js')

// CONFIRME os caminhos e os nomes exportados
const controlerAnuncio = require('../anuncio/anuncio_controler.js') // buscarAnuncio
const controlerUsuario = require('../usuario/usuario_controler.js') // buscarUsuario

// ATENÇÃO: troque pelos valores reais do ENUM
// (rode: SHOW COLUMNS FROM tbl_entrega LIKE 'status';)
const STATUS_VALIDOS = ['PENDENTE', 'EM_ROTA', 'ENTREGUE', 'CANCELADA']

// Limite do DECIMAL(10,2) (ajuste se a sua coluna for diferente)
const PESO_MAXIMO = 99999999.99

const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca id_anuncio e id_usuario pelos objetos correspondentes
const montarEntrega = async function (entrega, cache = {}) {
    entrega.anuncio = await buscarComCache(cache, 'anuncio', controlerAnuncio.buscarAnuncio, entrega.id_anuncio)
    entrega.usuario = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, entrega.id_usuario)

    delete entrega.id_anuncio
    delete entrega.id_usuario

    return entrega
}

const inserirNovaEntrega = async function (entrega, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let validar = await validarDados(entrega, true)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(entrega)

                let idInserido = await entregaDAO.insertEntrega(entrega)

                if (idInserido) {
                    let criada = await entregaDAO.selectByIdEntrega(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarEntrega(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, status: entrega.status }
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

const atualizarEntrega = async function (entrega, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await verificarExistencia(id)

            if (resultID.status) {
                let validar = await validarDados(entrega, false)

                if (!validar) {
                    normalizarDados(entrega)
                    entrega.id = Number(id)

                    let result = await entregaDAO.updateEntrega(entrega)

                    if (result) {
                        let atualizada = await entregaDAO.selectByIdEntrega(entrega.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarEntrega(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: entrega.id, status: entrega.status }
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

const listarEntregas = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await entregaDAO.selectAllEntregas()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                for (let entrega of result) {
                    await montarEntrega(entrega, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.entregas = result

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

const buscarEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await entregaDAO.selectByIdEntrega(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.entrega = await montarEntrega(result[0])

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

// Só confere se o id é válido e existe (sem montar anúncio/usuário)
const verificarExistencia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (id == undefined || id == '' || id == null || isNaN(id)) {
        message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
        return message.ERROR_BAD_REQUEST
    }

    let result = await entregaDAO.selectByIdEntrega(id)

    if (!result) {
        return message.ERROR_INTERNAL_SEVER_MODEL
    }

    if (result.length == 0) {
        return message.ERROR_NOT_FOUND
    }

    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
    return message.DEFAULT_MESSAGE
}

const excluirEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await verificarExistencia(id)

        if (resultBuscarID.status) {
            let result = await entregaDAO.deleteEntrega(id)

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

// Converte qualquer data válida para 'YYYY-MM-DD HH:MM:SS' (formato do DATETIME)
const formatarDataHora = function (valor) {
    let d = new Date(valor)
    let p = (n) => String(n).padStart(2, '0')

    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const normalizarDados = function (entrega) {
    entrega.peso_estimado = Number(entrega.peso_estimado)
    entrega.status = String(entrega.status)
    entrega.data_entrega = formatarDataHora(entrega.data_entrega)

    if (entrega.id_anuncio !== undefined) {
        entrega.id_anuncio = Number(entrega.id_anuncio)
    }

    if (entrega.id_usuario !== undefined) {
        entrega.id_usuario = Number(entrega.id_usuario)
    }
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Retorna false se os dados estão corretos, ou o ERROR_BAD_REQUEST indicando o campo inválido.
// "inserir" = true exige id_anuncio e id_usuario; na atualização eles não são alterados.
const validarDados = async function (entrega, inserir) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let peso = Number(entrega.peso_estimado)

    if (entrega.peso_estimado === undefined || entrega.peso_estimado === null || entrega.peso_estimado === '' || !Number.isFinite(peso) || peso <= 0 || peso > PESO_MAXIMO) {
        message.ERROR_BAD_REQUEST.field = '[PESO_ESTIMADO] INVÁLIDO (obrigatório, número maior que zero)'
        return message.ERROR_BAD_REQUEST

    } else if (entrega.status == undefined || entrega.status == null || !STATUS_VALIDOS.includes(String(entrega.status))) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (valores aceitos: ' + STATUS_VALIDOS.join(', ') + ')'
        return message.ERROR_BAD_REQUEST

    } else if (entrega.data_entrega == undefined || entrega.data_entrega == null || entrega.data_entrega === '' || isNaN(new Date(entrega.data_entrega).getTime())) {
        message.ERROR_BAD_REQUEST.field = '[DATA_ENTREGA] INVÁLIDA (obrigatória, ex: 2026-10-25T14:30:00)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(entrega.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else if (inserir && idInvalido(entrega.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO (obrigatório, número)'
        return message.ERROR_BAD_REQUEST

    } else {
        if (inserir && !await buscarRelacionado(controlerAnuncio.buscarAnuncio, entrega.id_anuncio)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        if (inserir && !await buscarRelacionado(controlerUsuario.buscarUsuario, entrega.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] não encontrado'
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovaEntrega,
    atualizarEntrega,
    listarEntregas,
    buscarEntrega,
    excluirEntrega,
    validarDados
}