const express = require('express')
const multer = require('multer')
const path = require('node:path')
const fs = require('node:fs/promises')
const { randomUUID } = require('node:crypto')
const controller = require('../controller/anuncio/anuncio_controler.js')

const uploadDir = path.resolve(__dirname, '../uploads/anuncios')
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 6, fields: 12, fieldSize: 65536, parts: 18 }
}).array('fotos', 6)

function extensaoImagem(buffer) {
    if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'jpg'
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
    return null
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
    router.post('/publicar', (req, res) => {
        upload(req, res, async (errorUpload) => {
            if (errorUpload) return res.status(400).json({ message: 'Envie até 6 fotos de até 5 MB cada, no campo fotos.' })
            const arquivos = []
            try {
                const dados = { ...req.body, id_usuario: req.usuario.id, status: 'ativo', data_publicacao: new Date().toISOString().slice(0, 19).replace('T', ' ') }
                const erro = controller.validarDados(dados)
                if (erro) return res.status(erro.status_code).json(erro)
                if (!req.files?.length) return res.status(400).json({ message: 'Adicione pelo menos uma foto.' })
                const extensoes = req.files.map(f => extensaoImagem(f.buffer))
                if (extensoes.some(e => !e)) return res.status(400).json({ message: 'Use imagens JPEG, PNG ou WebP.' })
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
                    const tipo = await trx('tbl_tipo_imagem').whereRaw('LOWER(tipo) IN (?, ?)', ['anúncio', 'anuncio']).first()
                    if (!tipo) throw new Error('Tipo de imagem Anúncio não cadastrado.')
                    const [id] = await trx('tbl_anuncio').insert(anuncio)
                    await fs.mkdir(uploadDir, { recursive: true })
                    const imagens = []
                    for (let i = 0; i < req.files.length; i++) {
                        const nome = `${randomUUID()}.${extensoes[i]}`
                        const destino = path.join(uploadDir, nome)
                        arquivos.push(destino)
                        await fs.writeFile(destino, req.files[i].buffer, { flag: 'wx' })
                        const url = `/uploads/anuncios/${nome}`
                        const [idImagem] = await trx('tbl_imagem').insert({ url, id_tipo_imagem: tipo.id })
                        await trx('tbl_imagem_anuncio').insert({ id_imagem: idImagem, id_anuncio: id })
                        imagens.push(url)
                    }
                    return { ...anuncio, id, imagem: imagens[0], imagens }
                })
                res.status(201).json({ response: { anuncio: resultado } })
            } catch (error) {
                await Promise.all(arquivos.map(p => fs.unlink(p).catch(() => {})))
                console.error('Publicação com fotos:', error)
                res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível publicar o anúncio. Nenhuma publicação foi salva.' })
            }
        })
    })
    return router
}

module.exports = { criarRouter, uploadDir, extensaoImagem }
