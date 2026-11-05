/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            da relação entre Regra de Pontuação e Condição Item (usado só pelo controller de regra_pontuacao).
 *            Toda a lógica de condição da regra fica aqui; para conferir e montar a condição,
 *            chama o controller de condição item.
 *  Local: controller/regra_pontuacao/regra_pontuacao_condicao_controler.js
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const regraCondicaoDAO = require('../../model/DAO/regra_pontuacao_condicao/regra_pontuacao_condicao.js')

// CONFIRME o caminho e o nome da função exportada (module.exports) do controller de condição item
const controlerCondicaoItem = require('../condicao_item/condicao_item_controler.js') // buscarCondicaoItem

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

// DECIMAL(4,2): número finito, maior que 0, até 99.99 e no máximo 2 casas decimais
// (AJUSTE se o multiplicador puder ser 0)
const multiplicadorValido = (valor) => {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > 99.99) {
        return false
    }

    return Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6
}

const inserirNovaRegraCondicao = async function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let validar = validarDados(relacao)

        if (validar) {
            return validar // 400
        } else {
            let result = await regraCondicaoDAO.insertRegraPontuacaoCondicao(relacao)

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

// Busca os registros no DAO e monta cada condição completa chamando o controller de condição item
// Cada item volta com o multiplicador da relação: { ...condicao, multiplicador: 1.5 }
const buscarCondicoesIdRegra = async function (idRegra) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(idRegra)) {
            message.ERROR_BAD_REQUEST.field = '[ID_REGRA_PONTUACAO] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await regraCondicaoDAO.selectCondicoesByIdRegra(Number(idRegra))

            if (result && result.length > 0) {
                let condicoes = []

                for (let registro of result) {
                    let resultCondicao = await controlerCondicaoItem.buscarCondicaoItem(registro.id_condicao_item)

                    if (resultCondicao.status) {
                        // CONFIRME a chave da resposta do controller de condição item (response.condicao_item)
                        condicoes.push({
                            ...resultCondicao.response.condicao_item,
                            multiplicador: Number(registro.multiplicador)
                        })
                    }
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.condicao = condicoes

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

const excluirCondicoesIdRegra = async function (idRegra) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await regraCondicaoDAO.deleteCondicoesByIdRegra(idRegra)

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

// ---------------- Funções usadas pelo controller de regra_pontuacao ----------------

// Valida a lista "condicao" enviada na regra. Retorna false se está correta, ou o ERROR_BAD_REQUEST.
// Formato de cada item: { "id_condicao_item": 1, "multiplicador": 1.5 }
// Cada condição é conferida no controller de condição item (evita erro de chave estrangeira).
const validarListaCondicoes = async function (condicoes) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(condicoes)) {
        message.ERROR_BAD_REQUEST.field = '[CONDICAO] INVÁLIDO (envie uma lista, ex: [{ "id_condicao_item": 1, "multiplicador": 1.5 }])'
        return message.ERROR_BAD_REQUEST
    }

    let idsVistos = new Set()

    for (let item of condicoes) {
        if (item == null || typeof item !== 'object' || !idValido(item.id_condicao_item)) {
            message.ERROR_BAD_REQUEST.field = '[CONDICAO] cada item precisa de um id_condicao_item válido, ex: { "id_condicao_item": 1, "multiplicador": 1.5 }'
            return message.ERROR_BAD_REQUEST
        }

        if (!multiplicadorValido(item.multiplicador)) {
            message.ERROR_BAD_REQUEST.field = '[MULTIPLICADOR] INVÁLIDO (número maior que 0, até 99.99, com no máximo 2 casas decimais)'
            return message.ERROR_BAD_REQUEST
        }

        // Mesma condição repetida com multiplicadores diferentes seria ambíguo: recusa
        if (idsVistos.has(Number(item.id_condicao_item))) {
            message.ERROR_BAD_REQUEST.field = '[CONDICAO] id_condicao_item ' + item.id_condicao_item + ' repetido na lista'
            return message.ERROR_BAD_REQUEST
        }

        idsVistos.add(Number(item.id_condicao_item))

        let resultCondicao = await controlerCondicaoItem.buscarCondicaoItem(Number(item.id_condicao_item))

        if (!resultCondicao.status) {
            message.ERROR_BAD_REQUEST.field = '[CONDICAO] id_condicao_item ' + item.id_condicao_item + ' não encontrado'
            return message.ERROR_BAD_REQUEST
        }
    }

    return false
}

// Deixa só os campos permitidos, já convertidos para número (evita mass assignment)
const normalizarListaCondicoes = function (condicoes) {
    return condicoes.map(item => ({
        id_condicao_item: Number(item.id_condicao_item),
        multiplicador: Number(item.multiplicador)
    }))
}

// Grava os vínculos da regra com cada condição da lista (true se todos gravaram)
const inserirCondicoesDaRegra = async function (idRegra, condicoes) {
    for (let condicao of condicoes) {
        let resultRelacao = await inserirNovaRegraCondicao({
            id_regra_pontuacao: idRegra,
            id_condicao_item: condicao.id_condicao_item,
            multiplicador: condicao.multiplicador
        })

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

// Apaga os vínculos antigos e grava a lista nova (usado no PUT da regra)
const substituirCondicoesDaRegra = async function (idRegra, condicoes) {
    let resultDelete = await excluirCondicoesIdRegra(idRegra)

    if (!resultDelete.status) {
        return false
    }

    return await inserirCondicoesDaRegra(idRegra, condicoes)
}

// Busca as condições da regra e anexa no objeto (regra.condicao)
const anexarCondicoesARegra = async function (regra) {
    let resultCondicoes = await buscarCondicoesIdRegra(regra.id)

    regra.condicao = resultCondicoes.status ? resultCondicoes.response.condicao : []

    return regra
}

const validarDados = function (relacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (relacao === null || typeof relacao !== 'object' || Array.isArray(relacao)) {
        message.ERROR_BAD_REQUEST.field = '[BODY] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_regra_pontuacao)) {
        message.ERROR_BAD_REQUEST.field = '[ID_REGRA_PONTUACAO] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!idValido(relacao.id_condicao_item)) {
        message.ERROR_BAD_REQUEST.field = '[ID_CONDICAO_ITEM] INVÁLIDO'
        return message.ERROR_BAD_REQUEST
    } else if (!multiplicadorValido(relacao.multiplicador)) {
        message.ERROR_BAD_REQUEST.field = '[MULTIPLICADOR] INVÁLIDO (número maior que 0, até 99.99, com no máximo 2 casas decimais)'
        return message.ERROR_BAD_REQUEST
    } else {
        return false
    }
}

module.exports = {
    inserirNovaRegraCondicao,
    buscarCondicoesIdRegra,
    excluirCondicoesIdRegra,
    validarListaCondicoes,
    normalizarListaCondicoes,
    inserirCondicoesDaRegra,
    substituirCondicoesDaRegra,
    anexarCondicoesARegra
}