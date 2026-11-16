const assert = require('node:assert/strict')
const path = require('node:path')
const { randomInt, randomUUID } = require('node:crypto')
const root = process.cwd()
const knexPath = require.resolve('knex', { paths: [root] })
const knex = require(knexPath)
const db = knex(require(path.join(root, 'model/database_config_knex/knexFile.js')).development)
function cpf() {
    const digitos = Array.from({ length: 9 }, () => randomInt(0, 10))
    for (let tamanho = 9; tamanho <= 10; tamanho++) {
        const soma = digitos.reduce((total, valor, i) => total + valor * (tamanho + 1 - i), 0)
        const resto = (soma * 10) % 11
        digitos.push(resto === 10 ? 0 : resto)
    }
    return digitos.join('')
}
;(async () => {
    let trx
    try {
        trx = await db.transaction()
        require.cache[knexPath].exports = () => trx
        const usuarios = require(path.join(root, 'controller/usuario/usuario_controler.js'))
        const conversas = require(path.join(root, 'controller/conversa/conversa_controler.js'))
        const mensagens = require(path.join(root, 'controller/mensagens/mensagens_controler.js'))
        require.cache[knexPath].exports = knex
        const genero = await trx('tbl_genero').first('id')
        const payload = () => ({ nome: 'Conta temporária de regressão', cpf: cpf(), data_nascimento: '2000-01-01', id_genero: genero.id, email: `${randomUUID()}@example.com`, telefone: `119${randomInt(10000000, 99999999)}`, senha: 'TesteSeguro123' })
        const primeira = payload()
        const criada = await usuarios.inserirNovoUsuario(primeira, 'application/json')
        assert.equal(criada.status_code, 201, JSON.stringify(criada))
        const u1 = criada.response.usuario.id
        assert.deepEqual(criada.response.usuario.enderecos, [])
        assert.equal((await trx('tbl_endereco_usuario').where({ id_usuario: u1 })).length, 0)
        assert.equal(criada.response.token, undefined)
        const login = await usuarios.loginUsuario(primeira.email, primeira.senha)
        assert.equal(login.status_code, 200)
        assert.ok(login.response.token)
        const invalido = await usuarios.inserirNovoUsuario({ ...payload(), id_genero: 2147483647 }, 'application/json')
        assert.equal(invalido.status_code, 400)
        const enderecoInvalido = await usuarios.inserirNovoUsuario({ ...payload(), id_endereco: 2147483647 }, 'application/json')
        assert.equal(enderecoInvalido.status_code, 400)
        const segunda = await usuarios.inserirNovoUsuario(payload(), 'application/json')
        assert.equal(segunda.status_code, 201, JSON.stringify(segunda))
        const u2 = segunda.response.usuario.id
        console.log('PASS: cadastro sem endereço, gênero escolhido, referências inválidas rejeitadas e login separado')
        const base = await trx('tbl_anuncio').first()
        delete base.id
        const ids = []
        for (let i = 0; i < 2; i++) {
            const [idAnuncio] = await trx('tbl_anuncio').insert({ ...base, nome: `Teste leitura ${i}`, id_usuario: u1, status: 'ativo' })
            const conversa = await conversas.inserirNovaConversa({ id_anuncio: idAnuncio, id_usuario: u2 }, 'application/json')
            assert.equal(conversa.status_code, 201)
            ids.push(conversa.response.conversa.id)
        }
        const enviar = async (idConversa, remetente) => {
            const r = await mensagens.inserirNovaMensagem({ id_conversa: idConversa, id_remetente: remetente, texto: 'Mensagem temporária de teste.' }, 'application/json')
            assert.equal(r.status_code, 201, JSON.stringify(r))
            return r.response.mensagem.id
        }
        const m1 = await enviar(ids[0], u2)
        const m2 = await enviar(ids[1], u2)
        const minha = await enviar(ids[0], u1)
        const posterior = await enviar(ids[1], u2)
        const negada = await mensagens.marcarConversaLida(ids[0], posterior, u1 + u2 + 999999)
        assert.equal(negada.status_code, 403)
        const lidas = await mensagens.marcarConversaLida(ids[0], m2, u1)
        assert.equal(lidas.status_code, 200)
        assert.equal(lidas.response.lidas, 2)
        const estados = await trx('tbl_mensagens').whereIn('id', [m1, m2, minha, posterior]).select('id', 'lida')
        const estado = id => Number(estados.find(m => m.id === id).lida)
        assert.equal(estado(m1), 1)
        assert.equal(estado(m2), 1)
        assert.equal(estado(minha), 0)
        assert.equal(estado(posterior), 0)
        console.log('PASS: leitura em lote cobre anúncios da dupla sem ler mensagens posteriores ou enviadas pelo próprio usuário')
    } finally {
        require.cache[knexPath].exports = knex
        if (trx) await trx.rollback()
        await db.destroy()
        console.log('Registros temporários desfeitos por rollback')
    }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1) })
