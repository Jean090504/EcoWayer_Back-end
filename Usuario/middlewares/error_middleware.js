// Converte erros internos em respostas padronizadas e seguras.
const errorMiddleware = (error, _request, response, _next) => {
    const status = Number(error.statusCode) || 500;
    if (status >= 500) console.error(error);

    response.status(status).json({
        erro: {
            codigo: error.code || 'INTERNAL_ERROR',
            mensagem: status >= 500 ? 'Erro interno do servidor.' : error.message,
        },
    });
};

module.exports = errorMiddleware;
