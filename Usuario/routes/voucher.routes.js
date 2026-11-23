/***************************************************************
 *  Objetivo: Arquivo responsavel pelas rotas da tabela tbl_voucher
 *  Autor: Gustavo
 *  Versão: 1.0
 ***************************************************************/

const express = require('express')
const bodyParserJSON = express.json()

const resgate = require('../model/DAO/voucher/resgate.js')
const controllerVoucher = require('../controller/voucher/voucher_controler.js')
const { exigirProprietario, listarSomenteProprietario } = require('../middleware/proprietario.js')

const router = express.Router()

router.get('/saldo', async (req, res) => {
    try {
        const saldo = await resgate.consultarSaldo(req.usuario.id)
        res.json({ response: { saldo } })
    } catch (erro) {
        console.error('Saldo do resgate:', erro.code || erro.name)
        res.status(500).json({ message: 'Não foi possível consultar o saldo.' })
    }
})

router.post('/resgatar', bodyParserJSON, async (req, res) => {
    const { id_voucher_catalogo: id, solicitacao, pontos_confirmados: pontos } = req.body || {}
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(pontos) || pontos <= 0 || typeof solicitacao !== 'string' ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(solicitacao)) {
        return res.status(400).json({ message: 'Informe um benefício e uma solicitação válidos.' })
    }
    try {
        const resultado = await resgate.resgatar(Number(req.usuario.id), id, solicitacao.toLowerCase(), pontos)
        if (resultado.erro === 'usuario') return res.status(401).json({ message: 'Usuário não autenticado.' })
        if (resultado.erro === 'catalogo') return res.status(404).json({ message: 'Este benefício não está disponível.' })
        if (resultado.erro === 'saldo') return res.status(409).json({ message: 'Você não tem EcoPontos suficientes para resgatar este benefício.' })
        if (resultado.erro === 'custo') return res.status(409).json({ message: 'O custo deste benefício mudou. Atualize a página antes de resgatar.' })
        if (resultado.erro === 'solicitacao') return res.status(409).json({ message: 'Esta solicitação já foi usada para outro benefício.' })
        res.status(resultado.repetido ? 200 : 201).json({ response: { voucher: resultado.voucher, saldo: resultado.saldo } })
    } catch (erro) {
        if (erro.code === 'ER_SIGNAL_EXCEPTION' && erro.sqlMessage === 'Saldo insuficiente para debito') {
            return res.status(409).json({ message: 'Você não tem EcoPontos suficientes para resgatar este benefício.' })
        }
        console.error('Resgate de voucher:', erro.code || erro.name)
        res.status(500).json({ message: 'Não foi possível resgatar o benefício. Tente novamente.' })
    }
})

// POST /  -> cria um voucher
router.post('/', bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucher.inserirNovoVoucher({ ...request.body, id_usuario: request.usuario.id }, contentType)

    response.status(result.status_code)
    response.json(result)
})

// GET /  -> lista os vouchers
router.get('/', listarSomenteProprietario(controllerVoucher.listarVouchers, 'voucher'))

// GET /:id  -> busca um voucher pelo id
router.get('/:id', exigirProprietario(controllerVoucher.buscarVoucher, 'voucher'), async function (request, response) {
    let result = await controllerVoucher.buscarVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

// PUT /:id  -> atualiza um voucher (id na URL, body no segundo argumento)
router.put('/:id', exigirProprietario(controllerVoucher.buscarVoucher, 'voucher'), bodyParserJSON, async function (request, response) {
    let contentType = request.headers['content-type']
    let result = await controllerVoucher.atualizarVoucher(request.params.id, request.body, contentType)

    response.status(result.status_code)
    response.json(result)
})

// DELETE /:id  -> exclui um voucher (bloqueado se houver QR Code vinculado)
router.delete('/:id', exigirProprietario(controllerVoucher.buscarVoucher, 'voucher'), async function (request, response) {
    let result = await controllerVoucher.excluirVoucher(request.params.id)

    response.status(result.status_code)
    response.json(result)
})

module.exports = router
