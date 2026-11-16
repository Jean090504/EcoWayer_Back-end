const jwt = require('jsonwebtoken')

const publicPrefixes = [
    '/verificacao',
    '/email_verificacao',
    '/telefone_verificacao',
    '/tipo_categoria',
    '/genero',
    '/categoria',
    '/item',
    '/ponto_coleta',
    '/material_aceito',
    '/tipo_imagem',
    '/nivel_impacto',
    '/status_usuario',
    '/voucher_catalogo',
    '/missao',
    '/insignia',
    '/anuncio',
    '/imagem_anuncio',
]

function ePublica(request) {
    if (request.method === 'OPTIONS') return true
    if (request.path === '/usuario' && request.method === 'POST') return true
    if (request.path === '/endereco' && request.method === 'POST') return true
    if (request.path === '/usuario/login' && request.method === 'POST') return true
    if (request.path === '/usuario/logout' && request.method === 'POST') return true
    return request.method === 'GET' && publicPrefixes.some((prefix) => request.path === prefix || request.path.startsWith(`${prefix}/`))
}

module.exports = function autenticacaoUsuario(request, response, next) {
    if (ePublica(request)) return next()

    const autorizacao = request.headers.authorization || ''
    const [tipo, tokenAutorizacao] = autorizacao.split(' ')
    const tokenCookie = String(request.headers.cookie || '').split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('ecowayer_token='))
        ?.slice('ecowayer_token='.length)
    const token = tipo === 'Bearer' ? tokenAutorizacao : tokenCookie
    const segredo = process.env.JWT_SECRET

    if (!segredo) return response.status(500).json({ status: false, status_code: 500, message: 'JWT_SECRET não configurado no servidor.' })
    if ((!tokenCookie && tipo !== 'Bearer') || !token) return response.status(401).json({ status: false, status_code: 401, message: 'Token de acesso não informado.' })

    try {
        const usuario = jwt.verify(token, segredo)
        if (usuario.tipo !== 'usuario') return response.status(403).json({ status: false, status_code: 403, message: 'Acesso restrito ao usuário autenticado.' })
        const idInformado = request.body?.id_usuario ?? request.query?.id_usuario
        if (idInformado !== undefined && Number(idInformado) !== Number(usuario.id)) {
            return response.status(403).json({ status: false, status_code: 403, message: 'Você não pode acessar dados de outro usuário.' })
        }
        request.usuario = usuario
        return next()
    } catch {
        return response.status(401).json({ status: false, status_code: 401, message: 'Token inválido ou expirado.' })
    }
}
