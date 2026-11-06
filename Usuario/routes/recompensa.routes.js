const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/recompensa/recompensa_controller');

// O voucher é criado para o usuário autenticado.
router.use(authMiddleware);
router.get('/', asyncHandler(controller.listarRecompensas));
router.post('/:id/redeem', asyncHandler(controller.resgatarVoucher));

module.exports = router;
