const jwt = require('jsonwebtoken')

module.exports = function autenticacaoAdmin(request, response, next) {
    if (request.path === '/acesso/login') {
        return next()
    }

    const autorizacao = request.headers.authorization || ''
    const [tipo, token] = autorizacao.split(' ')

    if (tipo !== 'Bearer' || !token) {
        return response.status(401).json({ status: false, status_code: 401, message: 'Token de acesso não informado.' })
    }

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET)

        if (usuario.tipo !== 'admin') {
            return response.status(403).json({ status: false, status_code: 403, message: 'Acesso restrito ao administrador.' })
        }

        request.usuario = usuario
        return next()
    } catch {
        return response.status(401).json({ status: false, status_code: 401, message: 'Token inválido ou expirado.' })
    }
}
