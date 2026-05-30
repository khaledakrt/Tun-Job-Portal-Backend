const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { upload: uploadLimits } = require('./env');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const LOGO_DIR = path.join(UPLOAD_ROOT, 'logos');
const CV_DIR = path.join(UPLOAD_ROOT, 'cv_files');

[AVATAR_DIR, LOGO_DIR, CV_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_MIMES = ['application/pdf'];

function diskStorage(destinationDir, prefix) {
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, destinationDir),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const unique = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, unique);
        },
    });
}

function fileFilter(allowedMimes, allowedExtensions) {
    return (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext) || !allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé.'));
        }
        cb(null, true);
    };
}

const uploadAvatar = multer({
    storage: diskStorage(AVATAR_DIR, 'avatar'),
    limits: { fileSize: uploadLimits.maxAvatarBytes, files: 1 },
    fileFilter: fileFilter(IMAGE_MIMES, ['.jpg', '.jpeg', '.png', '.webp']),
});

const uploadLogo = multer({
    storage: diskStorage(LOGO_DIR, 'logo'),
    limits: { fileSize: uploadLimits.maxAvatarBytes, files: 1 },
    fileFilter: fileFilter(IMAGE_MIMES, ['.jpg', '.jpeg', '.png', '.webp']),
});

const uploadCvPdf = multer({
    storage: diskStorage(CV_DIR, 'cv'),
    limits: { fileSize: uploadLimits.maxCvBytes, files: 1 },
    fileFilter: fileFilter(PDF_MIMES, ['.pdf']),
});

/** @deprecated Préférez uploadAvatar / uploadLogo / uploadCvPdf */
const legacyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'logo') return cb(null, LOGO_DIR);
        if (file.fieldname === 'avatar') return cb(null, AVATAR_DIR);
        return cb(null, CV_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const legacyUpload = multer({
    storage: legacyStorage,
    limits: { fileSize: uploadLimits.maxCvBytes, files: 1 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.fieldname === 'cv' || file.fieldname === 'cv_file') {
            if (!PDF_MIMES.includes(file.mimetype) || ext !== '.pdf') {
                return cb(new Error('Seuls les fichiers PDF sont acceptés pour le CV.'));
            }
            return cb(null, true);
        }
        if (!IMAGE_MIMES.includes(file.mimetype) || !['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            return cb(new Error('Seules les images JPG, PNG ou WebP sont acceptées.'));
        }
        cb(null, true);
    },
});

module.exports = legacyUpload;
module.exports.uploadAvatar = uploadAvatar;
module.exports.uploadLogo = uploadLogo;
module.exports.uploadCvPdf = uploadCvPdf;
