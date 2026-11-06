const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/notificacao/notificacao_controller');

// Cada usuário acessa apenas suas próprias notificações.
router.use(authMiddleware);
router.get('/', asyncHandler(controller.listarNotificacoes));
router.patch('/read-all', asyncHandler(controller.marcarTodasComoLidas));
router.patch('/:id/read', asyncHandler(controller.marcarComoLida));

module.exports = router;
