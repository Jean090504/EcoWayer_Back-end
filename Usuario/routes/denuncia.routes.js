const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const uploadSingle = require('../middlewares/upload_middleware');
const controller = require('../controllers/denuncia/denuncia_controller');

// Somente usuários autenticados podem registrar denúncias.
router.use(authMiddleware);
router.post('/', uploadSingle('file'), asyncHandler(controller.criarDenuncia));

module.exports = router;
