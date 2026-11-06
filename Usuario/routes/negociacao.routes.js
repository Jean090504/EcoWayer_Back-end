const express           = require('express');
const router            = express.Router();
const asyncHandler      = require('../utils/async_handler');
const authMiddleware    = require('../middlewares/auth_middleware');
const controller = require('../controllers/negociacao/negociacao_controller');

// Todas as rotas de negociação exigem autenticação.
router.use(authMiddleware);
router.post('/', asyncHandler(controller.criarProposta));
router.get('/', asyncHandler(controller.listarNegociacoes));
router.patch('/:id/status', asyncHandler(controller.atualizarStatus));

module.exports = router;
