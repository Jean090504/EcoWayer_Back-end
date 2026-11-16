/***************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da tabela tbl_denuncias (denúncias feitas pelos usuários)
 *            e de seus vínculos com mensagens e imagens
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const configMessages = require('../modulo/configMessages.js')
const denunciasDAO = require('../../model/DAO/denuncias/denuncias.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// Lista de ids opcional: se vier, precisa ser array de inteiros > 0 (sem repetição)
const listaIdsValida = (lista) =>
    lista === undefined || lista === null ||
    (Array.isArray(lista) && lista.every(item => idValido(item)))

const normalizarLista = (lista) =>
    (lista === undefined || lista === null) ? [] : [...new Set(lista.map(item => Number(item)))]

// Devolve false se válido, ou a resposta de erro pronta (400 ou 500)
const validarVinculos = async function (denuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(denuncia.id_tipo_denuncias)) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_DENUNCIAS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let tipo = await denunciasDAO.selectExiste('tbl_tipo_denuncias', Number(denuncia.id_tipo_denuncias))
    if (tipo === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (tipo.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_TIPO_DENUNCIAS] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!idValido(denuncia.id_denunciante)) {
        message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIANTE] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }
    let usuario = await denunciasDAO.selectExiste('tbl_usuario', Number(denuncia.id_denunciante))
    if (usuario === false) return message.ERROR_INTERNAL_SEVER_MODEL
    if (usuario.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ID_DENUNCIANTE] NÃO EXISTE'
        return message.ERROR_BAD_REQUEST
    }

    if (!listaIdsValida(denuncia.mensagens)) {
        message.ERROR_BAD_REQUEST.field = '[MENSAGENS] INVÁLIDO (use uma lista de ids, ex.: [1, 2])'
        return message.ERROR_BAD_REQUEST
    }
    for (let idMensagem of normalizarLista(denuncia.mensagens)) {
        let existe = await denunciasDAO.selectExiste('tbl_mensagens', idMensagem)
        if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL
        if (existe.length == 0) {
            message.ERROR_BAD_REQUEST.field = `[MENSAGENS] O ID ${idMensagem} NÃO EXISTE`
            return message.ERROR_BAD_REQUEST
        }
    }

    if (!listaIdsValida(denuncia.imagens)) {
        message.ERROR_BAD_REQUEST.field = '[IMAGENS] INVÁLIDO (use uma lista de ids, ex.: [1, 2])'
        return message.ERROR_BAD_REQUEST
    }
    for (let idImagem of normalizarLista(denuncia.imagens)) {
        let existe = await denunciasDAO.selectExiste('tbl_imagem', idImagem)
        if (existe === false) return message.ERROR_INTERNAL_SEVER_MODEL
        if (existe.length == 0) {
            message.ERROR_BAD_REQUEST.field = `[IMAGENS] O ID ${idImagem} NÃO EXISTE`
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

const validarDados = function (denuncia) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!denuncia || typeof denuncia !== 'object') {
        message.ERROR_BAD_REQUEST.field = '[CORPO DA REQUISIÇÃO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    }

    let descricao = typeof denuncia.descricao === 'string' ? denuncia.descricao.trim() : ''

    if (descricao.length < 1) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] INVÁLIDA (não pode ser vazia)'
        return message.ERROR_BAD_REQUEST
    } else if (descricao.length > 65535) {
        message.ERROR_BAD_REQUEST.field = '[DESCRICAO] MUITO LONGA'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

const normalizarDados = function (denuncia) {
    return {
        descricao: denuncia.descricao.trim(),
        id_tipo_denuncias: Number(denuncia.id_tipo_denuncias),
        id_denunciante: Number(denuncia.id_denunciante),
        mensagens: normalizarLista(denuncia.mensagens),
        imagens: normalizarLista(denuncia.imagens)
    }
}

// Grava as relações com mensagens e imagens; devolve false no primeiro vínculo que falhar
const inserirVinculosDenuncia = async function (idDenuncia, dados) {
    for (let idMensagem of dados.mensagens) {
        if (!(await denunciasDAO.insertDenunciaMensagem(idDenuncia, idMensagem))) return false
    }
    for (let idImagem of dados.imagens) {
        if (!(await denunciasDAO.insertImagemDenuncia(idImagem, idDenuncia))) return false
    }
    return true
}

// Apaga as relações antes da denúncia (FK)
const excluirVinculosDenuncia = async function (idDenuncia) {
    let mensagens = await denunciasDAO.deleteDenunciaMensagensByIdDenuncia(idDenuncia)
    let imagens = await denunciasDAO.deleteImagemDenunciasByIdDenuncia(idDenuncia)
    return mensagens && imagens
}

const inserirNovaDenuncia = async function (denuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        let validar = validarDados(denuncia)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(denuncia)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(denuncia)
        let id = await denunciasDAO.insertDenuncia(dados)

        if (id) {
            let vinculosOk = await inserirVinculosDenuncia(id, dados)
            dados.id = id

            message.DEFAULT_MESSAGE.status = vinculosOk ? message.SUCCESS_CREATED_ITEM.status : message.SUCCESS_CREATED_WARNING.status
            message.DEFAULT_MESSAGE.status_code = vinculosOk ? message.SUCCESS_CREATED_ITEM.status_code : message.SUCCESS_CREATED_WARNING.status_code
            message.DEFAULT_MESSAGE.message = vinculosOk ? message.SUCCESS_CREATED_ITEM.message : message.SUCCESS_CREATED_WARNING.message
            message.DEFAULT_MESSAGE.response = { denuncia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const atualizarDenuncia = async function (id, denuncia, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() != "APPLICATION/JSON") {
            return message.ERROR_CONTENT_TYPE // 415
        }

        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await denunciasDAO.selectDenunciaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let validar = validarDados(denuncia)
        if (validar) return validar // 400

        let vinculos = await validarVinculos(denuncia)
        if (vinculos) return vinculos // 400 ou 500

        let dados = normalizarDados(denuncia)
        dados.id = Number(id)

        let result = await denunciasDAO.updateDenuncia(dados)

        if (result) {
            // os vínculos são regravados: apaga os antigos e insere os novos
            await excluirVinculosDenuncia(dados.id)
            let vinculosOk = await inserirVinculosDenuncia(dados.id, dados)

            message.DEFAULT_MESSAGE.status = vinculosOk ? message.SUCCESS_UPDETED_ITEM.status : message.SUCCESS_CREATED_WARNING.status
            message.DEFAULT_MESSAGE.status_code = vinculosOk ? message.SUCCESS_UPDETED_ITEM.status_code : message.SUCCESS_CREATED_WARNING.status_code
            message.DEFAULT_MESSAGE.message = vinculosOk ? message.SUCCESS_UPDETED_ITEM.message : message.SUCCESS_CREATED_WARNING.message
            message.DEFAULT_MESSAGE.response = { denuncia: dados }

            return message.DEFAULT_MESSAGE // 201
        } else {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

const listarDenuncias = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await denunciasDAO.selectAllDenuncias()

        if (result && result.length > 0) {
            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.denuncia = result

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

// Busca a denúncia com as mensagens e imagens vinculadas
const buscarDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let result = await denunciasDAO.selectDenunciaById(Number(id))

        if (result === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (result.length > 0) {
            let denuncia = result[0]
            denuncia.mensagens = await denunciasDAO.selectMensagensByIdDenuncia(Number(id)) || []
            denuncia.imagens = await denunciasDAO.selectImagensByIdDenuncia(Number(id)) || []

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.denuncia = denuncia

            return message.DEFAULT_MESSAGE // 200
        } else {
            return message.ERROR_NOT_FOUND // 404
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Exclusão só se a denúncia não estiver vinculada a moderação (alerta ou denúncia de anúncio)
const excluirDenuncia = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        }

        let existente = await denunciasDAO.selectDenunciaById(Number(id))

        if (existente === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existente.length == 0) {
            return message.ERROR_NOT_FOUND // 404
        }

        let dependencias = await denunciasDAO.countDependenciasDenuncia(Number(id))

        if (dependencias === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (dependencias > 0) {
            message.ERROR_BAD_REQUEST.field = '[ID] DENÚNCIA EM USO (vinculada a moderação ou alerta)'
            return message.ERROR_BAD_REQUEST // 400
        }

        // apaga primeiro as relações com mensagens e imagens (FK), depois a denúncia
        await excluirVinculosDenuncia(Number(id))

        let result = await denunciasDAO.deleteDenuncia(Number(id))

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

module.exports = {
    inserirNovaDenuncia,
    atualizarDenuncia,
    listarDenuncias,
    buscarDenuncia,
    excluirDenuncia
}