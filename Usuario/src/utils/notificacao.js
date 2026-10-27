// Ponto de integração para provedor de e-mail/SMS. Sem provedor configurado,
// nenhum código é registrado em logs; a chamada falha explicitamente em produção.
exports.enviarCodigo = async ({ contato, codigo, finalidade }) => {
  const providerUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!providerUrl) {
    if (process.env.NODE_ENV === 'production') throw new Error('Provedor de notificações não configurado.');
    return { enviado: false, modo: 'desenvolvimento' };
  }
  const response = await fetch(providerUrl, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.NOTIFICATION_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ contato, codigo, finalidade }) });
  if (!response.ok) throw new Error('Falha ao enviar notificação.');
  return { enviado: true };
};
