const recursosInternos = new Set([
    'verificacao', 'email_verificacao', 'telefone_verificacao',
    'qr_code', 'qr_code_entrega', 'qr_code_voucher', 'leitura_qr_code'
])
const recursosSomenteLeitura = new Set([
    'pontos', 'voucher', 'voucher_catalogo', 'entrega',
    'configuracao_pontos', 'regra_pontuacao', 'regra_pontuacao_condicao',
    'insignia', 'usuario_insignia', 'tipo_denuncias', 'status_usuario'
])

module.exports = function permissoesUsuario(req, res, next) {
    const recurso = req.path.split('/')[1]?.toLowerCase()
    const leitura = ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    const resgate = req.method === 'POST' && /^\/voucher\/resgatar\/?$/i.test(req.path)
    if ((req.method !== 'OPTIONS' && recursosInternos.has(recurso)) ||
        (!leitura && !resgate && recursosSomenteLeitura.has(recurso))) {
        return res.status(403).json({ status: false, status_code: 403, message: 'Operação restrita.' })
    }
    if (!leitura && ['conta', 'email'].includes(recurso)) {
        return res.status(403).json({ status: false, status_code: 403, message: 'Altere suas credenciais nas configurações do perfil.' })
    }
    return next()
}
