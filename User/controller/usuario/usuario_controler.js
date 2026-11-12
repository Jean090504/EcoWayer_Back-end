/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de usuário (com e-mail, telefone, conta e endereço como filhas)
 *  Autor: Maxwillian Santana
 *  Versão: 1.0
 **********************************************************************************************/

const bcrypt = require('bcrypt') // se o projeto usa bcryptjs, troque só o nome aqui (a API é a mesma)
const crypto = require('crypto')
const configMessages = require('../modulo/configMessages.js')
const usuarioDAO = require('../../model/DAO/usuario/usuario.js')

// Controllers que já existem e fornecem os dados das chaves estrangeiras.
// CONFIRME os caminhos e os nomes das funções exportadas (module.exports) de cada um.
const controlerGenero = require('../genero/genero_controler.js')                    // buscarGenero
const controlerStatusUsuario = require('../status_usuario/status_usuario_controler.js') // buscarStatusUsuario
const controlerNivelImpacto = require('../nivel_impacto/nivel_impacto_controler.js')   // buscarNivelImpacto
const controlerImagem = require('../imagem/imagem_controler.js')                    // buscarImagem

// Status que o usuário recebe ao se cadastrar (tbl_status_usuario.status)
const STATUS_PADRAO = 'ativo'

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

// Remove do JSON os campos que nunca podem sair na resposta
const limparUsuario = function (usuario) {
    delete usuario.senha
    delete usuario.codigo_email
    delete usuario.codigo_telefone

    return usuario
}

