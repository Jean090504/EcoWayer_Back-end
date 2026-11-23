const express = require('express')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { validarSenha } = require('../controller/modulo/validacaoSenha.js')

const UFS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '))
function falha(status, message) { const e = new Error(message); e.status = status; throw e }
const texto = valor => typeof valor === 'string' ? valor.trim() : ''
function validar(dados) {
    if (!dados || typeof dados !== 'object') falha(400, 'Dados de perfil inválidos.')
    const nome = texto(dados.nome)
    const email = texto(dados.email).toLowerCase()
    const telefone = texto(dados.telefone).replace(/\D/g, '')
    if (nome.length < 2 || nome.length > 255) falha(400, 'Informe seu nome completo (2 a 255 caracteres).')
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) falha(400, 'Informe um e-mail válido.')
    if (email !== texto(dados.confirmar_email).toLowerCase()) falha(400, 'A confirmação do e-mail não confere.')
    if (!/^\d{10,11}$/.test(telefone)) falha(400, 'Informe um telefone com DDD (10 ou 11 dígitos).')
    if (dados.senha) {
        const erro = validarSenha(dados.senha)
        if (erro) falha(400, erro)
        if (dados.senha !== dados.confirmar_senha) falha(400, 'A confirmação da senha não confere.')
    }
    let endereco
    if (dados.endereco !== undefined) {
        if (!dados.endereco || typeof dados.endereco !== 'object') falha(400, 'Endereço inválido.')
        const a = dados.endereco
        const campos = { cep: 9, rua: 100, numero: 10, complemento: 50, bairro: 100, cidade: 100, estado: 100, sigla: 2 }
        if (Object.keys(campos).some(c => texto(a[c]))) {
            endereco = Object.fromEntries(Object.keys(campos).map(c => [c, texto(a[c])]))
            endereco.sigla = endereco.sigla.toUpperCase()
            if (!/^\d{5}-?\d{3}$/.test(endereco.cep)) falha(400, 'Informe um CEP válido.')
            if (!UFS.has(endereco.sigla)) falha(400, 'Selecione uma UF válida.')
            for (const [campo, maximo] of Object.entries(campos)) {
                if ((campo !== 'complemento' && !endereco[campo]) || endereco[campo].length > maximo) falha(400, `Confira o campo ${campo} do endereço.`)
            }
        }
    }
    let foto
    if (dados.foto_url !== undefined) {
        foto = texto(dados.foto_url)
        if (foto) {
            let url
            try { url = new URL(foto) } catch { falha(400, 'Informe uma URL válida para a foto.') }
            if (url.protocol !== 'https:' || foto.length > 255 || url.username || url.password) falha(400, 'A foto deve ter uma URL HTTPS de até 255 caracteres.')
        }
    }
    return { nome, email, telefone, endereco, foto }
}

async function consultar(db, id) {
    const usuario = await db('tbl_usuario as u')
        .leftJoin('tbl_email as e', 'e.id_usuario', 'u.id')
        .leftJoin('tbl_telefone as t', 't.id_usuario', 'u.id')
        .leftJoin('tbl_imagem as i', 'i.id', 'u.id_imagem')
        .select('u.id', 'u.nome', 'u.data_nascimento', 'u.data_cadastro', 'u.id_genero', 'u.id_imagem', 'e.email', 't.numero as telefone', 'i.url as imagem').where('u.id', id).first()
    if (!usuario) falha(404, 'Usuário não encontrado.')
    usuario.enderecos = await db('tbl_endereco_usuario as eu').join('tbl_endereco as e', 'e.id', 'eu.id_endereco').where('eu.id_usuario', id).select('e.*').orderBy('eu.id')
    return usuario
}

