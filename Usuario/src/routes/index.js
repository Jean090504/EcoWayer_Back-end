const router = require('express').Router();
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/catalog', require('./catalogoRoutes'));
module.exports = router;
