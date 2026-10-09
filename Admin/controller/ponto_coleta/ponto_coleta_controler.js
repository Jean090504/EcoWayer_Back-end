/***********************************************************************************************
 *  Objetivo: Arquivo responsavel pela validação, tratamento e manipulação de dados
 *            para o CRUD de ponto de coleta
 *  Autor: Maxwillian Santana
 *  Versão: 1.2
 **********************************************************************************************/

const configMessages = require('../modulo/configMessages.js')
const pontoColetaDAO = require('../../model/DAO/ponto_coleta/ponto_coleta.js')
const categoriaDAO = require('../../model/DAO/categoria/categoria.js')
const enderecoDAO = require('../../model/DAO/endereco/endereco.js')
const materialAceitoDAO = require('../../model/DAO/material_aceito/material_aceito.js')
const controlerEnderecoPontoColeta = require('./endereco_ponto_coleta_controler.js')
const controlerMaterialAceitoPontoColeta = require('./material_aceito_ponto_coleta_controler.js')

// ATENÇÃO: troque pelos valores reais do ENUM da coluna status
// (rode: SHOW COLUMNS FROM tbl_ponto_coleta LIKE 'status';)
const STATUS_VALIDOS = ['ativo', 'inativo']

// O mysql2 devolve DECIMAL como texto; aqui converte para número
const formatarPonto = function (ponto) {
    return {
        ...ponto,
        latitude: Number(ponto.latitude),
        longitude: Number(ponto.longitude)
    }
}

// Busca os endereços do ponto na tabela intermediária e anexa no objeto
const anexarEnderecos = async function (ponto) {
    let resultEnderecos = await controlerEnderecoPontoColeta.buscarEnderecosIdPontoColeta(ponto.id)

    ponto.endereco = resultEnderecos.status ? resultEnderecos.response.endereco : []

    return ponto
}

// Busca os materiais aceitos do ponto na tabela intermediária e anexa no objeto
const anexarMateriaisAceitos = async function (ponto) {
    let resultMateriais = await controlerMaterialAceitoPontoColeta.buscarMateriaisIdPontoColeta(ponto.id)

    ponto.material_aceito = resultMateriais.status ? resultMateriais.response.material_aceito : []

    return ponto
}

// Anexa todas as relações (endereço e material aceito) no ponto
const anexarRelacoes = async function (ponto) {
    await anexarEnderecos(ponto)
    await anexarMateriaisAceitos(ponto)

    return ponto
}

