const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'

async function geocodificar(request, response) {
    try {
        const consulta = String(request.body?.consulta || '').trim()
        const chave = process.env.GOOGLE_MAPS_API_KEY

        if (consulta.length < 2) {
            return response.status(400).json({ status: false, status_code: 400, message: 'Informe uma cidade ou endereço.' })
        }
        if (!chave) {
            return response.status(503).json({ status: false, status_code: 503, message: 'GOOGLE_MAPS_API_KEY não configurada no backend.' })
        }

        const url = new URL(GOOGLE_GEOCODE_URL)
        url.searchParams.set('address', `${consulta}, Brasil`)
        url.searchParams.set('key', chave)
        url.searchParams.set('language', 'pt-BR')
        url.searchParams.set('region', 'br')

        const googleResponse = await fetch(url)
        const googleData = await googleResponse.json()
        if (!googleResponse.ok || googleData.status !== 'OK' || !googleData.results?.length) {
            return response.status(404).json({ status: false, status_code: 404, message: 'Cidade ou endereço não encontrado.' })
        }

        const resultado = googleData.results[0]
        return response.json({
            status: true,
            status_code: 200,
            response: {
                latitude: resultado.geometry.location.lat,
                longitude: resultado.geometry.location.lng,
                endereco_formatado: resultado.formatted_address
            }
        })
    } catch (erro) {
        console.error('[MAPA USUARIO] Erro ao pesquisar localização:', erro.message)
        return response.status(500).json({ status: false, status_code: 500, message: 'Erro interno ao pesquisar a localização.' })
    }
}

async function buscarLocaisReciclagem(request, response) {
    try {
        const latitude = Number(request.body?.latitude)
        const longitude = Number(request.body?.longitude)
        const chave = process.env.GOOGLE_MAPS_API_KEY

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return response.status(400).json({ status: false, status_code: 400, message: 'Coordenadas inválidas.' })
        }
        if (!chave) {
            return response.status(503).json({ status: false, status_code: 503, message: 'GOOGLE_MAPS_API_KEY não configurada no backend.' })
        }

        const consultas = [
            'pontos de reciclagem e coleta seletiva',
            'ferro velho e sucata',
            'descarte de resíduos recicláveis'
        ]
        const locais = new Map()

        for (const textQuery of consultas) {
            const googleResponse = await fetch(GOOGLE_PLACES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': chave,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri'
                },
                body: JSON.stringify({
                    textQuery,
                    languageCode: 'pt-BR',
                    regionCode: 'BR',
                    maxResultCount: 20,
                    rankPreference: 'DISTANCE',
                    locationBias: {
                        circle: {
                            center: { latitude, longitude },
                            radius: 10000
                        }
                    }
                })
            })
            const googleData = await googleResponse.json()
            if (!googleResponse.ok) {
                console.error('[MAPA USUARIO] Google Places respondeu:', googleData)
                continue
            }

            for (const local of googleData.places || []) {
                const localizacao = local.location
                if (!local.id || !localizacao) continue
                locais.set(local.id, {
                    id: local.id,
                    nome: local.displayName?.text || 'Local de reciclagem',
                    endereco: local.formattedAddress || '',
                    latitude: Number(localizacao.latitude),
                    longitude: Number(localizacao.longitude),
                    maps_url: local.googleMapsUri || ''
                })
            }
        }

        return response.json({
            status: true,
            status_code: 200,
            response: { locais: Array.from(locais.values()).slice(0, 50) }
        })
    } catch (erro) {
        console.error('[MAPA USUARIO] Erro ao buscar locais de reciclagem:', erro.message)
        return response.status(500).json({ status: false, status_code: 500, message: 'Erro interno ao buscar locais próximos.' })
    }
}

module.exports = { geocodificar, buscarLocaisReciclagem }
