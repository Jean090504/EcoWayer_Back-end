const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/entrega/entrega_controller');

// A entrega só pode ser agendada por alguém da negociação aceita.
router.use(authMiddleware);
router.post('/', asyncHandler(controller.criarEntrega));

module.exports = router;
