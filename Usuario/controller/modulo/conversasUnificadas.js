const chaveDupla = conversa => [Number(conversa.id_interessado), Number(conversa.id_anunciante)].sort((a, b) => a - b).join(':')
const ordemRecente = (a, b) => String(b.ultimo_envio || '').localeCompare(String(a.ultimo_envio || '')) || Number(b.ultimo_id || 0) - Number(a.ultimo_id || 0) || Number(b.id) - Number(a.id)

function agruparConversas(conversas) {
    const grupos = new Map()
    for (const conversa of [...conversas].sort(ordemRecente)) {
        const chave = chaveDupla(conversa)
        if (!grupos.has(chave)) grupos.set(chave, { ...conversa, id_conversa_envio: conversa.id, ids_conversas: [], nao_lidas: 0 })
        const grupo = grupos.get(chave)
        grupo.ids_conversas.push(Number(conversa.id))
        grupo.id = Math.min(Number(grupo.id), Number(conversa.id))
        grupo.nao_lidas += Number(conversa.nao_lidas || 0)
    }
    return [...grupos.values()]
}

module.exports = { agruparConversas, chaveDupla }
