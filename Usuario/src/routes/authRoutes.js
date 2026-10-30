const router = require('express').Router();
const controller = require('../controller/authController');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', asyncHandler(controller.register));
router.post('/verify-email', asyncHandler(controller.verifyContact('email')));
router.post('/verify-phone', asyncHandler(controller.verifyContact('telefone')));
router.post('/login', asyncHandler(controller.login));
router.post('/google', asyncHandler(controller.googleLogin));
router.post('/forgot-password', asyncHandler(controller.forgotPassword));
router.post('/reset-password', asyncHandler(controller.resetPassword));
module.exports = router;
