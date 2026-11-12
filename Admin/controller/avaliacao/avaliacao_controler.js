/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de avaliação
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const avaliacaoDAO = require('../../model/DAO/avaliacao/avaliacao.js')

// Controllers que fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerUsuario = require('../usuario/usuario_controler.js')   // buscarUsuario
const controlerEntrega = require('../entrega/entrega_controler.js')   // buscarEntrega

// Faixa de notas aceita (confirme a regra do seu projeto)
const NOTA_MINIMA = 1
const NOTA_MAXIMA = 5

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, vários registros repetem a mesma entrega e o mesmo usuário.
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

// Troca os id_... pelos objetos relacionados
const montarAvaliacao = async function (avaliacao, cache = {}) {
    let usuario = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, avaliacao.id_usuario)

    // Do usuário só vão o id e o nome (CPF e demais dados não entram na avaliação)
    avaliacao.usuario = usuario ? { id: usuario.id, nome: usuario.nome } : null
    avaliacao.entrega = await buscarComCache(cache, 'entrega', controlerEntrega.buscarEntrega, avaliacao.id_entrega)

    delete avaliacao.id_usuario
    delete avaliacao.id_entrega

    return avaliacao
}

const respostaAvaliacaoDuplicada = function (message) {
    message.DEFAULT_MESSAGE.status = false
    message.DEFAULT_MESSAGE.status_code = 409
    message.DEFAULT_MESSAGE.message = 'Este usuário já avaliou esta entrega.'

    return message.DEFAULT_MESSAGE // 409
}

const inserirNovaAvaliacao = async function (avaliacao, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(avaliacao)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(avaliacao)

                let idInserido = await avaliacaoDAO.insertAvaliacao(avaliacao)

                if (idInserido === 'DUPLICADA') {
                    return respostaAvaliacaoDuplicada(message) // 409
                } else if (idInserido) {
                    let criada = await avaliacaoDAO.selectByIdAvaliacao(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarAvaliacao(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nota: avaliacao.nota }
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

const atualizarAvaliacao = async function (avaliacao, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarAvaliacao(id)

            if (resultID.status) {
                let validar = await validarDados(avaliacao)

                if (!validar) {
                    normalizarDados(avaliacao)
                    avaliacao.id = Number(id)

                    let result = await avaliacaoDAO.updateAvaliacao(avaliacao)

                    if (result === 'DUPLICADA') {
                        return respostaAvaliacaoDuplicada(message) // 409
                    } else if (result) {
                        let atualizada = await avaliacaoDAO.selectByIdAvaliacao(avaliacao.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarAvaliacao(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: avaliacao.id, nota: avaliacao.nota }
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

const listarAvaliacao = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await avaliacaoDAO.selectAllAvaliacao()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let avaliacao of result) {
                    await montarAvaliacao(avaliacao, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.avaliacao = result

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

const buscarAvaliacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await avaliacaoDAO.selectByIdAvaliacao(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.avaliacao = await montarAvaliacao(result[0])

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

const excluirAvaliacao = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarAvaliacao(id)

        if (resultBuscarID.status) {
            let result = await avaliacaoDAO.deleteAvaliacao(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: esta avaliação está sendo usada por outros registros.'

                return message.DEFAULT_MESSAGE // 409
            } else if (result) {
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

// Padroniza os dados antes de gravar.
// comentario e data_avaliacao ficam null quando não enviados: o DAO usa COALESCE para a data.
const normalizarDados = function (avaliacao) {
    avaliacao.nota = Number(avaliacao.nota)
    avaliacao.comentario = (avaliacao.comentario === undefined || avaliacao.comentario === null || String(avaliacao.comentario).trim() === '') ? null : String(avaliacao.comentario).trim()
    avaliacao.data_avaliacao = (avaliacao.data_avaliacao === undefined || avaliacao.data_avaliacao === null || avaliacao.data_avaliacao === '') ? null : String(avaliacao.data_avaliacao).trim()
    avaliacao.id_entrega = Number(avaliacao.id_entrega)
    avaliacao.id_usuario = Number(avaliacao.id_usuario)
}

// Valida data e hora no formato AAAA-MM-DD HH:MM:SS, existentes
const dataHoraValida = function (valor) {
    let partes = String(valor).trim().match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)

    if (!partes) {
        return false
    }

    let [ano, mes, dia, hora, minuto, segundo] = partes.slice(1).map(Number)
    let data = new Date(ano, mes - 1, dia, hora, minuto, segundo)

    return data.getFullYear() == ano && data.getMonth() == mes - 1 && data.getDate() == dia &&
           data.getHours() == hora && data.getMinutes() == minuto && data.getSeconds() == segundo
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (avaliacao) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (avaliacao.nota === undefined || avaliacao.nota === null || avaliacao.nota === '' || !Number.isInteger(Number(avaliacao.nota)) || Number(avaliacao.nota) < NOTA_MINIMA || Number(avaliacao.nota) > NOTA_MAXIMA) {
        message.ERROR_BAD_REQUEST.field = "[NOTA] INVÁLIDA (número inteiro de " + NOTA_MINIMA + " a " + NOTA_MAXIMA + ")"
        return message.ERROR_BAD_REQUEST

    } else if (avaliacao.comentario !== undefined && avaliacao.comentario !== null && Buffer.byteLength(String(avaliacao.comentario), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = "[COMENTARIO] INVÁLIDO (limite de 65535 bytes ultrapassado)"
        return message.ERROR_BAD_REQUEST

    } else if (avaliacao.data_avaliacao !== undefined && avaliacao.data_avaliacao !== null && avaliacao.data_avaliacao !== '' && !dataHoraValida(avaliacao.data_avaliacao)) {
        message.ERROR_BAD_REQUEST.field = "[DATA_AVALIACAO] INVÁLIDA (formato AAAA-MM-DD HH:MM:SS, ou não envie para usar a data e hora atuais)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(avaliacao.id_entrega)) {
        message.ERROR_BAD_REQUEST.field = "[ID_ENTREGA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(avaliacao.id_usuario)) {
        message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se a entrega e o usuário existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerEntrega.buscarEntrega, avaliacao.id_entrega)) {
            message.ERROR_BAD_REQUEST.field = "[ID_ENTREGA] não encontrada"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, avaliacao.id_usuario)) {
            message.ERROR_BAD_REQUEST.field = "[ID_USUARIO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovaAvaliacao,
    atualizarAvaliacao,
    listarAvaliacao,
    buscarAvaliacao,
    excluirAvaliacao,
    validarDados
}