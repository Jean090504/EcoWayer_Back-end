/***************************************************************
 *  Objetivo: Arquivo responsavel pela manipulação de dados
 *            da tabela tbl_entrega no banco de dados
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const knex = require('knex')
const knexConfig = require('../../database_config_knex/knexFile.js')
const knexConex = knex(knexConfig.development)

const insertEntrega = async function (entrega) {
    try {
        let sql = `insert into tbl_entrega (peso_estimado, status, data_entrega, id_anuncio, id_usuario)
                   values (?, ?, ?, ?, ?)`

        let result = await knexConex.raw(sql, [
            entrega.peso_estimado,
            entrega.status,
            entrega.data_entrega,
            entrega.id_anuncio,
            entrega.id_usuario
        ])

        if (result)
            return result[0].insertId // insertId do registro criado
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const updateEntrega = async function (entrega) {
    try {
        let sql = `update tbl_entrega
                      set peso_estimado = ?,
                          status = ?,
                          data_entrega = ?,
                          id_anuncio = ?,
                          id_usuario = ?
                    where id = ?`

        let result = await knexConex.raw(sql, [
            entrega.peso_estimado,
            entrega.status,
            entrega.data_entrega,
            entrega.id_anuncio,
            entrega.id_usuario,
            entrega.id
        ])

        if (result)
            return true
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectAllEntregas = async function () {
    try {
        let sql = `select * from tbl_entrega order by id`

        let result = await knexConex.raw(sql)

        if (result)
            return result[0] // array de entregas
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const selectEntregaById = async function (id) {
    try {
        let sql = `select * from tbl_entrega where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return result[0] // array com a entrega encontrada (vazio se não existir)
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

const deleteEntrega = async function (id) {
    try {
        let sql = `delete from tbl_entrega where id = ?`

        let result = await knexConex.raw(sql, [id])

        if (result)
            return true
        else
            return false
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    insertEntrega,
    updateEntrega,
    selectAllEntregas,
    selectEntregaById,
    deleteEntrega
}

const STATUS_VALIDOS = ['pendente', 'concluida', 'cancelada']
const REGEX_DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const dataValida = (data) => {
    if (typeof data !== 'string' || !REGEX_DATA.test(data.trim())) return false
    return !isNaN(new Date(data.trim().replace(' ', 'T')).getTime())
}

const pesoValido = (peso) => {
    let valor = Number(peso)
    return typeof peso !== 'boolean' && peso !== null && peso !== '' && Number.isFinite(valor) && valor > 0
}

const inserirNovaEntrega = async function (entrega, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(entrega)

        if (validar) {
            return validar // 400
        } else {
            let entregaNormalizada = normalizarDados(entrega)
            let id = await entregaDAO.insertEntrega(entregaNormalizada)

            if (id) {
                entregaNormalizada.id = id

                message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message
                message.DEFAULT_MESSAGE.response = { entrega: entregaNormalizada }

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

const atualizarEntrega = async function (id, entrega, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await entregaDAO.selectEntregaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(entrega)

        if (validar) {
            return validar // 400
        } else {
            let entregaNormalizada = normalizarDados(entrega)
            entregaNormalizada.id = Number(id)

            let result = await entregaDAO.updateEntrega(entregaNormalizada)

            if (result) {
                message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message
                message.DEFAULT_MESSAGE.response = { entrega: entregaNormalizada }

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

const listarEntregas = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await entregaDAO.selectAllEntregas()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.entrega = result

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

const buscarEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await entregaDAO.selectEntregaById(Number(id))

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.entrega = result[0]

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

const excluirEntrega = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await entregaDAO.selectEntregaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (!existente || existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let result = await entregaDAO.deleteEntrega(Number(id))

        if (result) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_DELETED_ITEM.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_DELETED_ITEM.status_code
            message.DEFAULT_MESSAGE.message = message.SUCCESS_DELETED_ITEM.message
            message.DEFAULT_MESSAGE.response = { id: Number(id) }

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const validarDados = function (entrega) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!entrega || typeof entrega !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    }

    let status = typeof entrega.status === 'string' ? entrega.status.trim() : ''

    if (!pesoValido(entrega.peso_estimado)) {
        message.ERROR_BAD_REQUEST.field = '[PESO_ESTIMADO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!STATUS_VALIDOS.includes(status)) {
        message.ERROR_BAD_REQUEST.field = '[STATUS] INVÁLIDO (use pendente, concluida ou cancelada)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!dataValida(entrega.data_entrega)) {
        message.ERROR_BAD_REQUEST.field = '[DATA_ENTREGA] INVÁLIDA (use YYYY-MM-DD HH:MM:SS)'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(entrega.id_anuncio)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ANUNCIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else if (!idValido(entrega.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = '[ID_USUARIO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST // 400
    } else {
        return false
    }
}

const normalizarDados = function (entrega) {
    return {
        peso_estimado: Number(entrega.peso_estimado),
        status: entrega.status.trim(),
        data_entrega: entrega.data_entrega.trim(),
        id_anuncio: Number(entrega.id_anuncio),
        id_usuario: Number(entrega.id_usuario)
    }
}

module.exports = {
    inserirNovaEntrega,
    atualizarEntrega,
    listarEntregas,
    buscarEntrega,
    excluirEntrega,
    selectEntregaById
}