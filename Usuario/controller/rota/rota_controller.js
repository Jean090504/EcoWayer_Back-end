const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

function coordenadaValida(valor, limite) {
    const numero = Number(valor)
    return Number.isFinite(numero) && numero >= -limite && numero <= limite
}

function duracaoEmSegundos(valor) {
    const match = String(valor || '').match(/^(\d+(?:\.\d+)?)s$/)
    return match ? Number(match[1]) : 0
}

async function calcularRota(request, response) {
    try {
        const { origem, destino } = request.body || {}
        const coordenadas = [origem, destino]

        if (!coordenadas.every((ponto) => ponto &&
            coordenadaValida(ponto.latitude, 90) &&
            coordenadaValida(ponto.longitude, 180))) {
            return response.status(400).json({ status: false, message: 'Origem ou destino inválido.' })
        }

        const chave = process.env.GOOGLE_MAPS_API_KEY
        if (!chave) {
            return response.status(503).json({ status: false, message: 'GOOGLE_MAPS_API_KEY não configurada no backend.' })
        }

        const dados = {
            origin: {
                location: { latLng: { latitude: Number(origem.latitude), longitude: Number(origem.longitude) } }
            },
            destination: {
                location: { latLng: { latitude: Number(destino.latitude), longitude: Number(destino.longitude) } }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            languageCode: 'pt-BR',
            units: 'METRIC'
        }

        const googleResponse = await fetch(ROUTES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': chave,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify(dados)
        })

        const googleData = await googleResponse.json()
        if (!googleResponse.ok || !googleData.routes?.length) {
            console.error('[ROTAS] Google Routes respondeu:', googleData)
            return response.status(502).json({ status: false, message: 'Não foi possível calcular a rota no Google Maps.' })
        }

        const rota = googleData.routes[0]
        const distanciaMetros = Number(rota.distanceMeters || 0)
        const duracaoSegundos = duracaoEmSegundos(rota.duration)

        return response.json({
            status: true,
            response: {
                distancia_metros: distanciaMetros,
                duracao_segundos: duracaoSegundos,
                distancia_texto: distanciaMetros >= 1000
                    ? `${(distanciaMetros / 1000).toFixed(1).replace('.', ',')} km`
                    : `${Math.round(distanciaMetros)} m`,
                duracao_texto: duracaoSegundos >= 3600
                    ? `${Math.floor(duracaoSegundos / 3600)} h ${Math.round((duracaoSegundos % 3600) / 60)} min`
                    : `${Math.max(1, Math.round(duracaoSegundos / 60))} min`,
                polyline: rota.polyline?.encodedPolyline || ''
            }
        })
    } catch (erro) {
        console.error('[ROTAS] Erro ao calcular rota:', erro.message)
        return response.status(500).json({ status: false, message: 'Erro interno ao calcular a rota.' })
    }
}

module.exports = { calcularRota }
