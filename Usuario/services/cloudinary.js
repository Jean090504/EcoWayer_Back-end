const tiposImagem = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

async function enviarFotoAnuncio(buffer, extensao) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) {
        throw Object.assign(new Error('O armazenamento de fotos dos anúncios não está configurado.'), { status: 503 })
    }

    const body = new FormData()
    body.append('file', new Blob([buffer], { type: tiposImagem[extensao] }), `foto.${extensao}`)
    body.append('upload_preset', preset)

    try {
        const resposta = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
            method: 'POST',
            body,
            signal: AbortSignal.timeout(15000)
        })
        if (!resposta.ok) throw new Error(`Cloudinary respondeu HTTP ${resposta.status}.`)

        const { secure_url: url } = await resposta.json()
        const destino = new URL(url)
        if (destino.origin !== 'https://res.cloudinary.com' ||
            !destino.pathname.startsWith(`/${cloudName}/image/upload/`)) {
            throw new Error('URL de entrega inesperada.')
        }
        return url
    } catch (error) {
        throw Object.assign(new Error('Não foi possível enviar a foto ao Cloudinary. Tente novamente.', { cause: error }), { status: 502 })
    }
}

module.exports = { enviarFotoAnuncio }
