const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/async_handler');
const authMiddleware = require('../middlewares/auth_middleware');
const controller = require('../controllers/qrcode/qrcode_controller');

// Geração e validação de QR code exigem autenticação.
router.use(authMiddleware);
router.post('/generate', asyncHandler(controller.gerarCodigo));
router.post('/validate', asyncHandler(controller.validarCodigo));

module.exports = router;
