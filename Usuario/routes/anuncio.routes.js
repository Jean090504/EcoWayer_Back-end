const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const uploadSingle = require('../middlewares/upload_middleware');
const controller = require('../controllers/anuncio/anuncio_controller');

// Todas as rotas de anúncio exigem autenticação.
router.use(authMiddleware);
router.post('/', uploadSingle('file'), asyncHandler(controller.criarAnuncio));
router.get('/', asyncHandler(controller.listarAnuncios));
router.get('/:id', asyncHandler(controller.buscarAnuncio));
router.patch('/:id/status', asyncHandler(controller.alterarStatus));

module.exports = router;
