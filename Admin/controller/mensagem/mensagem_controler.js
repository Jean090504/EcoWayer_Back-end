/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de mensagem
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const mensagemDAO = require('../../model/DAO/mensagem/mensagem.js')

// Controllers que fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerUsuario = require('../usuario/usuario_controler.js')     // buscarUsuario (o remetente é o usuário)
const controlerConversa = require('../conversa/conversa_controler.js')  // buscarConversa

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null)
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Na listagem, muitas mensagens são da mesma conversa e do mesmo usuário.
// O cache evita consultar a mesma conversa/usuário várias vezes na mesma requisição.
const buscarComCache = async function (cache, tipo, funcaoBuscar, id) {
    if (!cache[tipo]) {
        cache[tipo] = {}
    }

    if (cache[tipo][id] === undefined) {
        cache[tipo][id] = await buscarRelacionado(funcaoBuscar, id)
    }

    return cache[tipo][id]
}

// Troca os id_... pelos objetos relacionados e converte a coluna lida (TINYINT) em true/false
const montarMensagem = async function (mensagem, cache = {}) {
    let remetente = await buscarComCache(cache, 'usuario', controlerUsuario.buscarUsuario, mensagem.id_remetente)

    // Do remetente só vão o id e o nome (CPF e demais dados não entram na mensagem)
    mensagem.remetente = remetente ? { id: remetente.id, nome: remetente.nome } : null
    mensagem.conversa = await buscarComCache(cache, 'conversa', controlerConversa.buscarConversa, mensagem.id_conversa)
    mensagem.lida = Boolean(mensagem.lida)

    delete mensagem.id_remetente
    delete mensagem.id_conversa

    return mensagem
}

const inserirNovaMensagem = async function (mensagem, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(mensagem)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(mensagem)

                let idInserido = await mensagemDAO.insertMensagem(mensagem)

                if (idInserido) {
                    let criada = await mensagemDAO.selectByIdMensagem(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criada && criada.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarMensagem(criada[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, texto: mensagem.texto }
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

const atualizarMensagem = async function (mensagem, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarMensagem(id)

            if (resultID.status) {
                let validar = await validarDados(mensagem)

                if (!validar) {
                    normalizarDados(mensagem)
                    mensagem.id = Number(id)

                    let result = await mensagemDAO.updateMensagem(mensagem)

                    if (result) {
                        let atualizada = await mensagemDAO.selectByIdMensagem(mensagem.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizada && atualizada.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarMensagem(atualizada[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: mensagem.id, texto: mensagem.texto }
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

const listarMensagem = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await mensagemDAO.selectAllMensagem()

        if (result) {
            if (result.length > 0) {
                let cache = {}

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let mensagem of result) {
                    await montarMensagem(mensagem, cache)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.mensagem = result

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

const buscarMensagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await mensagemDAO.selectByIdMensagem(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.mensagem = await montarMensagem(result[0])

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

const excluirMensagem = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarMensagem(id)

        if (resultBuscarID.status) {
            let result = await mensagemDAO.deleteMensagem(id)

            if (result === 'EM_USO') {
                message.DEFAULT_MESSAGE.status = false
                message.DEFAULT_MESSAGE.status_code = 409
                message.DEFAULT_MESSAGE.message = 'Não é possível excluir: esta mensagem está sendo usada por outros registros.'

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
// envio e lida ficam null quando não enviados: o DAO usa COALESCE para tratar isso.
const normalizarDados = function (mensagem) {
    mensagem.texto = String(mensagem.texto).trim()
    mensagem.envio = (mensagem.envio === undefined || mensagem.envio === null || mensagem.envio === '') ? null : String(mensagem.envio).trim()
    mensagem.lida = (mensagem.lida === undefined || mensagem.lida === null) ? null : ((mensagem.lida === true || mensagem.lida === 1) ? 1 : 0)
    mensagem.id_conversa = Number(mensagem.id_conversa)
    mensagem.id_remetente = Number(mensagem.id_remetente)
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

const validarDados = async function (mensagem) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (mensagem.texto == undefined || mensagem.texto == null || String(mensagem.texto).trim() == '') {
        message.ERROR_BAD_REQUEST.field = "[TEXTO] INVÁLIDO (obrigatório)"
        return message.ERROR_BAD_REQUEST

    } else if (Buffer.byteLength(String(mensagem.texto), 'utf8') > 65535) {
        message.ERROR_BAD_REQUEST.field = "[TEXTO] INVÁLIDO (limite de 65535 bytes ultrapassado)"
        return message.ERROR_BAD_REQUEST

    } else if (mensagem.envio !== undefined && mensagem.envio !== null && mensagem.envio !== '' && !dataHoraValida(mensagem.envio)) {
        message.ERROR_BAD_REQUEST.field = "[ENVIO] INVÁLIDO (formato AAAA-MM-DD HH:MM:SS, ou não envie para usar a data e hora atuais)"
        return message.ERROR_BAD_REQUEST

    } else if (mensagem.lida !== undefined && mensagem.lida !== null && ![true, false, 0, 1].includes(mensagem.lida)) {
        message.ERROR_BAD_REQUEST.field = "[LIDA] INVÁLIDO (true, false, 1 ou 0)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(mensagem.id_conversa)) {
        message.ERROR_BAD_REQUEST.field = "[ID_CONVERSA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(mensagem.id_remetente)) {
        message.ERROR_BAD_REQUEST.field = "[ID_REMETENTE] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se a conversa e o remetente (usuário) existem (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerConversa.buscarConversa, mensagem.id_conversa)) {
            message.ERROR_BAD_REQUEST.field = "[ID_CONVERSA] não encontrada"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerUsuario.buscarUsuario, mensagem.id_remetente)) {
            message.ERROR_BAD_REQUEST.field = "[ID_REMETENTE] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovaMensagem,
    atualizarMensagem,
    listarMensagem,
    buscarMensagem,
    excluirMensagem,
    validarDados
}