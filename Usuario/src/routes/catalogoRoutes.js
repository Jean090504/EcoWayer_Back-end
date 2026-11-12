const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controller/catalogoController');

router.get('/anuncios', asyncHandler(controller.listarAnuncios));
router.get('/categorias', asyncHandler(controller.listarCategorias));

module.exports = router;
