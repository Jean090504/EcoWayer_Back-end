const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const cadastro = require('../controllers/auth/cadastro_controller');
const login = require('../controllers/auth/login_controller');
const googleLogin = require('../controllers/auth/google_controller');
const verificacao = require('../controllers/auth/verificacao_controller');
const senha = require('../controllers/auth/senha_controller');

// Cadastro, login e confirmação de contatos são rotas públicas.
router.post('/register', asyncHandler(cadastro.cadastrarUsuario));
router.post('/verify-email', asyncHandler(verificacao.validarContato('email')));
router.post('/verify-phone', asyncHandler(verificacao.validarContato('telefone')));
router.post('/login', asyncHandler(login.autenticarUsuario));
router.post('/google', asyncHandler(googleLogin.loginGoogle));
router.post('/forgot-password', asyncHandler(senha.solicitarRecuperacao));
router.post('/reset-password', asyncHandler(senha.redefinirSenha));

module.exports = router;
