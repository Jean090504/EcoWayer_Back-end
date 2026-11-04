/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de usuário
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const usuarioDAO = require('../../model/DAO/usuario/usuario.js')

// Controllers que já existem e fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerGenero = require('../genero/genero_controler.js')                    // buscarGenero
const controlerStatusUsuario = require('../status_usuario/status_usuario_controler.js') // buscarStatusUsuario
const controlerNivelImpacto = require('../nivel_impacto/nivel_impacto_controler.js')   // buscarNivelImpacto
const controlerImagem = require('../imagem/imagem_controler.js')                    // buscarImagem

// Chama o "buscar" de outro controller e devolve só o objeto encontrado (ou null).
// Pega o primeiro item de "response" seja qual for o nome da chave (genero, status_usuario...).
const buscarRelacionado = async function (funcaoBuscar, id) {
    let resultado = await funcaoBuscar(id)

    if (resultado && resultado.status) {
        let valor = Object.values(resultado.response)[0]

        return Array.isArray(valor) ? valor[0] : valor
    }

    return null
}

// Troca os id_... pelos objetos das tabelas relacionadas (data_cadastro segue na resposta)
const montarUsuario = async function (usuario) {
    usuario.genero = await buscarRelacionado(controlerGenero.buscarGenero, usuario.id_genero)
    usuario.status_usuario = await buscarRelacionado(controlerStatusUsuario.buscarStatusUsuario, usuario.id_status_usuario)
    usuario.nivel_impacto = await buscarRelacionado(controlerNivelImpacto.buscarNivelImpacto, usuario.id_nivel_impacto)
    usuario.imagem = await buscarRelacionado(controlerImagem.buscarImagem, usuario.id_imagem)

    delete usuario.id_genero
    delete usuario.id_status_usuario
    delete usuario.id_nivel_impacto
    delete usuario.id_imagem

    return usuario
}

const inserirNovoUsuario = async function (usuario, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(usuario)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(usuario)

                let idInserido = await usuarioDAO.insertUsuario(usuario)

                if (idInserido) {
                    let criado = await usuarioDAO.selectByIdUsuario(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await montarUsuario(criado[0])
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nome: usuario.nome }
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

const atualizarUsuario = async function (usuario, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarUsuario(id)

            if (resultID.status) {
                let validar = await validarDados(usuario)

                if (!validar) {
                    normalizarDados(usuario)
                    usuario.id = Number(id)

                    let result = await usuarioDAO.updateUsuario(usuario)

                    if (result) {
                        let atualizado = await usuarioDAO.selectByIdUsuario(usuario.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await montarUsuario(atualizado[0])
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: usuario.id, nome: usuario.nome }
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

const listarUsuario = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await usuarioDAO.selectAllUsuario()

        if (result) {
            if (result.length > 0) {
                // ids em ordem decrescente (ORDER BY do DAO)
                for (let usuario of result) {
                    await montarUsuario(usuario)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = result.length
                message.DEFAULT_MESSAGE.response.usuario = result

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

const buscarUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await usuarioDAO.selectByIdUsuario(id)

            if (result) {
                if (result.length > 0) {
                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.usuario = await montarUsuario(result[0])

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

// A exclusão dos filhos (tbl_acesso, tbl_anuncio) é feita em transação dentro do DAO
const excluirUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarUsuario(id)

        if (resultBuscarID.status) {
            let result = await usuarioDAO.deleteUsuario(id)

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
const normalizarDados = function (usuario) {
    usuario.nome = String(usuario.nome).trim()
    usuario.cpf = String(usuario.cpf).replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    usuario.id_imagem = Number(usuario.id_imagem)
    usuario.id_genero = Number(usuario.id_genero)
    usuario.id_status_usuario = Number(usuario.id_status_usuario)
    usuario.id_nivel_impacto = Number(usuario.id_nivel_impacto)
}

// Valida o CPF pelos dígitos verificadores (aceita com ou sem máscara)
const cpfValido = function (cpf) {
    let numeros = String(cpf).replace(/\D/g, '')

    if (numeros.length != 11 || /^(\d)\1{10}$/.test(numeros)) {
        return false
    }

    for (let tamanho = 9; tamanho <= 10; tamanho++) {
        let soma = 0

        for (let i = 0; i < tamanho; i++) {
            soma += Number(numeros[i]) * (tamanho + 1 - i)
        }

        let resto = (soma * 10) % 11
        if (resto == 10) resto = 0

        if (resto != Number(numeros[tamanho])) {
            return false
        }
    }

    return true
}

// Valida data no formato AAAA-MM-DD, existente e que não esteja no futuro
const dataValida = function (valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
        return false
    }

    let [ano, mes, dia] = String(valor).split('-').map(Number)
    let data = new Date(ano, mes - 1, dia)

    return data.getFullYear() == ano && data.getMonth() == mes - 1 && data.getDate() == dia && data <= new Date()
}

const idInvalido = function (valor) {
    return valor === undefined || valor === null || valor === '' || !Number.isInteger(Number(valor)) || Number(valor) <= 0
}

const validarDados = async function (usuario) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (usuario.nome == undefined || usuario.nome == null || String(usuario.nome).trim() == '' || String(usuario.nome).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (usuario.cpf == undefined || usuario.cpf == null || !cpfValido(usuario.cpf)) {
        message.ERROR_BAD_REQUEST.field = "[CPF] INVÁLIDO (11 dígitos válidos, com ou sem máscara)"
        return message.ERROR_BAD_REQUEST

    } else if (usuario.data_nascimento == undefined || usuario.data_nascimento == null || !dataValida(usuario.data_nascimento)) {
        message.ERROR_BAD_REQUEST.field = "[DATA_NASCIMENTO] INVÁLIDA (formato AAAA-MM-DD, não pode ser futura)"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(usuario.id_imagem)) {
        message.ERROR_BAD_REQUEST.field = "[ID_IMAGEM] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(usuario.id_genero)) {
        message.ERROR_BAD_REQUEST.field = "[ID_GENERO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(usuario.id_status_usuario)) {
        message.ERROR_BAD_REQUEST.field = "[ID_STATUS_USUARIO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (idInvalido(usuario.id_nivel_impacto)) {
        message.ERROR_BAD_REQUEST.field = "[ID_NIVEL_IMPACTO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se cada registro relacionado existe (evita erro de chave estrangeira)
        if (!await buscarRelacionado(controlerImagem.buscarImagem, usuario.id_imagem)) {
            message.ERROR_BAD_REQUEST.field = "[ID_IMAGEM] não encontrada"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerGenero.buscarGenero, usuario.id_genero)) {
            message.ERROR_BAD_REQUEST.field = "[ID_GENERO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerStatusUsuario.buscarStatusUsuario, usuario.id_status_usuario)) {
            message.ERROR_BAD_REQUEST.field = "[ID_STATUS_USUARIO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        if (!await buscarRelacionado(controlerNivelImpacto.buscarNivelImpacto, usuario.id_nivel_impacto)) {
            message.ERROR_BAD_REQUEST.field = "[ID_NIVEL_IMPACTO] não encontrado"
            return message.ERROR_BAD_REQUEST
        }

        return false
    }
}

module.exports = {
    inserirNovoUsuario,
    atualizarUsuario,
    listarUsuario,
    buscarUsuario,
    excluirUsuario,
    validarDados
}