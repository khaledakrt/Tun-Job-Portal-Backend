const express = require('express');
const router = express.Router();

// 🛡️ IMPORTATION SÉCURISÉE DU MIDDLEWARE D'AUTHENTIFICATION JWT
const { verifyToken } = require('../middleware/auth.middleware'); 

// 📸 IMPORTATION DU COMPOSANT DE CHARGEMENT MULTIMÉDIA (MULTER)
const upload = require('../config/multer.config');

// Chargement des contrôleurs du sous-dossier candidate/
const profileCtrl = require('../controllers/candidate/profile.controller');
const cvCtrl = require('../controllers/candidate/cv.controller');
const appCtrl = require('../controllers/candidate/application.controller');
const quizCtrl = require('../controllers/candidate/quiz.controller');
const candidateJobCtrl = require('../controllers/candidate/job.controller');
const { validate } = require('../middleware/validate.middleware');
const appSchemas = require('../validators/application.validator');

// ==========================================================================
// 👤 MODULE PROFIL CANDIDAT (PROTÉGÉ PAR TOKEN JWT)
// ==========================================================================
router.post('/profile/update', verifyToken, upload.single('photo'), profileCtrl.updateProfile);
router.post('/profile/update-avatar', verifyToken, upload.single('logo'), profileCtrl.updateAvatar);
router.get('/profile/details', verifyToken, profileCtrl.getProfileDetails);

// ==========================================================================
// 💼 MOTEUR DE RECHERCHE D'OFFRES
// ==========================================================================
// Note : la route publique de recherche d'offres est déclarée dans app.js

// ==========================================================================
// 📄 GESTIONNAIRE DE CV & CANDIDATURES
// ==========================================================================
router.post('/cv/save', verifyToken, cvCtrl.saveCV);
router.get('/cv/details', verifyToken, cvCtrl.getCVDetails);
router.post('/cv/upload-pdf', verifyToken, upload.single('cv'), cvCtrl.uploadCvPdf);

// 🔒 ROUTE PRIVÉE : Reste protégée, l'utilisateur DOIT être connecté pour postuler
router.get('/jobs/:jobId/quiz', verifyToken, quizCtrl.getJobQuizForCandidate);
router.post('/apply', verifyToken, validate(appSchemas.apply), appCtrl.apply);
router.get('/history', verifyToken, appCtrl.getHistory);

// La route publique pour récupérer les détails d'une entreprise est maintenant exposée dans app.js

module.exports = router;
