const assert = require('node:assert/strict')
const path = require('node:path')
const { randomInt } = require('node:crypto')
const root = process.cwd()
const knexPath = require.resolve('knex', { paths: [root] })
const knex = require(knexPath)
const db = knex(require(path.join(root, 'model/database_config_knex/knexFile.js')).development)

;(async () => {
    let trx
    try {
        const { validarSenha } = require(path.join(root, 'controller/modulo/validacaoSenha.js'))
        assert.equal(validarSenha('Exemplo12'), '')
        assert.notEqual(validarSenha('exemplo'), '')
        trx = await db.transaction()
        const seed = await trx('tbl_usuario').first()
        assert.ok(seed)
        delete seed.id
        const [u1] = await trx('tbl_usuario').insert({ ...seed, nome: 'Conta temporária Um', cpf: String(randomInt(10000000000, 99999999999)) })
        const [u2] = await trx('tbl_usuario').insert({ ...seed, nome: 'Conta temporária Dois', cpf: String(randomInt(10000000000, 99999999999)) })
        const anuncioBase = await trx('tbl_anuncio').first()
        assert.ok(anuncioBase)
        delete anuncioBase.id
        const anuncios = []
        for (const [nome, dono] of [['Teste Origem A', u1], ['Teste Origem B', u1], ['Teste Origem C', u2]]) {
            const [id] = await trx('tbl_anuncio').insert({ ...anuncioBase, nome, id_usuario: dono, status: 'ativo' })
            anuncios.push(id)
        }
        require.cache[knexPath].exports = () => trx
        const conversas = require(path.join(root, 'controller/conversa/conversa_controler.js'))
        const mensagens = require(path.join(root, 'controller/mensagens/mensagens_controler.js'))
        require.cache[knexPath].exports = knex
        const ids = []
        for (let i = 0; i < anuncios.length; i++) {
            const usuario = i === 2 ? u1 : u2
            const criada = await conversas.inserirNovaConversa({ id_anuncio: anuncios[i], id_usuario: usuario }, 'application/json')
            assert.equal(criada.status_code, 201, JSON.stringify(criada))
            ids.push(criada.response.conversa.id)
            const enviada = await mensagens.inserirNovaMensagem({ id_conversa: ids[i], id_remetente: usuario, texto: `Mensagem temporária ${i}` }, 'application/json')
            assert.equal(enviada.status_code, 201, JSON.stringify(enviada))
        }
        const repetida = await conversas.inserirNovaConversa({ id_anuncio: anuncios[1], id_usuario: u2 }, 'application/json')
        assert.equal(repetida.status_code, 200)
        assert.equal(repetida.response.conversa.id, ids[1])
        for (const usuario of [u1, u2]) {
            const lista = await conversas.listarConversa(usuario)
            assert.equal(lista.status_code, 200, JSON.stringify(lista))
            assert.equal(lista.response.conversa.length, 1)
            const unica = lista.response.conversa[0]
            assert.equal(unica.id, Math.min(...ids))
            assert.deepEqual([...unica.ids_conversas].sort((a,b)=>a-b), [...ids].sort((a,b)=>a-b))
            assert.equal(Number(unica.nao_lidas), usuario === u1 ? 2 : 1)
            const historico = await mensagens.listarMensagem(unica.id, usuario)
            assert.equal(historico.status_code, 200, JSON.stringify(historico))
            assert.equal(historico.response.mensagem.length, 3)
            assert.deepEqual(historico.response.mensagem.map(m => m.id_anuncio), anuncios)
            assert.deepEqual(historico.response.mensagem.map(m => m.anuncio), ['Teste Origem A', 'Teste Origem B', 'Teste Origem C'])
        }
        console.log('PASS: uma entrada por dupla, histórico completo, origem dos três anúncios e papéis invertidos')
        console.log('PASS: contagem de não lidas agregada e reabertura sem duplicar contexto')
        const negada = await mensagens.listarMensagem(ids[0], seed.id || u1 + u2 + 999999)
        assert.equal(negada.status_code, 403)
        const resposta = await mensagens.inserirNovaMensagem({ id_conversa: ids[2], id_remetente: u2, texto: 'Resposta no contexto mais recente.' }, 'application/json')
        assert.equal(resposta.status_code, 201)
        const historico = await mensagens.listarMensagem(ids[0], u1)
        assert.equal(historico.response.mensagem.length, 4)
        const listar = await conversas.listarConversa(u1)
        assert.equal(listar.response.conversa.length, 1)
        assert.equal(listar.response.conversa[0].id_conversa_envio, ids[2])
        console.log('PASS: terceiro usuário bloqueado e resposta preserva o anúncio mais recente')
    } finally {
        require.cache[knexPath].exports = knex
        if (trx) await trx.rollback()
        await db.destroy()
        console.log('Contas, anúncios e mensagens temporários desfeitos por rollback')
    }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1) })
