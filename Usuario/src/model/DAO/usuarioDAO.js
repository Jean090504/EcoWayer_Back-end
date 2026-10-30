const db = require('../../../database/database');

const publicColumns = ['u.id', 'u.nome', 'u.cpf', 'u.data_nascimento', 'u.id_genero', 'im.url as avatar', 'em.email', 'te.numero as telefone', 'su.status as status_conta'];
exports.transaction = (callback) => db.transaction(callback);
exports.findByLogin = (login, trx = db) => trx('tbl_usuario as u').leftJoin('tbl_email as em', 'em.id_usuario', 'u.id').leftJoin('tbl_telefone as te', 'te.id_usuario', 'u.id').select('u.id', 'u.senha_hash', 'u.id_status_usuario').where('em.email', login).orWhere('te.numero', login).first();
exports.findByEmail = (email, trx = db) => trx('tbl_usuario as u').join('tbl_email as em', 'em.id_usuario', 'u.id').select('u.id', 'u.id_status_usuario', 'em.verificado').where('em.email', email).first();
exports.findById = (id, trx = db) => trx('tbl_usuario as u').leftJoin('tbl_email as em', 'em.id_usuario', 'u.id').leftJoin('tbl_telefone as te', 'te.id_usuario', 'u.id').leftJoin('tbl_imagem as im', 'im.id', 'u.id_imagem').leftJoin('tbl_status_usuario as su', 'su.id', 'u.id_status_usuario').select([...publicColumns, 'u.senha_hash']).where('u.id', id).first();
exports.findByContact = async (contact, trx = db) => {
  const email = await trx('tbl_email').select('id_usuario as id').where('email', contact).first();
  const phone = email || await trx('tbl_telefone').select('id_usuario as id').where('numero', contact).first();
  return phone;
};
exports.getVerificationState = async (id, trx = db) => {
  const [email, phone, active] = await Promise.all([
    trx('tbl_email').select('verificado').where({ id_usuario: id }).first(),
    trx('tbl_telefone').select('verificado').where({ id_usuario: id }).first(),
    trx('tbl_status_usuario').select('id').where({ status: 'ativo' }).first(),
  ]);
  return { emailVerified: Boolean(email?.verificado), phoneVerified: Boolean(phone?.verificado), activeStatus: active?.id };
};
exports.genderExists = async (id, trx = db) => Boolean(await trx('tbl_genero').where({ id }).first());
exports.isActive = async (id, trx = db) => {
  const user = await trx('tbl_usuario as u').join('tbl_status_usuario as s', 's.id', 'u.id_status_usuario').select('s.status').where('u.id', id).first();
  return user?.status === 'ativo';
};
exports.contactExists = async ({ email, phone }, trx = db) => {
  if (email && await trx('tbl_email').where({ email }).first()) return true;
  if (phone && await trx('tbl_telefone').where({ numero: phone }).first()) return true;
  return false;
};
exports.create = async (data, trx) => {
  const imageType = await trx('tbl_tipo_imagem').select('id').where('tipo', 'Perfil').first();
  const status = await trx('tbl_status_usuario').select('id').where('status', 'ativo').first();
  const level = await trx('tbl_nivel_impacto').select('id').orderBy('numero').first();
  if (!imageType || !status || !level) throw new Error('Dados de referência ausentes: execute os inserts base do banco.');
  const [imageId] = await trx('tbl_imagem').insert({ url: 'https://placehold.co/256x256?text=EcoWayer', id_tipo_imagem: imageType.id });
  const [userId] = await trx('tbl_usuario').insert({ nome: data.nome, cpf: data.cpf, data_nascimento: data.data_nascimento, id_imagem: imageId, id_genero: data.id_genero, id_status_usuario: status.id, id_nivel_impacto: level.id, senha_hash: data.senha_hash });
  await trx('tbl_email').insert({ email: data.email, codigo_verificacao: '000000', id_usuario: userId });
  await trx('tbl_telefone').insert({ numero: data.telefone, codigo_verificacao: '000000', id_usuario: userId });
  if (data.endereco) {
    const [addressId] = await trx('tbl_endereco').insert(data.endereco);
    await trx('tbl_endereco_usuario').insert({ id_endereco: addressId, id_usuario: userId });
  }
  return userId;
};
exports.saveCode = async ({ userId, contact, codeHash, purpose, expiresAt }, trx = db) => {
  await trx('tbl_codigo_usuario').where({ id_usuario: userId, finalidade: purpose }).del();
  await trx('tbl_codigo_usuario').insert({ id_usuario: userId, contato: contact, codigo_hash: codeHash, finalidade: purpose, expira_em: expiresAt });
};
exports.getCode = (contact, purpose, trx = db) => trx('tbl_codigo_usuario').where({ contato: contact, finalidade: purpose }).first();
exports.deleteCode = (id, trx = db) => trx('tbl_codigo_usuario').where({ id }).del();
exports.incrementCodeAttempts = (id, trx = db) => trx('tbl_codigo_usuario').where({ id }).increment('tentativas', 1);
exports.markContactVerified = async (contact, purpose, trx = db) => {
  if (purpose === 'email') await trx('tbl_email').where({ email: contact }).update({ verificado: true });
  if (purpose === 'telefone') await trx('tbl_telefone').where({ numero: contact }).update({ verificado: true });
};
exports.setPassword = (id, hash, trx = db) => trx('tbl_usuario').where({ id }).update({ senha_hash: hash });
exports.updateProfile = (id, data, trx = db) => trx('tbl_usuario').where({ id }).update(data);
exports.updateEmail = async (id, email, code, trx = db) => {
  await trx('tbl_email').where({ id_usuario: id }).update({ email, codigo_verificacao: code, verificado: false });
};
exports.updateAvatar = async (id, url, trx = db) => {
  const imageType = await trx('tbl_tipo_imagem').select('id').where('tipo', 'Perfil').first();
  const [imageId] = await trx('tbl_imagem').insert({ url, id_tipo_imagem: imageType.id });
  await trx('tbl_usuario').where({ id }).update({ id_imagem: imageId });
};
exports.getAddress = (id, trx = db) => trx('tbl_endereco_usuario as eu').join('tbl_endereco as e', 'e.id', 'eu.id_endereco').select('e.*').where('eu.id_usuario', id).first();
exports.erase = async (id, trx = db) => {
  const addresses = await trx('tbl_endereco_usuario').select('id_endereco').where({ id_usuario: id });
  await trx('tbl_endereco_usuario').where({ id_usuario: id }).del();
  for (const { id_endereco: addressId } of addresses) {
    const stillLinked = await trx('tbl_endereco_usuario').where({ id_endereco: addressId }).first();
    const isCollectionAddress = await trx('tbl_endereco_ponto_coleta').where({ id_endereco: addressId }).first();
    if (!stillLinked && !isCollectionAddress) await trx('tbl_endereco').where({ id: addressId }).del();
  }
  await trx('tbl_codigo_usuario').where({ id_usuario: id }).del();
  await trx('tbl_email').where({ id_usuario: id }).update({ email: `excluido+${id}@invalid.ecowayer` });
  await trx('tbl_telefone').where({ id_usuario: id }).update({ numero: `deleted${id}` });
  const status = await trx('tbl_status_usuario').select('id').where('status', 'desativado').first();
  await trx('tbl_usuario').where({ id }).update({ nome: 'Usuário removido', cpf: `000.${String(id).padStart(3, '0')}.000-${String(id % 100).padStart(2, '0')}`, senha_hash: null, id_status_usuario: status.id });
};
