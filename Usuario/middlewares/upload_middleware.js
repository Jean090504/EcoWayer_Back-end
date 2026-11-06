const multer = require('multer');
const AppError = require('../utils/AppError');

// Mantém a imagem em memória para validação e conversão antes de salvar.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) return callback(new AppError('Envie uma imagem JPEG, PNG ou WebP.', 400, 'INVALID_IMAGE'));
        callback(null, true);
    },
});

const uploadSingle = (fieldName) => (request, response, next) => {
    upload.single(fieldName)(request, response, (error) => {
        if (error) return next(new AppError('Arquivo inválido ou maior que 5 MB.', 400, 'UPLOAD_INVALID'));
        next();
    });
};

module.exports = uploadSingle;
