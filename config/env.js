require('dotenv').config();

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

function loadEnv() {
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.warn(
            `⚠️  Variables d'environnement manquantes : ${missing.join(', ')}. ` +
            'Copiez backend/.env.example vers backend/.env et renseignez les valeurs.'
        );
    }
}

loadEnv();

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    apiBaseUrl: process.env.API_BASE_URL || 'http://127.0.0.1:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tun_job_portal',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'DEV_ONLY_CHANGE_IN_PRODUCTION',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        fromName: process.env.MAIL_FROM_NAME || 'Tun-Job Portal',
        fromAddress: process.env.MAIL_FROM_ADDRESS || 'no-reply@tunjob.tn',
    },

    upload: {
        maxAvatarBytes: Number(process.env.UPLOAD_MAX_AVATAR_BYTES) || 2 * 1024 * 1024,
        maxCvBytes: Number(process.env.UPLOAD_MAX_CV_BYTES) || 5 * 1024 * 1024,
    },
};