// Troca os id_... pelos objetos das tabelas relacionadas (data_cadastro segue na resposta)
const montarUsuario = async function (usuario) {
    limparUsuario(usuario)

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
            let validar = await validarDados(usuario, true)

            if (validar) {
                return validar // 400
            } else {
                let dados = tratarDados(usuario, true)

                let referencias = await validarReferencias(dados, true)

                if (referencias) {
                    return referencias // 400 ou 500
                }

                // cpf, e-mail e telefone não podem estar em uso
                let duplicados = await usuarioDAO.selectDuplicados(dados)

                if (duplicados === false) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                } else if (duplicados.length > 0) {
                    // usa o 409 se o ERROR_CONFLICT existir no configMessages; senão, cai no 400
                    let erro = message.ERROR_CONFLICT ? message.ERROR_CONFLICT : message.ERROR_BAD_REQUEST
                    erro.field = duplicados.map(item => '[' + item.campo.toUpperCase() + '] JÁ CADASTRADO').join(', ')
                    return erro
                }

                let padroes = await buscarPadroes(dados)

                if (!padroes) {
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }

                dados.id_status_usuario = padroes.id_status_usuario
                dados.id_nivel_impacto = padroes.id_nivel_impacto
                dados.id_imagem = padroes.id_imagem
                dados.senha = await bcrypt.hash(String(usuario.senha), 10)
                dados.codigo_email = gerarCodigo()
                dados.codigo_telefone = gerarCodigo()

                let result = await usuarioDAO.insertUsuario(dados)

                if (result) { // 201
                    // busca o usuário gravado para devolver o registro completo (com id, gênero, nível etc.)
                    let inserido = await buscarUsuario(result)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    message.DEFAULT_MESSAGE.response = {
                        usuario: inserido.status
                            ? inserido.response.usuario
                            : { id: result, nome: dados.nome, email: dados.email, telefone: dados.telefone }
                    }

                    return message.DEFAULT_MESSAGE
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
                let validar = await validarDados(usuario, false)

                if (!validar) {
                    let dados = tratarDados(usuario, false)
                    dados.id = Number(id)

                    let referencias = await validarReferencias(dados, false)

                    if (referencias) {
                        return referencias // 400 ou 500
                    }

                    let result = await usuarioDAO.updateUsuario(dados)

                    if (result) {
                        let atualizado = await buscarUsuario(id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        message.DEFAULT_MESSAGE.response = {
                            usuario: atualizado.status ? atualizado.response.usuario : { id: dados.id, nome: dados.nome }
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
                // troca os ids pelos objetos relacionados e remove senha/códigos de cada usuário
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
                    // endereços ficam dentro do usuário (tbl_endereco_usuario é filha, sem endpoint próprio)
                    let enderecos = await usuarioDAO.selectEnderecosByUsuario(id)

                    if (enderecos === false) {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }

                    // troca os ids pelos objetos relacionados e remove senha/códigos
                    let usuario = await montarUsuario(result[0])
                    usuario.enderecos = enderecos

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.usuario = usuario

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

// "Excluir" = desativar a conta (status 'desativado'); o histórico do usuário é preservado.
const excluirUsuario = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarUsuario(id)

        if (resultBuscarID.status) {
            let result = await usuarioDAO.desativarUsuario(id)

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

const temValor = function (valor) {
    return !(valor === undefined || valor === null || valor === '')
}

// código de 6 dígitos para as colunas codigo_verificacao (e-mail e telefone)
const gerarCodigo = function () {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

const validarCpf = function (cpf) {
    let numeros = String(cpf).replace(/\D/g, '')

    if (numeros.length != 11 || /^(\d)\1{10}$/.test(numeros)) {
        return false
    }

    let soma = 0
    for (let i = 0; i < 9; i++) {
        soma += Number(numeros[i]) * (10 - i)
    }
    let digito1 = (soma * 10) % 11
    if (digito1 == 10) digito1 = 0
    if (digito1 != Number(numeros[9])) {
        return false
    }

    soma = 0
    for (let i = 0; i < 10; i++) {
        soma += Number(numeros[i]) * (11 - i)
    }
    let digito2 = (soma * 10) % 11
    if (digito2 == 10) digito2 = 0

    return digito2 == Number(numeros[10])
}

// data no formato AAAA-MM-DD, existente no calendário, entre 1900 e hoje
const validarData = function (data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data))) {
        return false
    }

    let [ano, mes, dia] = String(data).split('-').map(Number)
    let d = new Date(Date.UTC(ano, mes - 1, dia))

    if (d.getUTCFullYear() != ano || d.getUTCMonth() != mes - 1 || d.getUTCDate() != dia) {
        return false
    }

    return ano >= 1900 && d.getTime() <= Date.now()
}

// Padroniza os dados depois de validados: CPF 000.000.000-00, telefone só com dígitos, e-mail em minúsculas.
const tratarDados = function (usuario, novoCadastro) {
    let dados = {
        nome: String(usuario.nome).trim(),
        data_nascimento: String(usuario.data_nascimento).trim(),
        id_genero: Number(usuario.id_genero),
        id_imagem: temValor(usuario.id_imagem) ? Number(usuario.id_imagem) : null
    }

    if (novoCadastro) {
        let cpf = String(usuario.cpf).replace(/\D/g, '')

        dados.cpf = cpf.slice(0, 3) + '.' + cpf.slice(3, 6) + '.' + cpf.slice(6, 9) + '-' + cpf.slice(9)
        dados.email = String(usuario.email).trim().toLowerCase()
        dados.telefone = String(usuario.telefone).replace(/\D/g, '')
        dados.id_endereco = Number(usuario.id_endereco)
    }

    return dados
}

// Confere se gênero, imagem e endereço informados existem (evita erro de chave estrangeira no banco).
const validarReferencias = async function (dados, novoCadastro) {
    let message = JSON.parse(JSON.stringify(configMessages))

    let checagens = [['tbl_genero', dados.id_genero, 'ID_GENERO']]

    if (dados.id_imagem) {
        checagens.push(['tbl_imagem', dados.id_imagem, 'ID_IMAGEM'])
    }

    if (novoCadastro) {
        checagens.push(['tbl_endereco', dados.id_endereco, 'ID_ENDERECO'])
    }

    for (let checagem of checagens) {
        let existe = await usuarioDAO.selectExisteId(checagem[0], checagem[1])

        if (existe === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existe == 0) {
            message.ERROR_BAD_REQUEST.field = '[' + checagem[2] + '] NÃO ENCONTRADO'
            return message.ERROR_BAD_REQUEST // 400
        }
    }

    return false
}

// Valores que o cadastro define sozinho: status 'ativo', nível inicial e imagem padrão (se não veio id_imagem).
const buscarPadroes = async function (dados) {
    let status = await usuarioDAO.selectIdStatusPorNome(STATUS_PADRAO)
    let nivel = await usuarioDAO.selectIdNivelInicial()
    let imagem = dados.id_imagem ? [{ id: dados.id_imagem }] : await usuarioDAO.selectIdImagemPadrao()

    if (!status || status.length == 0) {
        console.log('[USUARIO] Status "' + STATUS_PADRAO + '" não encontrado em tbl_status_usuario. Rode o seed_usuario.sql.')
        return false
    } else if (!nivel || nivel.length == 0) {
        console.log('[USUARIO] Nenhum nível em tbl_nivel_impacto. Rode o seed_usuario.sql.')
        return false
    } else if (!imagem || imagem.length == 0) {
        console.log('[USUARIO] Imagem padrão (tipo "perfil") não encontrada em tbl_imagem. Rode o seed_usuario.sql.')
        return false
    } else {
        return {
            id_status_usuario: status[0].id,
            id_nivel_impacto: nivel[0].id,
            id_imagem: imagem[0].id
        }
    }
}

// novoCadastro = true (POST): exige também cpf, email, telefone, senha e id_endereco.
// novoCadastro = false (PUT): só os campos de perfil (nome, data_nascimento, id_genero, id_imagem).
const validarDados = async function (usuario, novoCadastro) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!temValor(usuario.nome) || String(usuario.nome).trim().length < 2 || String(usuario.nome).trim().length > 255) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (2 a 255 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && (!temValor(usuario.cpf) || !validarCpf(usuario.cpf))) {
        message.ERROR_BAD_REQUEST.field = "[CPF] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(usuario.data_nascimento) || !validarData(usuario.data_nascimento)) {
        message.ERROR_BAD_REQUEST.field = "[DATA_NASCIMENTO] INVÁLIDA (formato AAAA-MM-DD, data passada)"
        return message.ERROR_BAD_REQUEST

    } else if (!temValor(usuario.id_genero) || isNaN(usuario.id_genero) || !Number.isInteger(Number(usuario.id_genero)) || Number(usuario.id_genero) < 1) {
        message.ERROR_BAD_REQUEST.field = "[ID_GENERO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && temValor(usuario.id_imagem) && (isNaN(usuario.id_imagem) || !Number.isInteger(Number(usuario.id_imagem)) || Number(usuario.id_imagem) < 1)) {
        message.ERROR_BAD_REQUEST.field = "[ID_IMAGEM] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!novoCadastro && (!temValor(usuario.id_imagem) || isNaN(usuario.id_imagem) || !Number.isInteger(Number(usuario.id_imagem)) || Number(usuario.id_imagem) < 1)) {
        message.ERROR_BAD_REQUEST.field = "[ID_IMAGEM] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && (!temValor(usuario.email) || String(usuario.email).trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(usuario.email).trim()))) {
        message.ERROR_BAD_REQUEST.field = "[EMAIL] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && (!temValor(usuario.telefone) || !/^\d{10,11}$/.test(String(usuario.telefone).replace(/\D/g, '')))) {
        message.ERROR_BAD_REQUEST.field = "[TELEFONE] INVÁLIDO (DDD + número, 10 ou 11 dígitos)"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && (!temValor(usuario.senha) || typeof usuario.senha != 'string' || usuario.senha.length < 8 || usuario.senha.length > 50 || !/[A-Z]/.test(usuario.senha) || !/[a-z]/.test(usuario.senha) || !/\d/.test(usuario.senha))) {
        message.ERROR_BAD_REQUEST.field = "[SENHA] INVÁLIDA (8 a 50 caracteres, com maiúscula, minúscula e número)"
        return message.ERROR_BAD_REQUEST

    } else if (novoCadastro && (!temValor(usuario.id_endereco) || isNaN(usuario.id_endereco) || !Number.isInteger(Number(usuario.id_endereco)) || Number(usuario.id_endereco) < 1)) {
        message.ERROR_BAD_REQUEST.field = "[ID_ENDERECO] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else {
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