const router = require('express').Router();
const controller = require('../controller/authController');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/me', auth, asyncHandler(controller.getMe));
router.put('/me', auth, asyncHandler(controller.updateMe));
router.patch('/me/email', auth, asyncHandler(controller.changeEmail));
router.patch('/me/password', auth, asyncHandler(controller.changePassword));
router.post('/me/avatar', auth, upload, asyncHandler(controller.uploadAvatar));
router.delete('/me', auth, asyncHandler(controller.deleteMe));
module.exports = router;
