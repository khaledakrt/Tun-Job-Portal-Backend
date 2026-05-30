const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { frontendUrl } = require('./config/env');
const app = express();

// 1. CONFIGURATION DES SECURITY MIDDLEWARES SÉCURISÉE ET MISE À JOUR
app.use(cors({
    origin: [frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true
}));

// Parsing automatique des requêtes au format JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================================================
// 2. DOSSIERS STATIQUES POUR LES SUPPORTS MULTIMÉDIAS (UPLOADS MAPPED)
// ==========================================================================
// 🚀 CORRECTION : Double exposition sécurisée pour éliminer le 404 de l'image candidat
app.use('/logos', express.static(path.join(__dirname, 'uploads/logos')));
app.use('/avatars', express.static(path.join(__dirname, 'uploads/avatars')));
app.use('/cv_files', express.static(path.join(__dirname, 'uploads/cv_files')));

// 3. IMPORTATION DES FICHIERS DE ROUTAGE COMPLETS ET SÉPARÉS
const authRoutes = require('./routes/auth.routes');
const candidateRoutes = require('./routes/candidate.routes');
const recruiterRoutes = require('./routes/recruiter.routes');
const adminRoutes = require('./routes/admin.routes'); // 🔑 Chargement des routes d'administration
const notificationRoutes = require('./routes/notification.routes');
const publicRoutes = require('./routes/public.routes');
const publicSharedRoutes = require('./routes/public.routes');

// Importation des middlewares de protection d'accès
const { verifyToken, checkRole } = require('./middleware/auth.middleware');

// 4. MAPPING ET PROTECTION DES ENDPOINTS DE L'API DE PRODUCTION
app.use('/api/auth', authRoutes); // Entièrement public (Connexion / Inscription)

// 🔓 1. NOUVEAU & PUBLIC : On charge le contrôleur des offres directement ici pour le rendre accessible à tous
const candidateJobCtrl = require('./controllers/candidate/job.controller');
const candidateQuizCtrl = require('./controllers/candidate/quiz.controller');
const candidateProfileCtrl = require('./controllers/candidate/profile.controller');
const contactCtrl = require('./controllers/public/contact.controller');

app.get('/api/candidate/jobs/list', candidateJobCtrl.getAllAvailableJobs);
app.get('/api/candidate/profile/details-public/:id', candidateProfileCtrl.getPublicCompanyDetails);
app.get('/api/public/jobs/:jobId/quiz', candidateQuizCtrl.getJobQuizForCandidate);


// ip 
app.set('trust proxy', true); // This allows Express to pick up the real client IP from headers


// Public contact endpoint for the website contact form
// Expose contact endpoint under /api to match frontend `environment.apiUrl`
app.post('/api/contact', contactCtrl.postContact);

// 🔓 Routes publiques partagées (Entreprises, Centres de formation)
app.use('/api/public', publicRoutes);

// 🔒 2. RESTE DE L'ESPACE CANDIDAT : Protégé globalement (verifyToken + checkRole)
app.use('/api/candidate', verifyToken, checkRole(['candidate']), candidateRoutes);

// Espace Recruteur privé
app.use('/api/recruiter', verifyToken, recruiterRoutes);

// Espace Administrateur privé
app.use('/api/admin', verifyToken, checkRole(['admin']), adminRoutes);

// Centre de Notifications partagé
app.use('/api/notifications', verifyToken, notificationRoutes);


// 🔑 Espace Administrateur privé : Token JWT valide + Rôle 'admin' obligatoire
//app.use('/api/admin', verifyToken, checkRole(['admin']), adminRoutes);

// Centre de Notifications partagé : Nécessite simplement d'être connecté
//app.use('/api/notifications', verifyToken, notificationRoutes);

// 5. GESTION DES ROUTES INCONNUES (MIDDLEWARE DE SECOURS)
app.use((req, res, next) => {
    res.status(404).json({ message: "Désolé, cette route d'API n'existe pas sur le serveur Tun-Job-Portal." });
});

// 6. GESTIONNAIRE GLOBAL DES ERREURS SERVEUR (SÉCURITÉ ANTI-CRASH)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Fichier trop volumineux.'
            : 'Erreur lors du téléversement du fichier.';
        return res.status(400).json({ message });
    }
    if (err.message && err.message.includes('Type de fichier')) {
        return res.status(400).json({ message: err.message });
    }
    console.error('❌ Erreur serveur :', err.stack);
    res.status(500).json({
        message: 'Une erreur interne est survenue sur le serveur Express.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

module.exports = app;
