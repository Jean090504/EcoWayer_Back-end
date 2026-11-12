module.exports = (error, _req, res, _next) => {
  const status = Number(error.statusCode) || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ erro: { codigo: error.code || 'INTERNAL_ERROR', mensagem: status >= 500 ? 'Erro interno do servidor.' : error.message } });
};
