const { consultarSessao, lerToken, verificarToken } = require('../model/sessaoUsuario.js')

const publicPrefixes = [
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

module.exports = async function autenticacaoUsuario(request, response, next) {
    if (ePublica(request)) return next()

    const token = lerToken(request)
    const segredo = process.env.JWT_SECRET
    if (!segredo) return response.status(500).json({ status: false, status_code: 500, message: 'Autenticação indisponível.' })

    const usuario = verificarToken(token, segredo)
    if (!usuario) return response.status(401).json({ status: false, status_code: 401, message: 'Token inválido ou expirado.' })
    if (usuario.tipo !== 'usuario') return response.status(403).json({ status: false, status_code: 403, message: 'Acesso restrito ao usuário autenticado.' })

    try {
        if (!await consultarSessao(usuario, segredo)) {
            return response.status(401).json({ status: false, status_code: 401, message: 'Sessão encerrada. Entre novamente.' })
        }
    } catch (erro) {
        console.error('Falha ao consultar sessão:', erro.code || erro.name)
        return response.status(503).json({ status: false, status_code: 503, message: 'Autenticação temporariamente indisponível.' })
    }

    const idInformado = request.body?.id_usuario ?? request.query?.id_usuario
    if (idInformado !== undefined && Number(idInformado) !== Number(usuario.id)) {
        return response.status(403).json({ status: false, status_code: 403, message: 'Você não pode acessar dados de outro usuário.' })
    }
    request.usuario = usuario
    return next()
}
