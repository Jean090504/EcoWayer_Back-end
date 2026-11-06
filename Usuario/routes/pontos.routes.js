const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/pontos/pontos_controller');

// O saldo pertence ao usuário autenticado.
router.use(authMiddleware);
router.get('/balance', asyncHandler(controller.buscarSaldo));

module.exports = router;
