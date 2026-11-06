const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/chat/chat_controller');

// Todas as rotas de conversa exigem autenticação.
router.use(authMiddleware);
router.post('/conversations', asyncHandler(controller.criarConversa));
router.get('/conversations', asyncHandler(controller.listarConversas));
router.get('/conversations/:id/messages', asyncHandler(controller.listarMensagens));
router.post('/conversations/:id/messages', asyncHandler(controller.enviarMensagem));

module.exports = router;
