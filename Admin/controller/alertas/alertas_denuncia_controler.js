/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Alertas e Denúncias (usado só pelo controller de alertas)
 *  Local: controller/alertas/alertas_denuncia_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const alertasDenunciaDAO = require('../../model/DAO/alertas_denuncia/alertas_denuncia.js')
const denunciaDAO = require('../../model/DAO/denuncia/denuncia.js')
const controlerDenuncia = require('../denuncia/denuncia_controler.js') // buscarDenuncia

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

// Busca as denúncias do alerta e anexa em alerta.denuncia (lista vazia quando não há nenhuma).
// Cada denúncia vai resumida (sem a lista de mensagens), para a resposta do alerta não ficar pesada.
const anexarDenunciasAoAlerta = async function (alerta) {
    let ids = await alertasDenunciaDAO.selectIdsDenunciasByIdAlerta(alerta.id)
    let denuncias = []

    if (ids && ids.length > 0) {
        for (let item of ids) {
            let resultDenuncia = await controlerDenuncia.buscarDenuncia(item.id_denuncias)

            if (resultDenuncia.status) {
                let denuncia = resultDenuncia.response.denuncia

                denuncias.push({
                    id: denuncia.id,
                    descricao: denuncia.descricao,
                    denunciante: denuncia.denunciante,
                    tipo_denuncia: denuncia.tipo_denuncia
                })
            }
        }
    }

    alerta.denuncia = denuncias

    return alerta
}

// Grava os vínculos do alerta com cada denúncia da lista (true = todos gravados)
const inserirDenunciasDoAlerta = async function (idAlerta, denuncias) {
    for (let item of denuncias) {
        let gravou = await alertasDenunciaDAO.insertAlertaDenuncia({
            id_alertas: idAlerta,
            id_denuncias: item.id
        })

        if (!gravou) {
            return false
        }
    }

    return true
}

// Apaga os vínculos e grava a lista nova. Se a gravação falhar, devolve os vínculos que existiam.
const substituirDenunciasDoAlerta = async function (idAlerta, denuncias) {
    let idsAtuais = await alertasDenunciaDAO.selectIdsDenunciasByIdAlerta(idAlerta)
    let atuais = Array.isArray(idsAtuais) ? idsAtuais.map(item => ({ id: item.id_denuncias })) : []

    let apagou = await alertasDenunciaDAO.deleteDenunciasByIdAlerta(idAlerta)

    if (!apagou) {
        return false
    }

    let gravou = await inserirDenunciasDoAlerta(idAlerta, denuncias)

    if (!gravou) {
        await alertasDenunciaDAO.deleteDenunciasByIdAlerta(idAlerta)
        await inserirDenunciasDoAlerta(idAlerta, atuais)

        return false
    }

    return true
}

const excluirDenunciasIdAlerta = async function (idAlerta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await alertasDenunciaDAO.deleteDenunciasByIdAlerta(idAlerta)

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

// Remove ids repetidos da lista e deixa cada item no formato { id: número }
const normalizarListaDenuncias = function (lista) {
    let ids = [...new Set(lista.map(item => Number(item.id)))]

    return ids.map(id => ({ id: id }))
}

// Retorna false se a lista está correta, ou o ERROR_BAD_REQUEST indicando o problema
const validarListaDenuncias = async function (lista) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(lista)) {
        message.ERROR_BAD_REQUEST.field = '[DENUNCIA] INVÁLIDA (envie uma lista, ex: [{ "id": 1 }], ou [] para nenhuma)'
        return message.ERROR_BAD_REQUEST
    }

    for (let item of lista) {
        if (item == null || idInvalido(item.id)) {
            message.ERROR_BAD_REQUEST.field = '[DENUNCIA] cada item precisa de um id válido, ex: { "id": 1 }'
            return message.ERROR_BAD_REQUEST
        }

        let denunciaEncontrada = await denunciaDAO.selectByIdDenuncia(item.id)

        if (!denunciaEncontrada || denunciaEncontrada.length == 0) {
            message.ERROR_BAD_REQUEST.field = '[DENUNCIA] id ' + item.id + ' não encontrada'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

module.exports = {
    anexarDenunciasAoAlerta,
    inserirDenunciasDoAlerta,
    substituirDenunciasDoAlerta,
    excluirDenunciasIdAlerta,
    normalizarListaDenuncias,
    validarListaDenuncias
}