async function salvar(db, id, dados) {
    const valores = validar(dados)
    return db.transaction(async trx => {
        const usuario = await trx('tbl_usuario').where({ id }).forUpdate().first()
        if (!usuario) falha(404, 'Usuário não encontrado.')
        const email = await trx('tbl_email').where({ id_usuario: id }).orderBy('id').first()
        const conta = email && await trx('tbl_conta').where({ id_email: email.id }).first()
        const mudouEmail = valores.email !== email?.email?.toLowerCase()
        if (mudouEmail || dados.senha) {
            if (!conta || typeof dados.senha_atual !== 'string' || !await bcrypt.compare(dados.senha_atual, conta.senha)) falha(400, 'Informe sua senha atual corretamente para alterar e-mail ou senha.')
        }
        if (await trx('tbl_email').whereRaw('LOWER(email) = ?', [valores.email]).whereNot('id_usuario', id).first()) falha(409, 'Este e-mail já está em uso.')
        if (await trx('tbl_telefone').where({ numero: valores.telefone }).whereNot('id_usuario', id).first()) falha(409, 'Este telefone já está em uso.')
        const atualizacao = { nome: valores.nome }
        if (valores.foto) {
            const atual = await trx('tbl_imagem').where({ id: usuario.id_imagem }).first()
            if (valores.foto !== atual?.url) {
                const tipo = await trx('tbl_tipo_imagem').where({ tipo: 'perfil' }).first()
                if (!tipo) falha(500, 'Tipo de imagem de perfil não configurado.')
                const [idImagem] = await trx('tbl_imagem').insert({ url: valores.foto, id_tipo_imagem: tipo.id })
                atualizacao.id_imagem = idImagem
            }
        }
        await trx('tbl_usuario').where({ id }).update(atualizacao)
        if (mudouEmail) await trx('tbl_email').where({ id: email.id }).update({ email: valores.email, codigo_verificacao: String(crypto.randomInt(100000, 1000000)) })
        const telefone = await trx('tbl_telefone').where({ id_usuario: id }).orderBy('id').first()
        if (!telefone) await trx('tbl_telefone').insert({ id_usuario: id, numero: valores.telefone, codigo_verificacao: String(crypto.randomInt(100000, 1000000)) })
        else if (telefone.numero !== valores.telefone) await trx('tbl_telefone').where({ id: telefone.id }).update({ numero: valores.telefone, codigo_verificacao: String(crypto.randomInt(100000, 1000000)) })
        if (dados.senha) await trx('tbl_conta').where({ id: conta.id }).update({ senha: await bcrypt.hash(dados.senha, 10) })
        if (valores.endereco) {
            const vinculo = await trx('tbl_endereco_usuario').where({ id_usuario: id }).orderBy('id').first()
            const anterior = vinculo && await trx('tbl_endereco').where({ id: vinculo.id_endereco }).first()
            const mudou = !anterior || Object.entries(valores.endereco).some(([chave, valor]) => String(anterior[chave] || '') !== valor)
            if (mudou) {
                // Novo endereço evita alterar vínculos compartilhados com outro usuário ou EcoPonto.
                const [idEndereco] = await trx('tbl_endereco').insert({ ...valores.endereco, id_externo: `perfil:${id}:${crypto.randomUUID()}` })
                if (vinculo) await trx('tbl_endereco_usuario').where({ id: vinculo.id }).update({ id_endereco: idEndereco })
                else await trx('tbl_endereco_usuario').insert({ id_usuario: id, id_endereco: idEndereco })
            }
        }
        return consultar(trx, id)
    })
}

function criarRouter(db) {
    const router = express.Router()
    router.use('/:id/perfil', (req, res, next) => {
        if (!/^\d+$/.test(req.params.id) || Number(req.params.id) !== Number(req.usuario?.id)) return res.status(403).json({ message: 'Você só pode editar o próprio perfil.' })
        next()
    })
    const executar = operacao => async (req, res) => {
        try { res.json({ status: true, status_code: 200, response: { usuario: await operacao(db, Number(req.params.id), req.body) } }) }
        catch (erro) {
            const status = erro.status || (erro.code === 'ER_DUP_ENTRY' ? 409 : 500)
            if (status === 500) console.error('Falha ao atualizar perfil:', erro.code || erro.message)
            res.status(status).json({ status: false, status_code: status, message: erro.status ? erro.message : status === 409 ? 'E-mail ou telefone já cadastrado.' : 'Não foi possível salvar os dados do perfil.' })
        }
    }
    router.get('/:id/perfil', executar(consultar))
    router.patch('/:id/perfil', executar(salvar))
    return router
}
module.exports = { criarRouter, validar, salvar, consultar }
