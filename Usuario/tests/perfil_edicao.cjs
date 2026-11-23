const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const bcrypt = require('bcrypt')
const db = require('knex')(require('../model/database_config_knex/knexFile.js').development)
const { salvar, consultar, validar, criarRouter } = require('../routes/perfil.routes.js')
async function executar() {
    const trx = await db.transaction()
    try {
        const seed = await trx('tbl_usuario').first()
        assert.ok(seed, 'Necessário um usuário base para as referências')
        const novo = { ...seed, nome: 'Teste temporário de perfil', cpf: String(crypto.randomInt(10000000000, 99999999999)) }
        delete novo.id
        const [id] = await trx('tbl_usuario').insert(novo)
        const email = `perfil-${crypto.randomUUID()}@example.com`
        const telefone = `119${crypto.randomInt(10000000, 99999999)}`
        const [idEmail] = await trx('tbl_email').insert({ email, id_usuario: id, codigo_verificacao: '123456' })
        await trx('tbl_conta').insert({ id_email: idEmail, senha: await bcrypt.hash('TesteSeguro123', 10) })
        await trx('tbl_telefone').insert({ id_usuario: id, numero: telefone, codigo_verificacao: '123456' })
        const base = { nome: 'Nome atualizado', email, confirmar_email: email, telefone }
        const a = await salvar(trx, id, base)
        assert.equal(a.nome, base.nome)
        assert.equal(a.id_genero, seed.id_genero)
        assert.equal(a.id_imagem, seed.id_imagem)
        assert.equal(a.enderecos.length, 0)
        assert.equal(a.senha, undefined)
        const endereco = { cep: '01001-000', rua: 'Praça da Sé', numero: '10', complemento: '', bairro: 'Sé', cidade: 'São Paulo', estado: 'São Paulo', sigla: 'SP' }
        const b = await salvar(trx, id, { ...base, endereco })
        assert.equal(b.enderecos[0].rua, endereco.rua)
        const idOriginal = b.enderecos[0].id
        const c = await salvar(trx, id, { ...base, endereco: { ...endereco, numero: '20' } })
        assert.notEqual(c.enderecos[0].id, idOriginal)
        assert.equal((await trx('tbl_endereco').where({ id: idOriginal }).first()).numero, '10')
        await assert.rejects(salvar(trx, id, { ...base, nome: 'Não deve salvar', endereco: { ...endereco, cep: 'x' } }), { status: 400 })
        assert.equal((await consultar(trx, id)).nome, base.nome)
        const novoEmail = `novo-${crypto.randomUUID()}@example.com`
        await assert.rejects(salvar(trx, id, { ...base, email: novoEmail, confirmar_email: novoEmail }), { status: 400 })
        const atualizado = await salvar(trx, id, { ...base, email: novoEmail, confirmar_email: novoEmail, senha_atual: 'TesteSeguro123', senha: 'NovaSenhaSegura123', confirmar_senha: 'NovaSenhaSegura123' })
        assert.equal(atualizado.email, novoEmail)
        assert.ok(await bcrypt.compare('NovaSenhaSegura123', (await trx('tbl_conta').where({ id_email: idEmail }).first()).senha))
        assert.equal(atualizado.senha, undefined)
        assert.throws(() => validar({ ...base, foto_url: 'javascript:alert(1)' }), { status: 400 })
        const outroEmail = await trx('tbl_email').whereNot('id_usuario', id).first()
        if (outroEmail) await assert.rejects(salvar(trx, id, { ...base, email: outroEmail.email, confirmar_email: outroEmail.email, senha_atual: 'NovaSenhaSegura123' }), { status: 409 })
        // Testa a restrição de propriedade na rota real.
        const app = require('express')()
        app.use((req, _res, next) => { req.usuario = { id: id + 1 }; next() })
        app.use(criarRouter(trx))
        const server = app.listen(0, '127.0.0.1')
        try {
            await new Promise(resolve => server.once('listening', resolve))
            const resposta = await fetch(`http://127.0.0.1:${server.address().port}/${id}/perfil`)
            assert.equal(resposta.status, 403)
        } finally { await new Promise(resolve => server.close(resolve)) }
        console.log('PASS: nome, referências preservadas, criação e edição de endereço, rollback de erro, e-mail, hash de senha, duplicidade, URL e propriedade')
    } finally { await trx.rollback(); await db.destroy() }
}
executar().catch(e => { console.error(e); process.exitCode = 1 })
