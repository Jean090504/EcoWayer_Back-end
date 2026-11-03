const router = require('express').Router();
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
module.exports = router;
