function requisitosSenha(senha) {
    const valor = typeof senha === 'string' ? senha : ''
    return [
        { id: 'tamanho', texto: 'Entre 8 e 50 caracteres', valido: valor.length >= 8 && valor.length <= 50 },
        { id: 'maiuscula', texto: 'Pelo menos uma letra maiúscula (A–Z)', valido: /[A-Z]/.test(valor) },
        { id: 'minuscula', texto: 'Pelo menos uma letra minúscula (a–z)', valido: /[a-z]/.test(valor) },
        { id: 'numero', texto: 'Pelo menos um número', valido: /\d/.test(valor) }
    ]
}

function validarSenha(senha) {
    const pendentes = requisitosSenha(senha).filter(item => !item.valido)
    return pendentes.length ? `Confira sua senha: ${pendentes.map(item => item.texto.toLowerCase()).join('; ')}.` : ''
}

module.exports = { requisitosSenha, validarSenha }
