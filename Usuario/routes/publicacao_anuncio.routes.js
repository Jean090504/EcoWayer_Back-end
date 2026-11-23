const express = require('express')
const path = require('node:path')
const controller = require('../controller/anuncio/anuncio_controler.js')

const uploadDir = path.resolve(__dirname, '../uploads/anuncios')

function urlCloudinaryValida(valor) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    if (!cloudName || typeof valor !== 'string' || valor.length > 255) return false
    const prefixo = `https://res.cloudinary.com/${cloudName}/image/upload/`
    return valor.startsWith(prefixo) && /^[a-z\d_./%-]+\.(?:jpe?g|png|webp)$/i.test(valor.slice(prefixo.length))
}

async function vincularFotos(trx, anuncioId, fotos, inicio = 0) {
    if (!fotos.length) return
    const tipo = await trx('tbl_tipo_imagem').whereRaw('LOWER(tipo) IN (?, ?)', ['anúncio', 'anuncio']).first()
    if (!tipo) throw new Error('Tipo de imagem Anúncio não cadastrado.')
    for (const [indice, url] of fotos.entries()) {
        const [idImagem] = await trx('tbl_imagem').insert({ url, id_tipo_imagem: tipo.id })
        await trx('tbl_imagem_anuncio').insert({ id_imagem: idImagem, id_anuncio: anuncioId, ordem: inicio + indice + 1 })
    }
}

