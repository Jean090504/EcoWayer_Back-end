const router = require('express').Router();
const controller = require('../controller/authController');
const asyncHandler = require('../utils/asyncHandler');
const { rateLimit } = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { erro: { codigo: 'RATE_LIMITED', mensagem: 'Muitas tentativas. Aguarde alguns minutos.' } } });
const sensitiveLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { erro: { codigo: 'RATE_LIMITED', mensagem: 'Muitas tentativas de autenticação. Aguarde alguns minutos.' } } });

router.use(authLimiter);

router.post('/register', sensitiveLimiter, asyncHandler(controller.register));
router.post('/verify-email', sensitiveLimiter, asyncHandler(controller.verifyContact('email')));
router.post('/verify-phone', sensitiveLimiter, asyncHandler(controller.verifyContact('telefone')));
router.post('/resend-code', sensitiveLimiter, asyncHandler(controller.resendCode));
router.post('/login', sensitiveLimiter, asyncHandler(controller.login));
router.post('/google', sensitiveLimiter, asyncHandler(controller.googleLogin));
router.post('/forgot-password', sensitiveLimiter, asyncHandler(controller.forgotPassword));
router.post('/reset-password', sensitiveLimiter, asyncHandler(controller.resetPassword));
module.exports = router;
