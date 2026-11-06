const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const uploadMiddleware = require('../middlewares/upload_middleware');
const perfil = require('../controllers/usuario/perfil_controller');
const email = require('../controllers/usuario/email_controller');
const senha = require('../controllers/auth/senha_controller');
const avatar = require('../controllers/usuario/avatar_controller');
const excluir = require('../controllers/usuario/excluir_controller');

// Todas as rotas de perfil exigem um token válido.
router.use(authMiddleware);

router.get('/me', asyncHandler(perfil.buscarMeuPerfil));
router.put('/me', asyncHandler(perfil.atualizarMeuPerfil));
router.patch('/me/email', asyncHandler(email.alterarEmail));
router.patch('/me/password', asyncHandler(senha.alterarSenha));
// O Postman envia a imagem no campo multipart `file`.
router.post('/me/avatar', uploadMiddleware('file'), asyncHandler(avatar.atualizarAvatar));
router.delete('/me', asyncHandler(excluir.excluirMinhaConta));

module.exports = router;
