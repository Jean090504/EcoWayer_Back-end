/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Alertas e Mensagens (usado só pelo controller de alertas).
 *            Para conferir e montar a mensagem, chama o controller de mensagem.
 *  Local: controller/alertas/alertas_mensagens_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const alertasMensagensDAO = require('../../model/DAO/alertas_mensagens/alertas_mensagens.js')

// CONFIRME o caminho e o nome da função exportada do controller de mensagem
const controlerMensagem = require('../mensagem/mensagem_controler.js') // buscarMensagem

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// Pega o objeto da resposta do controller de mensagem, sem depender do nome da chave
const extrairMensagem = (resultado) => {
    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

const inserirNovoAlertaMensagem = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await alertasMensagensDAO.insertAlertaMensagem(relacao)

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

// Busca os vínculos no DAO e monta cada mensagem completa chamando o controller de mensagem
const buscarMensagensIdAlerta = async function (idAlerta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idAlerta)) {
            message.ERROR_BAD_REQUEST.field = '[ID_ALERTAS] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await alertasMensagensDAO.selectMensagensByIdAlerta(Number(idAlerta))

            if (result && result.length > 0) {
                let mensagens = []

                for (let registro of result) {
                    let mensagem = extrairMensagem(await controlerMensagem.buscarMensagem(registro.id_mensagens))

                    if (mensagem) {
                        // a entrega pertence ao vínculo (alerta + mensagem), por isso vai junto
                        mensagens.push({ ...mensagem, id_entrega: registro.tbl_entrega_id })
                    }
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.mensagem = mensagens

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

const excluirMensagensIdAlerta = async function (idAlerta) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await alertasMensagensDAO.deleteMensagensByIdAlerta(idAlerta)

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

// ---------------- Funções usadas pelo controller de alertas ----------------

// Valida a lista "mensagem" enviada no alerta. Retorna false se está correta, ou o ERROR_BAD_REQUEST.
// Formato de cada item: { "id": 1, "id_entrega": 2 }  (id_entrega é opcional)
const validarListaMensagens = async function (mensagens) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(mensagens)) {
        message.ERROR_BAD_REQUEST.field = '[MENSAGEM] INVÁLIDO (envie uma lista, ex: [{ "id": 1, "id_entrega": 2 }])'
        return message.ERROR_BAD_REQUEST
    }

    for (let item of mensagens) {
        if (item == null || !idValido(item.id)) {
            message.ERROR_BAD_REQUEST.field = '[MENSAGEM] cada item precisa de um id válido, ex: { "id": 1 }'
            return message.ERROR_BAD_REQUEST
        }

        if (item.id_entrega !== undefined && item.id_entrega !== null && !idValido(item.id_entrega)) {
            message.ERROR_BAD_REQUEST.field = '[MENSAGEM] id_entrega INVÁLIDO (número)'
            return message.ERROR_BAD_REQUEST
        }

        if (!extrairMensagem(await controlerMensagem.buscarMensagem(Number(item.id)))) {
            message.ERROR_BAD_REQUEST.field = '[MENSAGEM] id ' + item.id + ' não encontrado'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

// Remove mensagens repetidas (mantém a primeira) e padroniza os tipos
const normalizarListaMensagens = function (mensagens) {
    let vistos = new Set()
    let lista = []

    for (let item of mensagens) {
        let id = Number(item.id)

        if (!vistos.has(id)) {
            vistos.add(id)
            lista.push({
                id: id,
                id_entrega: idValido(item.id_entrega) ? Number(item.id_entrega) : null
            })
        }
    }

    return lista
}

// Grava os vínculos do alerta com cada mensagem da lista (true se todos gravaram)
const inserirMensagensDoAlerta = async function (idAlerta, mensagens) {
    for (let mensagem of mensagens) {
        let resultRelacao = await inserirNovoAlertaMensagem({
            id_alertas: idAlerta,
            id_mensagens: mensagem.id,
            id_entrega: mensagem.id_entrega
        })

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

// Apaga os vínculos antigos e grava a lista nova (usado no PUT do alerta)
const substituirMensagensDoAlerta = async function (idAlerta, mensagens) {
    let resultDelete = await excluirMensagensIdAlerta(idAlerta)

    if (!resultDelete.status) {
        return false
    }

    return await inserirMensagensDoAlerta(idAlerta, mensagens)
}

// Busca as mensagens do alerta e anexa no objeto (alerta.mensagem)
const anexarMensagensAoAlerta = async function (alerta) {
    let resultMensagens = await buscarMensagensIdAlerta(alerta.id)

    alerta.mensagem = resultMensagens.status ? resultMensagens.response.mensagem : []

    return alerta
}

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!idValido(relacao.id_alertas)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ALERTAS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_mensagens)) {
        message.ERROR_BAD_REQUEST.field = '[ID_MENSAGENS] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (relacao.id_entrega != null && !idValido(relacao.id_entrega)) {
        message.ERROR_BAD_REQUEST.field = '[ID_ENTREGA] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovoAlertaMensagem,
    buscarMensagensIdAlerta,
    excluirMensagensIdAlerta,
    validarListaMensagens,
    normalizarListaMensagens,
    inserirMensagensDoAlerta,
    substituirMensagensDoAlerta,
    anexarMensagensAoAlerta
}