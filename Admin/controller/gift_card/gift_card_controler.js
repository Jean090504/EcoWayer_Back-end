const giftCardDAO = require('../../model/DAO/gift_card/gift_card.js')

const resposta = (status_code, message, response = {}) => ({ status: status_code < 400, status_code, message, response })
const idValido = (id) => /^\d+$/.test(String(id)) && Number(id) > 0
const textoValido = (value, max) => typeof value === 'string' && value.trim() && value.trim().length <= max

const validar = (giftCard) => {
    if (!giftCard || typeof giftCard !== 'object' || Array.isArray(giftCard)) return 'Dados inválidos.'
    if (!textoValido(giftCard.nome, 150)) return 'Informe um nome válido para o gift card.'
    if (!textoValido(giftCard.slug_api, 150)) return 'Informe o identificador da API.'
    if (!Number.isFinite(Number(giftCard.valor_reais)) || Number(giftCard.valor_reais) <= 0) return 'Informe um valor em reais maior que zero.'
    if (!Number.isInteger(Number(giftCard.pontos_resgate)) || Number(giftCard.pontos_resgate) <= 0) return 'Informe uma quantidade de pontos maior que zero.'
    if (!['ativo', 'inativo'].includes(String(giftCard.status))) return 'O status deve ser ativo ou inativo.'
    return null
}

const listarGiftCards = async function () {
    const result = await giftCardDAO.selectAllGiftCard()
    return result === false ? resposta(500, 'Não foi possível listar os gift cards.') : resposta(200, 'Gift cards listados.', { giftCards: result })
}

const sincronizarCatalogo = async function () {
    try {
        const apiResponse = await fetch('https://giftcards.bidali.com/api/v1/countries/brazil/brands?limit=100')
        if (!apiResponse.ok) return resposta(502, 'A API pública de gift cards não está disponível no momento.')

        const catalogo = await apiResponse.json()
        const giftCards = (catalogo.data || []).map((item) => ({
            slug_api: item.slug,
            nome: item.name,
            valor_reais: 50,
            pontos_resgate: 2500,
            imagem_url: item.imageUrl || null,
            categoria: item.categories?.[0]?.name || 'Gift card',
            status: 'ativo'
        }))

        if (!await giftCardDAO.upsertGiftCards(giftCards)) return resposta(500, 'Não foi possível salvar o catálogo.')
        return resposta(200, 'Catálogo sincronizado.', { quantidade: giftCards.length, giftCards })
    } catch (error) {
        console.log(error)
        return resposta(502, 'Não foi possível acessar a API pública de gift cards.')
    }
}

const inserirGiftCard = async function (giftCard) {
    const erro = validar(giftCard)
    if (erro) return resposta(400, erro)
    const id = await giftCardDAO.insertGiftCard({
        slug_api: giftCard.slug_api.trim(), nome: giftCard.nome.trim(), valor_reais: Number(giftCard.valor_reais),
        pontos_resgate: Number(giftCard.pontos_resgate), imagem_url: giftCard.imagem_url || null,
        categoria: giftCard.categoria || 'Gift card', status: giftCard.status
    })
    return id ? resposta(201, 'Gift card criado.', { id }) : resposta(500, 'Não foi possível criar o gift card. Verifique se ele já existe.')
}

const atualizarGiftCard = async function (giftCard, id) {
    if (!idValido(id)) return resposta(400, 'ID inválido.')
    const erro = validar(giftCard)
    if (erro) return resposta(400, erro)
    const existe = await giftCardDAO.selectByIdGiftCard(Number(id))
    if (!existe || !existe.length) return resposta(404, 'Gift card não encontrado.')
    const atualizado = await giftCardDAO.updateGiftCard({
        id: Number(id), nome: giftCard.nome.trim(), valor_reais: Number(giftCard.valor_reais),
        pontos_resgate: Number(giftCard.pontos_resgate), imagem_url: giftCard.imagem_url || null,
        categoria: giftCard.categoria || 'Gift card', status: giftCard.status
    })
    return atualizado ? resposta(200, 'Gift card atualizado.') : resposta(500, 'Não foi possível atualizar o gift card.')
}

const excluirGiftCard = async function (id) {
    if (!idValido(id)) return resposta(400, 'ID inválido.')
    const excluido = await giftCardDAO.deleteGiftCard(Number(id))
    return excluido ? resposta(200, 'Gift card excluído.') : resposta(404, 'Gift card não encontrado.')
}

module.exports = { listarGiftCards, sincronizarCatalogo, inserirGiftCard, atualizarGiftCard, excluirGiftCard }
