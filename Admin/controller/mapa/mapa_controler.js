const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

function validarCoordenada(valor, limite) {
    const numero = Number(valor)
    return Number.isFinite(numero) && numero >= -limite && numero <= limite
}

function enderecoValido(endereco) {
    return endereco && typeof endereco === 'object' &&
        [endereco.rua, endereco.cidade].every((campo) => typeof campo === 'string' && campo.trim())
}

async function consultarGoogle(params) {
    const chave = process.env.GOOGLE_MAPS_API_KEY
    if (!chave) {
        return { status_code: 503, message: 'GOOGLE_MAPS_API_KEY não configurada no backend.' }
    }

    const url = new URL(GOOGLE_GEOCODE_URL)
    Object.entries({ ...params, key: chave, language: 'pt-BR', region: 'br' })
        .forEach(([nome, valor]) => url.searchParams.set(nome, valor))

    const resposta = await fetch(url)
    if (!resposta.ok) return { status_code: 502, message: 'Google Maps indisponível no momento.' }

    const dados = await resposta.json()
    if (dados.status === 'ZERO_RESULTS') return { status_code: 404, message: 'Nenhum endereço encontrado.' }
    if (dados.status !== 'OK') return { status_code: 502, message: `Google Maps retornou ${dados.status}.` }
    return dados
}

async function geocodificar(request, response) {
    try {
        const endereco = request.body
        if (!enderecoValido(endereco)) {
            return response.status(400).json({ message: 'Informe rua e cidade para geocodificar.' })
        }

        const partes = [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado, endereco.cep, 'Brasil']
            .filter(Boolean)
        const dados = await consultarGoogle({ address: partes.join(', ') })
        if (dados.status_code) return response.status(dados.status_code).json(dados)

        const resultado = dados.results[0]
        return response.json({
            latitude: resultado.geometry.location.lat,
            longitude: resultado.geometry.location.lng,
            endereco_formatado: resultado.formatted_address,
        })
    } catch (erro) {
        console.error('[MAPA] Erro ao geocodificar:', erro.message)
        return response.status(500).json({ message: 'Erro interno ao consultar o Google Maps.' })
    }
}

async function geocodificarReverso(request, response) {
    try {
        const { latitude, longitude } = request.body
        if (!validarCoordenada(latitude, 90) || !validarCoordenada(longitude, 180)) {
            return response.status(400).json({ message: 'Latitude ou longitude inválida.' })
        }

        const dados = await consultarGoogle({ latlng: `${latitude},${longitude}` })
        if (dados.status_code) return response.status(dados.status_code).json(dados)

        const resultado = dados.results[0]
        const componentes = Object.fromEntries((resultado.address_components || [])
            .flatMap((componente) => componente.types.map((tipo) => [tipo, componente.long_name])))

        return response.json({
            rua: componentes.route || '',
            numero: componentes.street_number || '',
            bairro: componentes.sublocality_level_1 || componentes.neighborhood || '',
            cep: componentes.postal_code || '',
            cidade: componentes.locality || componentes.administrative_area_level_2 || '',
            estado: componentes.administrative_area_level_1 || '',
            sigla: (resultado.address_components || []).find((componente) => componente.types.includes('administrative_area_level_1'))?.short_name || '',
            endereco_formatado: resultado.formatted_address,
        })
    } catch (erro) {
        console.error('[MAPA] Erro na geocodificação reversa:', erro.message)
        return response.status(500).json({ message: 'Erro interno ao consultar o Google Maps.' })
    }
}

module.exports = { geocodificar, geocodificarReverso }