// Grava os vínculos do ponto com cada endereço da lista
const inserirEnderecosDoPonto = async function (idPontoColeta, enderecos) {
    for (let endereco of enderecos) {
        let relacao = {
            id_endereco: endereco.id,
            id_ponto_coleta: idPontoColeta
        }

        let resultRelacao = await controlerEnderecoPontoColeta.inserirNovoEnderecoPontoColeta(relacao)

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

// Grava os vínculos do ponto com cada material aceito da lista
const inserirMateriaisDoPonto = async function (idPontoColeta, materiais) {
    for (let material of materiais) {
        let relacao = {
            id_ponto_coleta: idPontoColeta,
            id_material_aceito: material.id
        }

        let resultRelacao = await controlerMaterialAceitoPontoColeta.inserirNovoMaterialAceitoPontoColeta(relacao)

        if (!resultRelacao.status) {
            return false
        }
    }

    return true
}

const inserirNovoPontoColeta = async function (ponto, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == "APPLICATION/JSON") {
            let validar = await validarDados(ponto)

            if (validar) {
                return validar // 400
            } else {
                normalizarDados(ponto)

                let idInserido = await pontoColetaDAO.insertPontoColeta(ponto)

                if (idInserido) {
                    // Tabelas intermediárias: vincula endereços e materiais ao ponto recém criado
                    let relacionouEnderecos = await inserirEnderecosDoPonto(idInserido, ponto.endereco)
                    let relacionouMateriais = await inserirMateriaisDoPonto(idInserido, ponto.material_aceito)

                    if (!relacionouEnderecos || !relacionouMateriais) {
                        return message.SUCCESS_CREATED_WARNING // 201 com alerta de dados não inseridos
                    }

                    let criado = await pontoColetaDAO.selectByIdPontoColeta(idInserido)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_CREATED_ITEM.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_CREATED_ITEM.status_code
                    message.DEFAULT_MESSAGE.message = message.SUCCESS_CREATED_ITEM.message

                    if (criado && criado.length > 0) {
                        message.DEFAULT_MESSAGE.response = await anexarRelacoes(formatarPonto(criado[0]))
                    } else {
                        message.DEFAULT_MESSAGE.response = { id: idInserido, nome: ponto.nome }
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

const atualizarPontoColeta = async function (ponto, id, contentType) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (String(contentType).toUpperCase() == 'APPLICATION/JSON') {
            let resultID = await buscarPontoColeta(id)

            if (resultID.status) {
                let validar = await validarDados(ponto)

                if (!validar) {
                    normalizarDados(ponto)
                    ponto.id = Number(id)

                    let result = await pontoColetaDAO.updatePontoColeta(ponto)

                    if (result) {
                        // Tabelas intermediárias: apaga os vínculos antigos e grava as listas novas
                        let resultDeleteEnderecos = await controlerEnderecoPontoColeta.excluirEnderecosIdPontoColeta(ponto.id)
                        let resultDeleteMateriais = await controlerMaterialAceitoPontoColeta.excluirMateriaisIdPontoColeta(ponto.id)

                        if (!resultDeleteEnderecos.status || !resultDeleteMateriais.status) {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }

                        let relacionouEnderecos = await inserirEnderecosDoPonto(ponto.id, ponto.endereco)
                        let relacionouMateriais = await inserirMateriaisDoPonto(ponto.id, ponto.material_aceito)

                        if (!relacionouEnderecos || !relacionouMateriais) {
                            return message.ERROR_INTERNAL_SEVER_MODEL // 500
                        }

                        let atualizado = await pontoColetaDAO.selectByIdPontoColeta(ponto.id)

                        message.DEFAULT_MESSAGE.status = message.SUCCESS_UPDETED_ITEM.status
                        message.DEFAULT_MESSAGE.status_code = message.SUCCESS_UPDETED_ITEM.status_code
                        message.DEFAULT_MESSAGE.message = message.SUCCESS_UPDETED_ITEM.message

                        if (atualizado && atualizado.length > 0) {
                            message.DEFAULT_MESSAGE.response = await anexarRelacoes(formatarPonto(atualizado[0]))
                        } else {
                            message.DEFAULT_MESSAGE.response = { id: ponto.id, nome: ponto.nome }
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

const listarPontoColeta = async function () {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let result = await pontoColetaDAO.selectAllPontoColeta()

        if (result) {
            if (result.length > 0) {
                let pontos = []

                // ids em ordem decrescente (ORDER BY do DAO)
                for (let registro of result) {
                    let ponto = formatarPonto(registro)
                    await anexarRelacoes(ponto)
                    pontos.push(ponto)
                }

                message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                message.DEFAULT_MESSAGE.response.count = pontos.length
                message.DEFAULT_MESSAGE.response.ponto_coleta = pontos

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

const buscarPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        if (id == undefined || id == '' || id == null || isNaN(id)) {
            message.ERROR_BAD_REQUEST.field = '[ID] Inválido'
            return message.ERROR_BAD_REQUEST // 400
        } else {
            let result = await pontoColetaDAO.selectByIdPontoColeta(id)

            if (result) {
                if (result.length > 0) {
                    let ponto = formatarPonto(result[0])
                    await anexarRelacoes(ponto)

                    message.DEFAULT_MESSAGE.status = message.SUCCESS_RESPONSE.status
                    message.DEFAULT_MESSAGE.status_code = message.SUCCESS_RESPONSE.status_code
                    message.DEFAULT_MESSAGE.response.ponto_coleta = ponto

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

const excluirPontoColeta = async function (id) {
    let message = JSON.parse(JSON.stringify(configMessages))

    try {
        let resultBuscarID = await buscarPontoColeta(id)

        if (resultBuscarID.status) {
            // Tabelas intermediárias: precisa apagar os vínculos antes (chave estrangeira)
            let resultFilhosEnderecos = await controlerEnderecoPontoColeta.excluirEnderecosIdPontoColeta(id)
            let resultFilhosMateriais = await controlerMaterialAceitoPontoColeta.excluirMateriaisIdPontoColeta(id)

            if (!resultFilhosEnderecos.status || !resultFilhosMateriais.status) {
                return message.ERROR_INTERNAL_SEVER_MODEL // 500
            }

            let result = await pontoColetaDAO.deletePontoColeta(id)

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
const normalizarDados = function (ponto) {
    ponto.nome = String(ponto.nome).trim()
    ponto.descricao = ponto.descricao ? String(ponto.descricao).trim() : null
    ponto.latitude = Number(ponto.latitude)
    ponto.longitude = Number(ponto.longitude)
    ponto.id_categoria = Number(ponto.id_categoria)

    // Remove ids de endereço repetidos na lista
    let idsEnderecos = [...new Set(ponto.endereco.map(item => Number(item.id)))]
    ponto.endereco = idsEnderecos.map(idEndereco => ({ id: idEndereco }))

    // Remove ids de material aceito repetidos na lista
    let idsMateriais = [...new Set(ponto.material_aceito.map(item => Number(item.id)))]
    ponto.material_aceito = idsMateriais.map(idMaterial => ({ id: idMaterial }))
}

const numeroForaDoLimite = function (valor, min, max) {
    return valor === undefined || valor === null || valor === '' || isNaN(Number(valor)) || Number(valor) < min || Number(valor) > max
}

const validarDados = async function (ponto) {
    let message = JSON.parse(JSON.stringify(configMessages))

    if (ponto.nome == undefined || ponto.nome == null || String(ponto.nome).trim() == '' || String(ponto.nome).length > 100) {
        message.ERROR_BAD_REQUEST.field = "[NOME] INVÁLIDO (máximo 100 caracteres)"
        return message.ERROR_BAD_REQUEST

    } else if (ponto.status == undefined || ponto.status == null || !STATUS_VALIDOS.includes(String(ponto.status))) {
        message.ERROR_BAD_REQUEST.field = "[STATUS] INVÁLIDO (valores aceitos: " + STATUS_VALIDOS.join(', ') + ")"
        return message.ERROR_BAD_REQUEST

    } else if (numeroForaDoLimite(ponto.latitude, -90, 90)) {
        message.ERROR_BAD_REQUEST.field = "[LATITUDE] INVÁLIDA (número entre -90 e 90)"
        return message.ERROR_BAD_REQUEST

    } else if (numeroForaDoLimite(ponto.longitude, -180, 180)) {
        message.ERROR_BAD_REQUEST.field = "[LONGITUDE] INVÁLIDA (número entre -180 e 180)"
        return message.ERROR_BAD_REQUEST

    } else if (ponto.id_categoria === undefined || ponto.id_categoria === null || ponto.id_categoria === '' || !Number.isInteger(Number(ponto.id_categoria))) {
        message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] INVÁLIDO"
        return message.ERROR_BAD_REQUEST

    } else if (!Array.isArray(ponto.endereco) || ponto.endereco.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[ENDERECO] INVÁLIDO (envie uma lista com ao menos 1 endereço, ex: [{ "id": 1 }])'
        return message.ERROR_BAD_REQUEST

    } else if (!Array.isArray(ponto.material_aceito) || ponto.material_aceito.length == 0) {
        message.ERROR_BAD_REQUEST.field = '[MATERIAL_ACEITO] INVÁLIDO (envie uma lista com ao menos 1 material, ex: [{ "id": 1 }])'
        return message.ERROR_BAD_REQUEST

    } else {
        // Confere se a categoria existe antes de gravar (evita erro de chave estrangeira)
        let categoria = await categoriaDAO.selectByIdCategoria(ponto.id_categoria)

        if (!categoria || categoria.length == 0) {
            message.ERROR_BAD_REQUEST.field = "[ID_CATEGORIA] não encontrada"
            return message.ERROR_BAD_REQUEST
        }

        // Confere cada endereço da lista
        for (let item of ponto.endereco) {
            if (item == null || item.id === undefined || item.id === null || item.id === '' || !Number.isInteger(Number(item.id)) || Number(item.id) <= 0) {
                message.ERROR_BAD_REQUEST.field = '[ENDERECO] cada item precisa de um id válido, ex: { "id": 1 }'
                return message.ERROR_BAD_REQUEST
            }

            let enderecoEncontrado = await enderecoDAO.selectByIdEndereco(item.id)

            if (!enderecoEncontrado || enderecoEncontrado.length == 0) {
                message.ERROR_BAD_REQUEST.field = "[ENDERECO] id " + item.id + " não encontrado"
                return message.ERROR_BAD_REQUEST
            }
        }

        // Confere cada material aceito da lista
        for (let item of ponto.material_aceito) {
            if (item == null || item.id === undefined || item.id === null || item.id === '' || !Number.isInteger(Number(item.id)) || Number(item.id) <= 0) {
                message.ERROR_BAD_REQUEST.field = '[MATERIAL_ACEITO] cada item precisa de um id válido, ex: { "id": 1 }'
                return message.ERROR_BAD_REQUEST
            }

            let materialEncontrado = await materialAceitoDAO.selectByIdMaterialAceito(Number(item.id))

            if (!materialEncontrado || materialEncontrado.length == 0) {
                message.ERROR_BAD_REQUEST.field = "[MATERIAL_ACEITO] id " + item.id + " não encontrado"
                return message.ERROR_BAD_REQUEST
            }
        }

        return false
    }
}

module.exports = {
    inserirNovoPontoColeta,
    atualizarPontoColeta,
    listarPontoColeta,
    buscarPontoColeta,
    excluirPontoColeta,
    validarDados
}