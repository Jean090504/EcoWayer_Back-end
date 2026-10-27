const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const dao = require('../model/DAO/usuarioDAO');
const AppError = require('../utils/AppError');
const { hash, verify } = require('../utils/password');
const otp = require('../utils/otp');
const { sign } = require('../utils/jwt');
const validators = require('../utils/validators');
const notificacao = require('../utils/notificacao');

const bad = (message, code = 'VALIDATION_ERROR') => new AppError(message, 400, code);
const issueCode = async (userId, contact, purpose) => {
  const code = otp.generate();
  await dao.saveCode({ userId, contact, codeHash: otp.hash(code), purpose, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  try { return await notificacao.enviarCodigo({ contato: contact, codigo: code, finalidade: purpose }); }
  catch { return { enviado: false }; }
};
const publicUser = (user) => { const { senha_hash, ...data } = user; return data; };
const normalizeContact = (value) => {
  const text = String(value || '').trim();
  return text.includes('@') ? text.toLowerCase() : text.replace(/[\s()-]/g, '');
};

exports.register = async (req, res) => {
  const { nome, cpf, data_nascimento, id_genero, email, telefone, senha, endereco } = req.body;
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 255 || !data_nascimento || !Number.isInteger(Number(id_genero)) || !validators.cpf(cpf) || !validators.email.test(email || '') || !validators.phone(telefone) || !validators.password.test(senha || '')) throw bad('Confira nome, CPF, data de nascimento, gênero, e-mail, telefone e senha.');
  const dob = new Date(`${data_nascimento}T00:00:00Z`);
  if (Number.isNaN(dob.valueOf()) || dob.toISOString().slice(0, 10) !== data_nascimento || dob >= new Date()) throw bad('Data de nascimento inválida.');
  const cleanCpf = cpf.replace(/\D/g, '');
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = telefone.replace(/[\s()-]/g, '');
  if (!(await dao.genderExists(Number(id_genero)))) throw bad('Gênero inválido.');
  if (endereco !== undefined) {
    if (!endereco || typeof endereco !== 'object' || Array.isArray(endereco)) throw bad('Endereço inválido.');
    const required = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'sigla', 'id_externo'];
    if (required.some((key) => typeof endereco[key] !== 'string' || !endereco[key].trim()) || endereco.cep.length > 9 || endereco.rua.length > 100 || endereco.numero.length > 10 || endereco.bairro.length > 100 || endereco.cidade.length > 100 || endereco.estado.length > 100 || endereco.sigla.length > 3 || String(endereco.complemento || '').length > 50) throw bad('Endereço inválido ou incompleto.');
  }
  if (await dao.contactExists({ email: normalizedEmail, phone: normalizedPhone })) throw new AppError('E-mail ou telefone já cadastrado.', 409, 'CONTACT_IN_USE');
  const passHash = await hash(senha);
  let userId;
  try {
    userId = await dao.transaction(async (trx) => {
      // Verifica duplicidade de CPF dentro da mesma transação antes de gravar.
      if (await trx('tbl_usuario').whereRaw("REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?", [cleanCpf]).first()) throw new AppError('CPF já cadastrado.', 409, 'CPF_IN_USE');
      const address = endereco ? Object.fromEntries(['cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'sigla', 'id_externo'].filter((key) => endereco[key] !== undefined).map((key) => [key, endereco[key]])) : undefined;
      return dao.create({ nome: nome.trim(), cpf: cleanCpf, data_nascimento, id_genero: Number(id_genero), email: normalizedEmail, telefone: normalizedPhone, senha_hash: passHash, endereco: address }, trx);
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError('CPF, e-mail ou telefone já cadastrado.', 409, 'DUPLICATE_USER');
    throw error;
  }
  const emailDispatch = await issueCode(userId, normalizedEmail, 'email');
  const phoneDispatch = await issueCode(userId, normalizedPhone, 'telefone');
  res.status(201).json({ mensagem: 'Cadastro realizado. Confirme seu e-mail e telefone para ativar o acesso.', id_usuario: userId, notificacoes: { email: emailDispatch.enviado, telefone: phoneDispatch.enviado } });
};

exports.verifyContact = (purpose) => async (req, res) => {
  const isEmail = purpose === 'email';
  const contact = isEmail ? String(req.body.email || '').trim().toLowerCase() : String(req.body.telefone || '').replace(/[\s()-]/g, '');
  const code = String(req.body.codigo_verificacao || '');
  if (!(isEmail ? validators.email.test(contact) : validators.phone(contact)) || !/^\d{6}$/.test(code)) throw bad('Contato ou código inválido.');
  const record = await dao.getCode(contact, purpose);
  if (!record || new Date(record.expira_em) <= new Date() || record.tentativas >= 5) throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID');
  if (!otp.compare(code, record.codigo_hash)) { await dao.incrementCodeAttempts(record.id); throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID'); }
  await dao.transaction(async (trx) => { await dao.markContactVerified(contact, purpose, trx); await dao.deleteCode(record.id, trx); });
  res.json({ mensagem: 'Contato validado com sucesso.' });
};

exports.login = async (req, res) => {
  const login = normalizeContact(req.body.login);
  const senha = String(req.body.senha || '');
  const user = await dao.findByLogin(login);
  if (!user?.senha_hash || !(await verify(user.senha_hash, senha))) throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
  const contacts = await dao.getVerificationState(user.id);
  if (user.id_status_usuario !== contacts.activeStatus || !contacts.emailVerified || !contacts.phoneVerified) throw new AppError('Confirme seu e-mail e telefone antes de entrar.', 403, 'ACCOUNT_UNVERIFIED');
  res.json({ token: sign({ sub: String(user.id) }), tipo: 'Bearer', usuario: { id: user.id } });
};

exports.forgotPassword = async (req, res) => {
  const contact = normalizeContact(req.body.contato);
  if (!validators.email.test(contact) && !validators.phone(contact)) throw bad('Informe um e-mail ou telefone válido.');
  const user = await dao.findByContact(contact);
  if (user) await issueCode(user.id, contact, 'recuperacao');
  res.json({ mensagem: 'Se o contato estiver cadastrado, você receberá instruções para redefinir a senha.' });
};

exports.resetPassword = async (req, res) => {
  const contact = normalizeContact(req.body.contato);
  const code = String(req.body.codigo_verificacao || '');
  const newPassword = String(req.body.nova_senha || '');
  if ((!validators.email.test(contact) && !validators.phone(contact)) || !/^\d{6}$/.test(code) || !validators.password.test(newPassword)) throw bad('Contato, código ou nova senha inválidos.');
  const record = await dao.getCode(contact, 'recuperacao');
  if (!record || record.tentativas >= 5 || new Date(record.expira_em) <= new Date() || !otp.compare(code, record.codigo_hash)) {
    if (record) await dao.incrementCodeAttempts(record.id);
    throw new AppError('Código inválido ou expirado.', 400, 'OTP_INVALID');
  }
  await dao.transaction(async (trx) => { await dao.setPassword(record.id_usuario, await hash(newPassword), trx); await dao.deleteCode(record.id, trx); });
  res.json({ mensagem: 'Senha redefinida com sucesso.' });
};

exports.getMe = async (req, res) => {
  const user = await dao.findById(Number(req.auth.sub));
  if (!user) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  const endereco = await dao.getAddress(user.id);
  res.json({ usuario: { ...publicUser(user), endereco: endereco || null } });
};

exports.updateMe = async (req, res) => {
  const data = {};
  if (req.body.nome !== undefined) { if (typeof req.body.nome !== 'string' || req.body.nome.trim().length < 2 || req.body.nome.length > 255) throw bad('Nome inválido.'); data.nome = req.body.nome.trim(); }
  if (req.body.data_nascimento !== undefined) { const date = new Date(`${req.body.data_nascimento}T00:00:00Z`); if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== req.body.data_nascimento || date >= new Date()) throw bad('Data de nascimento inválida.'); data.data_nascimento = req.body.data_nascimento; }
  if (req.body.id_genero !== undefined) { const id = Number(req.body.id_genero); if (!Number.isInteger(id) || !(await dao.genderExists(id))) throw bad('Gênero inválido.'); data.id_genero = id; }
  if (!Object.keys(data).length) throw bad('Informe ao menos um campo para atualizar.');
  await dao.updateProfile(Number(req.auth.sub), data);
  const user = await dao.findById(Number(req.auth.sub));
  res.json({ mensagem: 'Perfil atualizado.', usuario: publicUser(user) });
};

exports.changeEmail = async (req, res) => {
  const email = String(req.body.novo_email || '').trim().toLowerCase();
  if (!validators.email.test(email)) throw bad('E-mail inválido.');
  if (await dao.contactExists({ email })) throw new AppError('E-mail já cadastrado.', 409, 'CONTACT_IN_USE');
  await dao.updateEmail(Number(req.auth.sub), email, '000000');
  const dispatch = await issueCode(Number(req.auth.sub), email, 'email');
  res.json({ mensagem: 'E-mail alterado. Confirme o novo endereço.', notificacao_enviada: dispatch.enviado });
};

exports.changePassword = async (req, res) => {
  const { senha_atual: current, nova_senha: next } = req.body;
  if (!validators.password.test(next || '')) throw bad('A nova senha precisa ter 10 a 128 caracteres, letras maiúsculas e minúsculas, número e símbolo.');
  const user = await dao.findById(Number(req.auth.sub));
  if (!user?.senha_hash || !(await verify(user.senha_hash, String(current || '')))) throw new AppError('Senha atual incorreta.', 401, 'INVALID_PASSWORD');
  await dao.setPassword(user.id, await hash(next));
  res.json({ mensagem: 'Senha alterada.' });
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) throw bad('Envie uma imagem no campo avatar.');
  const filename = `${req.auth.sub}-${Date.now()}.webp`;
  const folder = path.resolve(process.env.UPLOAD_DIR || 'uploads/avatars');
  await fs.mkdir(folder, { recursive: true });
  await sharp(req.file.buffer).rotate().resize(512, 512, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(folder, filename));
  const url = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/uploads/avatars/${filename}`;
  await dao.updateAvatar(Number(req.auth.sub), url);
  res.json({ mensagem: 'Foto de perfil atualizada.', avatar: url });
};

exports.deleteMe = async (req, res) => {
  const user = await dao.findById(Number(req.auth.sub));
  if (!user?.senha_hash || !(await verify(user.senha_hash, String(req.body.confirmacao_senha || '')))) throw new AppError('Senha de confirmação incorreta.', 401, 'INVALID_PASSWORD');
  await dao.transaction((trx) => dao.erase(user.id, trx));
  res.status(204).end();
};
