const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const guardarImagem = async (buffer, userId, prefix) => {
    const fileName = `${prefix}-${userId}-${crypto.randomUUID()}.webp`;
    const folder = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    const subfolder = prefix === 'avatar' ? 'avatars' : prefix === 'anuncio' ? 'anuncios' : 'denuncias';
    const destination = path.join(folder, subfolder);
    await fs.mkdir(destination, { recursive: true });

    await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(destination, fileName));

    const baseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return `${baseUrl}/uploads/${subfolder}/${fileName}`;
};

module.exports = guardarImagem;
