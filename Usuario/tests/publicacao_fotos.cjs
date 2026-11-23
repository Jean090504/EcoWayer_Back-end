const assert = require('node:assert/strict')
const path = require('node:path')
const root = process.cwd()
const express = require(path.join(root, 'node_modules/express'))
const jwt = require(path.join(root, 'node_modules/jsonwebtoken'))
const db = require(path.join(root, 'node_modules/knex'))(require(path.join(root, 'model/database_config_knex/knexFile.js')).development)
const { criarRouter } = require(path.join(root, 'routes/publicacao_anuncio.routes.js'))
const sessaoUsuario = require(path.join(root, 'model/sessaoUsuario.js'))
// O teste de fotos usa tokens de teste e exercita o middleware e a autorização do anúncio.
sessaoUsuario.consultarSessao = async () => true

process.env.CLOUDINARY_CLOUD_NAME = 'teste-ecowayer'
const foto = 'https://res.cloudinary.com/teste-ecowayer/image/upload/v1/foto.png'
const outraFoto = 'https://res.cloudinary.com/teste-ecowayer/image/upload/v1/outra.png'

;(async () => {
    let trx, server
    try {
        trx = await db.transaction()
        const usuario = await trx('tbl_usuario').first('id')
        assert.ok(usuario, 'Um usuário é necessário para o teste')
        const app = express()
        app.use(express.json())
        app.use('/meraki/ecowayer/user', require(path.join(root, 'middleware/autenticacaoUsuario.js')))
        app.use('/meraki/ecowayer/user/anuncio', criarRouter(trx))
        server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
        const base = `http://127.0.0.1:${server.address().port}`
        const endpoint = `${base}/meraki/ecowayer/user/anuncio`
        const token = jwt.sign({ id: usuario.id, tipo: 'usuario' }, process.env.JWT_SECRET, { expiresIn: '5m' })
        const headers = { 'Content-Type': 'application/json', Cookie: `ecowayer_token=${token}` }
        const opcoesRes = await fetch(`${endpoint}/opcoes`)
        assert.equal(opcoesRes.status, 200)
        const { response: opcoes } = await opcoesRes.json()
        function formulario({ fotos = [foto], quantidade = '2', unidade = 'un', categoria = opcoes.categorias[0].id } = {}) {
            return JSON.stringify({
                nome: 'Teste temporário de publicação',
                descricao: 'Descrição de validação da publicação com imagens.',
                id_categoria: categoria,
                id_modalidade: opcoes.modalidades[0].id,
                id_condicao_item: opcoes.condicoes[0].id,
                quantidade, unidade, preco: '', fotos
            })
        }
        const semSessao = await fetch(`${endpoint}/publicar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: formulario() })
        assert.equal(semSessao.status, 401)
        console.log('PASS: publicação exige autenticação')
        const res = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario() })
        const body = await res.json()
        assert.equal(res.status, 201, JSON.stringify(body))
        const anuncio = body.response.anuncio
        assert.equal(anuncio.id_usuario, usuario.id)
        assert.equal(anuncio.peso_kg, null)
        assert.equal(anuncio.imagem, foto)
        const vinculo = await trx('tbl_imagem_anuncio').where({ id_anuncio: anuncio.id }).first()
        const registro = await trx('tbl_imagem').where({ id: vinculo.id_imagem }).first()
        assert.equal(registro.url, anuncio.imagem)
        assert.equal(vinculo.ordem, 1)
        console.log('PASS: URL do Cloudinary salva, vínculo gravado e unidades preservadas')
        for (const [nome, config] of [
            ['URL externa', { fotos: ['https://example.com/foto.png'] }],
            ['URL de outra conta Cloudinary', { fotos: [foto.replace('teste-ecowayer', 'outra-conta')] }],
            ['categoria inexistente', { categoria: 2147483647 }],
            ['unidade fracionada', { quantidade: '1.5' }],
            ['foto repetida', { fotos: [foto, foto] }],
            ['galeria acima do limite', { fotos: Array.from({ length: 7 }, (_, i) => foto.replace('foto.png', `foto-${i}.png`)) }]
        ]) {
            const r = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario(config) })
            assert.equal(r.status, 400, nome)
            console.log('PASS: rejeita', nome)
        }
        const r = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario({ quantidade: '1.25', unidade: 't' }) })
        const b = await r.json()
        assert.equal(r.status, 201, JSON.stringify(b))
        assert.equal(b.response.anuncio.peso_kg, 1250)
        console.log('PASS: toneladas convertidas corretamente para kg')
        // Edição usa apenas o anúncio criado nesta transação de teste.
        await trx('tbl_anuncio').where({ id: anuncio.id }).update({ status: 'pausado' })
        const antes = await trx('tbl_anuncio').where({ id: anuncio.id }).first()
        function edicao(mantidas, nova = false) {
            const form = JSON.parse(formulario({ fotos: nova ? [outraFoto] : [], quantidade: '3' }))
            form.nome = 'Título alterado no teste'
            form.fotos_mantidas = mantidas
            return JSON.stringify(form)
        }
        const editada = await fetch(`${endpoint}/${anuncio.id}/publicar`, { method: 'PUT', headers, body: edicao([anuncio.imagem], true) })
        const editBody = await editada.json()
        assert.equal(editada.status, 200, JSON.stringify(editBody))
        const editAnuncio = editBody.response.anuncio
        const novaUrl = editAnuncio.imagens[1]
        assert.deepEqual(editAnuncio.imagens, [foto, outraFoto])
        const galeria = await trx('tbl_imagem_anuncio').where({ id_anuncio: anuncio.id }).orderBy('ordem')
        assert.deepEqual(galeria.map(imagem => imagem.ordem), [1, 2])
        assert.equal(editAnuncio.status, 'pausado')
        const depois = await trx('tbl_anuncio').where({ id: anuncio.id }).first()
        assert.equal(depois.nome, 'Título alterado no teste')
        assert.equal(Number(depois.quantidade), 3)
        assert.equal(String(depois.data_publicacao), String(antes.data_publicacao))
        console.log('PASS: edição salva campos e nova foto, preservando status, data e foto anterior')
        const removida = await fetch(`${endpoint}/${anuncio.id}/publicar`, { method: 'PUT', headers, body: edicao([novaUrl]) })
        assert.equal(removida.status, 200)
        assert.deepEqual((await removida.json()).response.anuncio.imagens, [novaUrl])
        assert.equal((await trx('tbl_imagem_anuncio').where({ id_anuncio: anuncio.id })).length, 1)
        console.log('PASS: edição permite remover foto e salvar sem reenviar as existentes')
        const outroToken = jwt.sign({ id: usuario.id + 100000, tipo: 'usuario' }, process.env.JWT_SECRET, { expiresIn: '5m' })
        const negada = await fetch(`${endpoint}/${anuncio.id}/publicar`, { method: 'PUT', headers: { ...headers, Cookie: `ecowayer_token=${outroToken}` }, body: edicao([novaUrl]) })
        assert.equal(negada.status, 404)
        console.log('PASS: edição de anúncio alheio bloqueada')
        for (const mantidas of [[], ['/uploads/anuncios/foto-de-outro-anuncio.png']]) {
            const r = await fetch(`${endpoint}/${anuncio.id}/publicar`, { method: 'PUT', headers, body: edicao(mantidas) })
            assert.equal(r.status, 400)
        }
        console.log('PASS: rejeita anúncio sem fotos e fotos não vinculadas ao anúncio')

    } finally {
        if (server) await new Promise(resolve => server.close(resolve))
        if (trx) await trx.rollback()
        await db.destroy()
        console.log('Rollback concluído')
    }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1) })
