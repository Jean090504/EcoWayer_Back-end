/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            do Ponto de Coleta (e dos endereços e materiais aceitos vinculados a ele)
 *  Autor: [SEU NOME]
 *  Versão: 1.0
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pontoColetaDAO = require('../../model/DAO/ponto_coleta/ponto_coleta.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const enderecoDAO = require('../../model/DAO/endereco/endereco.js')
const materialAceitoDAO = require('../../model/DAO/material_aceito/material_aceito.js')
const controllerEnderecoPontoColeta = require('../endereco_ponto_coleta/endereco_ponto_coleta_controler.js')
const controllerMaterialAceitoPontoColeta = require('../ponto_coleta_material_aceito/ponto_coleta_material_aceito_controler.js')

const idValido = (id) =>
    /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id) > 0

const vazio = (valor) =>
    valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() == '')

// latitude (limite 90) e longitude (limite 180): vazio é aceito (colunas NULL)
const coordenadaValida = (valor, limite) => {
    if (vazio(valor)) {
        return true
    } else if (typeof valor !== 'number' && typeof valor !== 'string') {
        return false
    } else {
        let numero = Number(valor)
        return Number.isFinite(numero) && Math.abs(numero) <= limite
    }
}

// Inserir um novo ponto de coleta (com endereços e materiais aceitos)
const inserirNovoPontoColeta = async function (ponto, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(ponto)

            if (validar) {
                return validar // 400 ou 500
            } else {
                let dados = normalizarDados(ponto)
                let idPonto = await pontoColetaDAO.insertPontoColeta(dados)

                if (idPonto) {
                    let enderecosOk = await inserirEnderecosDoPonto(idPonto, dados.endereco)
                    let materiaisOk = await inserirMateriaisDoPonto(idPonto, dados.material_aceito)
                    let pontoCriado = await buscarPontoColetaCompleto(idPonto)

                    if (pontoCriado) {
                        let sucesso = (enderecosOk && materiaisOk) ? message.SUCCESS_CREATED_ITEM : message.SUCCESS_CREATED_WARNING

                        message.DEFAULT_MESSAGE.status = sucesso.status
                        message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                        message.DEFAULT_MESSAGE.message = sucesso.message
                        message.DEFAULT_MESSAGE.response = { ponto_coleta: pontoCriado }

                        return message.DEFAULT_MESSAGE // 201
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
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

// Atualizar um ponto de coleta pelo ID (os vínculos antigos são apagados e as listas novas regravadas)
const atualizarPontoColeta = async function (ponto, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let resultBuscar = await buscarPontoColeta(id)

            if (resultBuscar.status_code == 200) {
                let validar = await validarDados(ponto)

                if (validar) {
                    return validar // 400 ou 500
                } else {
                    let dados = normalizarDados(ponto)
                    dados.id = Number(id)

                    let result = await pontoColetaDAO.updatePontoColeta(dados)

                    if (result) {
                        let apagouEnderecos = await controllerEnderecoPontoColeta.excluirEnderecosIdPontoColeta(dados.id)
                        let apagouMateriais = await controllerMaterialAceitoPontoColeta.excluirMateriaisIdPontoColeta(dados.id)

                        if (apagouEnderecos.status_code == 200 && apagouMateriais.status_code == 200) {
                            let enderecosOk = await inserirEnderecosDoPonto(dados.id, dados.endereco)
                            let materiaisOk = await inserirMateriaisDoPonto(dados.id, dados.material_aceito)
                            let pontoAtualizado = await buscarPontoColetaCompleto(dados.id)

                            if (pontoAtualizado) {
                                let sucesso = (enderecosOk && materiaisOk) ? message.SUCCESS_UPDETED_ITEM : message.SUCCESS_CREATED_WARNING

                                message.DEFAULT_MESSAGE.status = sucesso.status
                                message.DEFAULT_MESSAGE.status_code = sucesso.status_code
                                message.DEFAULT_MESSAGE.message = sucesso.message
                                message.DEFAULT_MESSAGE.response = { ponto_coleta: pontoAtualizado }

                                return message.DEFAULT_MESSAGE // 201 (valor definido em SUCCESS_UPDETED_ITEM)
                            } else {
                                return message.ERROR_INTERNAL_SEVER_MODEL // 500
                            }
                        } else {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }
                    } else {
                        return message.ERROR_INTERNAL_SEVER_MODEL // 500
                    }
                }
            } else {
                return resultBuscar // 400, 404 ou 500
            }
        } else {
            return message.ERROR_CONTENT_TYPE // 415
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// Listar todos os pontos de coleta (cada um com endereços e materiais aceitos)
const listarPontoColeta = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pontoColetaDAO.selectAllPontoColeta()

        if (result && result.length > 0) {
            for (let ponto of result) {
                formatarPonto(ponto)
                await anexarRelacoes(ponto)
            }

            message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
            message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
            message.DEFAULT_MESSAGE.response.count = result.length
            message.DEFAULT_MESSAGE.response.ponto_coleta = result

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

// Buscar um ponto de coleta pelo ID (com endereços e materiais aceitos)
const buscarPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (!idValido(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] INVÁLIDO'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await pontoColetaDAO.selectByIdPontoColeta(Number(id))

            if (result && result.length > 0) {
                formatarPonto(result[0])
                await anexarRelacoes(result[0])

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.ponto_coleta = result[0]

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

// Excluir um ponto de coleta pelo ID (apaga os vínculos ANTES, por causa da FK)
const excluirPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscar = await buscarPontoColeta(id)

        if (resultBuscar.status_code == 200) {
            // FK de tbl_horario_ponto_coleta: não deixa estourar erro do banco se o ponto ainda tem horários
            let comHorarios = await pontoColetaDAO.countHorarioByIdPontoColeta(Number(id))

            if (comHorarios === false) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            } else if (comHorarios > 0) {
                message.ERROR_BAD_REQUEST.field = '[ID] EM USO: existem horários de funcionamento vinculados a este ponto de coleta'
                return message.ERROR_BAD_REQUEST // 400
            } else {
                let apagouEnderecos = await controllerEnderecoPontoColeta.excluirEnderecosIdPontoColeta(Number(id))
                let apagouMateriais = await controllerMaterialAceitoPontoColeta.excluirMateriaisIdPontoColeta(Number(id))

                if (apagouEnderecos.status_code == 200 && apagouMateriais.status_code == 200) {
                    let result = await pontoColetaDAO.deletePontoColeta(Number(id))

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
                    return message.ERROR_INTERNAL_SEVER_MODEL // 500
                }
            }
        } else {
            return resultBuscar // 400, 404 ou 500
        }
    } catch (error) {
        console.log(error)
        return message.ERROR_INTERNAL_CONTROLER // 500
    }
}

// ----------------------------------- HELPERS -----------------------------------

// Monta o ERROR_BAD_REQUEST (clone) com o campo inválido
const erroCampo = function (field) {
    let message = JSON.parse(JSON.stringify(configMessages))

    message.ERROR_BAD_REQUEST.field = field
    return message.ERROR_BAD_REQUEST // 400
}

// DECIMAL vem como texto do mysql2: converte latitude e longitude para número
const formatarPonto = function (ponto) {
    ponto.latitude = (ponto.latitude === null || ponto.latitude === undefined) ? null : Number(ponto.latitude)
    ponto.longitude = (ponto.longitude === null || ponto.longitude === undefined) ? null : Number(ponto.longitude)

    return ponto
}

// Busca o ponto já formatado e com as listas (ou false)
const buscarPontoColetaCompleto = async function (id) {
    let result = await pontoColetaDAO.selectByIdPontoColeta(Number(id))

    if (result && result.length > 0) {
        formatarPonto(result[0])
        return await anexarRelacoes(result[0])
    } else {
        return false
    }
}

// Preenche ponto.endereco (se a busca falhar ou vier vazia, fica [])
const anexarEnderecos = async function (ponto) {
    let result = await controllerEnderecoPontoColeta.buscarEnderecosIdPontoColeta(ponto.id)

    ponto.endereco = result.status_code == 200 ? result.response.endereco : []

    return ponto
}

// Preenche ponto.material_aceito (se a busca falhar ou vier vazia, fica [])
const anexarMateriaisAceitos = async function (ponto) {
    let result = await controllerMaterialAceitoPontoColeta.buscarMateriaisIdPontoColeta(ponto.id)

    ponto.material_aceito = result.status_code == 200 ? result.response.material_aceito : []

    return ponto
}

const anexarRelacoes = async function (ponto) {
    await anexarEnderecos(ponto)
    await anexarMateriaisAceitos(ponto)

    return ponto
}

// Grava os vínculos ponto x endereço; devolve false no primeiro que falhar
const inserirEnderecosDoPonto = async function (idPonto, lista) {
    for (let endereco of lista) {
        let result = await controllerEnderecoPontoColeta.inserirNovoEnderecoPontoColeta({
            id_endereco: Number(endereco.id),
            id_ponto_coleta: Number(idPonto)
        })

        if (result.status_code != 201) {
            return false
        }
    }

    return true
}

// Grava os vínculos ponto x material aceito; devolve false no primeiro que falhar
const inserirMateriaisDoPonto = async function (idPonto, lista) {
    for (let material of lista) {
        let result = await controllerMaterialAceitoPontoColeta.inserirNovoMaterialAceitoPontoColeta({
            id_ponto_coleta: Number(idPonto),
            id_material_aceito: Number(material.id)
        })

        if (result.status_code != 201) {
            return false
        }
    }

    return true
}

// Remove ids repetidos e converte/limpa os campos
const normalizarDados = function (ponto) {
    return {
        nome: ponto.nome.trim(),
        descricao: ponto.descricao.trim(),
        status: ponto.status,
        latitude: vazio(ponto.latitude) ? null : Number(ponto.latitude),
        longitude: vazio(ponto.longitude) ? null : Number(ponto.longitude),
        id_categoria: Number(ponto.id_categoria),
        endereco: [...new Set(ponto.endereco.map(endereco => Number(endereco.id)))].map(id => ({ id })),
        material_aceito: [...new Set(ponto.material_aceito.map(material => Number(material.id)))].map(id => ({ id }))
    }
}

// Confere uma lista de { id }: precisa ser Array com pelo menos 1 item, cada id inteiro > 0 e existente na tabela filha
const validarListaIds = async function (lista, campo, selectById) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (!Array.isArray(lista) || lista.length == 0) {
        return erroCampo(`[${campo}] INVÁLIDO (envie uma lista com ao menos um objeto { "id": 1 })`)
    }

    for (let registro of lista) {
        if (registro === null || typeof registro !== 'object' || !idValido(registro.id)) {
            return erroCampo(`[${campo}] INVÁLIDO (cada item precisa de um id inteiro maior que 0)`)
        }

        let existe = await selectById(Number(registro.id))

        if (existe === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (existe.length == 0) {
            return erroCampo(`[${campo}] O ID ${Number(registro.id)} NÃO EXISTE`)
        }
    }

    return false
}

// Devolve false se os dados são válidos, ou o ERROR_BAD_REQUEST com o campo inválido
const validarDados = async function (ponto) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (ponto === null || typeof ponto !== 'object' || Array.isArray(ponto)) {
        return erroCampo('[BODY] INVÁLIDO')
    } else if (typeof ponto.nome !== 'string' || ponto.nome.trim() == '' || ponto.nome.trim().length > 100) {
        return erroCampo('[NOME] INVÁLIDO')
    } else if (typeof ponto.descricao !== 'string' || ponto.descricao.trim() == '' || Buffer.byteLength(ponto.descricao.trim(), 'utf8') > 65535) {
        return erroCampo('[DESCRICAO] INVÁLIDA')
    } else if (ponto.status !== 'ativo' && ponto.status !== 'inativo') {
        return erroCampo('[STATUS] INVÁLIDO (use "ativo" ou "inativo")')
    } else if (!coordenadaValida(ponto.latitude, 90)) {
        return erroCampo('[LATITUDE] INVÁLIDA (entre -90 e 90)')
    } else if (!coordenadaValida(ponto.longitude, 180)) {
        return erroCampo('[LONGITUDE] INVÁLIDA (entre -180 e 180)')
    } else if (!idValido(ponto.id_categoria)) {
        return erroCampo('[ID_CATEGORIA] INVÁLIDO')
    } else {
        // FK: a categoria precisa existir
        let categoria = await categoriaDAO.selectByIdCategoria(Number(ponto.id_categoria))

        if (categoria === false) {
            return message.ERROR_INTERNAL_SEVER_MODEL // 500
        } else if (categoria.length == 0) {
            return erroCampo('[ID_CATEGORIA] NÃO EXISTE')
        }

        // listas: endereços e materiais aceitos
        let erroEnderecos = await validarListaIds(ponto.endereco, 'ENDERECO', enderecoDAO.selectByIdEndereco)

        if (erroEnderecos) {
            return erroEnderecos // 400 ou 500
        }

        let erroMateriais = await validarListaIds(ponto.material_aceito, 'MATERIAL_ACEITO', materialAceitoDAO.selectByIdMaterialAceito)

        if (erroMateriais) {
            return erroMateriais // 400 ou 500
        }

        return false
    }
}

module.exports = {
    inserirNovoPontoColeta,
    atualizarPontoColeta,
    listarPontoColeta,
    buscarPontoColeta,
    excluirPontoColeta
}