const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const root = process.cwd()
const express = require(path.join(root, 'node_modules/express'))
const jwt = require(path.join(root, 'node_modules/jsonwebtoken'))
const db = require(path.join(root, 'node_modules/knex'))(require(path.join(root, 'model/database_config_knex/knexFile.js')).development)
const { criarRouter, uploadDir } = require(path.join(root, 'routes/publicacao_anuncio.routes.js'))

;(async () => {
    let trx, server
    const arquivos = []
    try {
        trx = await db.transaction()
        const usuario = await trx('tbl_usuario').first('id')
        assert.ok(usuario, 'Um usuário é necessário para o teste')
        const app = express()
        app.use('/uploads/anuncios', express.static(uploadDir))
        app.use('/meraki/ecowayer/user', require(path.join(root, 'middleware/autenticacaoUsuario.js')))
        app.use('/meraki/ecowayer/user/anuncio', criarRouter(trx))
        server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
        const base = `http://127.0.0.1:${server.address().port}`
        const endpoint = `${base}/meraki/ecowayer/user/anuncio`
        const token = jwt.sign({ id: usuario.id, tipo: 'usuario' }, process.env.JWT_SECRET, { expiresIn: '5m' })
        const headers = { Cookie: `ecowayer_token=${token}` }
        const opcoesRes = await fetch(`${endpoint}/opcoes`)
        assert.equal(opcoesRes.status, 200)
        const { response: opcoes } = await opcoesRes.json()
        const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
        function formulario({ bytes = png, quantidade = '2', unidade = 'un', categoria = opcoes.categorias[0].id } = {}) {
            const form = new FormData()
            for (const [key, value] of Object.entries({ nome: 'Teste temporário de upload', descricao: 'Descrição de validação da publicação com imagens.', id_categoria: categoria, id_modalidade: opcoes.modalidades[0].id, id_condicao_item: opcoes.condicoes[0].id, quantidade, unidade, preco: '' })) form.append(key, String(value))
            form.append('fotos', new Blob([bytes], { type: 'image/png' }), '../../arquivo.png')
            return form
        }
        const semSessao = await fetch(`${endpoint}/publicar`, { method: 'POST', body: formulario() })
        assert.equal(semSessao.status, 401)
        console.log('PASS: publicação exige autenticação')
        const res = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario() })
        const body = await res.json()
        assert.equal(res.status, 201, JSON.stringify(body))
        const anuncio = body.response.anuncio
        arquivos.push(path.join(uploadDir, path.basename(anuncio.imagem)))
        assert.equal(anuncio.id_usuario, usuario.id)
        assert.equal(anuncio.peso_kg, null)
        const imagem = await fetch(`${base}${anuncio.imagem}`)
        assert.equal(imagem.status, 200)
        assert.match(imagem.headers.get('content-type'), /image\/png/)
        assert.deepEqual(Buffer.from(await imagem.arrayBuffer()), png)
        const vinculo = await trx('tbl_imagem_anuncio').where({ id_anuncio: anuncio.id }).first()
        const registro = await trx('tbl_imagem').where({ id: vinculo.id_imagem }).first()
        assert.equal(registro.url, anuncio.imagem)
        console.log('PASS: foto acessível pela URL, vínculo gravado e unidades preservadas')
        for (const [nome, config] of [['arquivo inválido', { bytes: Buffer.from('<script>alert(1)</script>') }], ['categoria inexistente', { categoria: 2147483647 }], ['unidade fracionada', { quantidade: '1.5' }], ['foto acima de 5 MB', { bytes: Buffer.alloc(5 * 1024 * 1024 + 1) }]]) {
            const r = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario(config) })
            assert.equal(r.status, 400, nome)
            console.log('PASS: rejeita', nome)
        }
        const r = await fetch(`${endpoint}/publicar`, { method: 'POST', headers, body: formulario({ quantidade: '1.25', unidade: 't' }) })
        const b = await r.json()
        assert.equal(r.status, 201, JSON.stringify(b))
        arquivos.push(path.join(uploadDir, path.basename(b.response.anuncio.imagem)))
        assert.equal(b.response.anuncio.peso_kg, 1250)
        console.log('PASS: toneladas convertidas corretamente para kg')
    } finally {
        if (server) await new Promise(resolve => server.close(resolve))
        if (trx) await trx.rollback()
        await Promise.all(arquivos.map(f => fs.unlink(f)))
        await db.destroy()
        console.log('Rollback concluído e fotos de teste removidas')
    }
})().then(() => process.exit(0), e => { console.error(e); process.exit(1) })
