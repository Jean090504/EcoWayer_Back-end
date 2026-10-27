const multer = require('multer');
const AppError = require('../utils/AppError');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(new AppError('Envie uma imagem JPEG, PNG ou WebP.', 400, 'INVALID_IMAGE'));
  cb(null, true);
} });
module.exports = (req, res, next) => upload.single('avatar')(req, res, (error) => error ? next(new AppError('Arquivo inválido ou maior que 5 MB.', 400, 'UPLOAD_INVALID')) : next());
