function mensagemAcessoNegado() {
    return { status: false, status_code: 403, message: 'Você não pode acessar dados de outro usuário.' }
}

function itemDaResposta(result, chave) {
    return result?.response?.[chave] ?? result?.[chave]
}

function exigirProprietario(buscar, chave) {
    return async function (request, response, next) {
        const result = await buscar(request.params.id)
        const item = itemDaResposta(result, chave)
        if (!result?.status || !item || Number(item.id_usuario) !== Number(request.usuario.id)) {
            return response.status(403).json(mensagemAcessoNegado())
        }
        return next()
    }
}

function listarSomenteProprietario(listar, chave) {
    return async function (request, response) {
        const result = await listar()
        const itens = itemDaResposta(result, chave)
        if (!result?.status || !Array.isArray(itens)) return response.status(result?.status_code || 500).json(result)
        result.response[chave] = itens.filter((item) => Number(item.id_usuario) === Number(request.usuario.id))
        result.response.count = result.response[chave].length
        return response.status(result.status_code).json(result)
    }
}

module.exports = { exigirProprietario, listarSomenteProprietario }
