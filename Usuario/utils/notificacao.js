const enviarCodigo = async ({ contato, codigo, finalidade }) => {
    const webhook = process.env.NOTIFICATION_WEBHOOK_URL;
    if (!webhook) {
        if (process.env.NODE_ENV === 'production') throw new Error('Provedor de notificações não configurado.');
        return { enviado: false };
    }

    const headers = { 'content-type': 'application/json' };
    if (process.env.NOTIFICATION_WEBHOOK_TOKEN) headers.authorization = `Bearer ${process.env.NOTIFICATION_WEBHOOK_TOKEN}`;

    const result = await fetch(webhook, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contato, codigo, finalidade }),
    });

    if (!result.ok) throw new Error('Falha ao enviar notificação.');
    return { enviado: true };
};

module.exports = { enviarCodigo };