function criarRouter(db) {
    const router = express.Router()
    router.get('/opcoes', async (_req, res) => {
        try {
            const [categorias, modalidades, condicoes] = await Promise.all([
                db('tbl_categoria').select('id', 'nome').orderBy('nome'),
                db('tbl_modalidade').select('id', 'nome').orderBy('nome'),
                db('tbl_condicao_item').select('id', 'nome').orderBy('nome')
            ])
            res.json({ response: { categorias, modalidades, condicoes } })
        } catch (error) {
            console.error('Opções do anúncio:', error)
            res.status(500).json({ message: 'Não foi possível carregar as opções do anúncio.' })
        }
    })
    router.post('/publicar', async (req, res) => {
        try {
            const dados = { ...req.body, id_usuario: req.usuario.id, status: 'ativo', data_publicacao: new Date().toISOString().slice(0, 19).replace('T', ' ') }
            const erro = controller.validarDados(dados)
            if (erro) return res.status(erro.status_code).json(erro)
            const fotos = dados.fotos
            if (!Array.isArray(fotos) || fotos.length < 1 || fotos.length > 6 ||
                new Set(fotos).size !== fotos.length || !fotos.every(urlCloudinaryValida)) {
                return res.status(400).json({ message: 'Envie de 1 a 6 URLs distintas de fotos do Cloudinary.' })
            }
            const quantidade = Number(dados.quantidade)
            if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 999999999 || !['kg', 't', 'un', 'l'].includes(dados.unidade) || (dados.unidade === 'un' && !Number.isInteger(quantidade))) {
                return res.status(400).json({ message: 'Informe uma quantidade e unidade válidas.' })
            }
            const anuncio = controller.normalizarDados(dados)
            anuncio.quantidade = quantidade
            anuncio.unidade = dados.unidade
            anuncio.peso_kg = dados.unidade === 't' ? quantidade * 1000 : dados.unidade === 'kg' ? quantidade : null
            const resultado = await db.transaction(async trx => {
                for (const [tabela, id] of [['tbl_categoria', anuncio.id_categoria], ['tbl_modalidade', anuncio.id_modalidade], ['tbl_condicao_item', anuncio.id_condicao_item]]) {
                    if (!await trx(tabela).where({ id }).first()) {
                        const error = new Error('Categoria, modalidade ou condição não encontrada.')
                        error.status = 400
                        throw error
                    }
                }
                const [id] = await trx('tbl_anuncio').insert(anuncio)
                await vincularFotos(trx, id, fotos)
                return { ...anuncio, id, imagem: fotos[0], imagens: fotos }
            })
            res.status(201).json({ response: { anuncio: resultado } })
        } catch (error) {
            console.error('Publicação com fotos:', error)
            res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível publicar o anúncio. Nenhuma publicação foi salva.' })
        }
    })
    router.put('/:id/publicar', async (req, res) => {
        const falhar = (message, status = 400) => { const e = new Error(message); e.status = status; throw e }
        try {
            if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) < 1) falhar('Anúncio inválido.')
            const { fotos_mantidas: mantidas = [], fotos = [] } = req.body || {}
            if (!Array.isArray(mantidas) || mantidas.some(url => typeof url !== 'string') ||
                !Array.isArray(fotos) || !fotos.every(urlCloudinaryValida)) falhar('Lista de fotos inválida.')
            const imagens = [...mantidas, ...fotos]
            if (imagens.length < 1 || imagens.length > 6 || new Set(imagens).size !== imagens.length) {
                falhar('Mantenha de 1 a 6 fotos distintas no anúncio.')
            }
            const quantidade = Number(req.body?.quantidade)
            const unidade = req.body?.unidade
            if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 999999999 || !['kg', 't', 'un', 'l'].includes(unidade) || (unidade === 'un' && !Number.isInteger(quantidade))) falhar('Informe uma quantidade e unidade válidas.')
            const resultado = await db.transaction(async trx => {
                const atual = await trx('tbl_anuncio').where({ id: Number(req.params.id), id_usuario: req.usuario.id }).forUpdate().first()
                if (!atual || atual.status === 'excluido') falhar('Anúncio não encontrado ou não pertence à sua conta.', 404)
                const [{ data }] = await trx('tbl_anuncio').where({ id: atual.id }).select(trx.raw("DATE_FORMAT(data_publicacao, '%Y-%m-%d %H:%i:%s') AS data"))
                const dados = { ...req.body, id_usuario: req.usuario.id, status: atual.status, data_publicacao: data }
                const erro = controller.validarDados(dados)
                if (erro) falhar(erro.field || erro.message, erro.status_code)
                const anuncio = { ...controller.normalizarDados(dados), quantidade, unidade, peso_kg: unidade === 't' ? quantidade * 1000 : unidade === 'kg' ? quantidade : null }
                for (const [tabela, id] of [['tbl_categoria', anuncio.id_categoria], ['tbl_modalidade', anuncio.id_modalidade], ['tbl_condicao_item', anuncio.id_condicao_item]]) {
                    if (!await trx(tabela).where({ id }).first()) falhar('Categoria, modalidade ou condição não encontrada.')
                }
                const antigas = await trx('tbl_imagem_anuncio as ia').join('tbl_imagem as i', 'i.id', 'ia.id_imagem').where('ia.id_anuncio', atual.id).select('ia.id', 'i.url')
                if (mantidas.some(url => !antigas.some(i => i.url === url))) falhar('Uma das fotos informadas não pertence ao anúncio.')
                const removidas = antigas.filter(i => !mantidas.includes(i.url)).map(i => i.id)
                if (removidas.length) await trx('tbl_imagem_anuncio').whereIn('id', removidas).delete()
                await trx('tbl_anuncio').where({ id: atual.id, id_usuario: req.usuario.id }).update(anuncio)
                for (const [indice, url] of mantidas.entries()) {
                    const imagem = antigas.find(item => item.url === url)
                    await trx('tbl_imagem_anuncio').where({ id: imagem.id }).update({ ordem: indice + 1 })
                }
                await vincularFotos(trx, atual.id, fotos, mantidas.length)
                return { ...anuncio, id: atual.id, imagem: imagens[0], imagens }
            })
            res.json({ response: { anuncio: resultado } })
        } catch (error) {
            if (!error.status) console.error('Edição de anúncio com fotos:', error)
            res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível salvar as alterações. Tente novamente.' })
        }
    })

    return router
}

module.exports = { criarRouter, uploadDir }
