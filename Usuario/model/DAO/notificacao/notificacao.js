const database = require('../../../database/database');

// Guarda e consulta notificações do usuário.
const criar = async ({ userId, type, title, message, data }, connection = database) => {
    const [id] = await connection('tbl_notificacao').insert({
        id_usuario: userId,
        tipo: type,
        titulo: title,
        mensagem: message,
        dados: data ? JSON.stringify(data) : null,
        lida: false,
        criada_em: new Date(),
    });
    return connection('tbl_notificacao').where({ id }).first();
};

const listar = (userId, unreadOnly, connection = database) => {
    const query = connection('tbl_notificacao')
        .select('id', 'tipo', 'titulo', 'mensagem', 'dados', 'lida', 'criada_em')
        .where({ id_usuario: userId });
    if (unreadOnly) query.andWhere({ lida: false });
    return query.orderBy('criada_em', 'desc').limit(100);
};

const marcarComoLida = (id, userId, connection = database) => connection('tbl_notificacao')
    .where({ id, id_usuario: userId })
    .update({ lida: true });

const marcarTodasComoLidas = (userId, connection = database) => connection('tbl_notificacao')
    .where({ id_usuario: userId, lida: false })
    .update({ lida: true });

module.exports = { criar, listar, marcarComoLida, marcarTodasComoLidas };
