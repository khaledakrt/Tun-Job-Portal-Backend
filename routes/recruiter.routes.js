const express = require('express');
const router = express.Router();

// 1. Chargement des contrôleurs
const profileCtrl = require('../controllers/recruiter/profile.controller');
const jobCtrl = require('../controllers/recruiter/job.controller');
const atsCtrl = require('../controllers/recruiter/ats.controller');
const quizCtrl = require('../controllers/recruiter/quiz.controller');
const upload = require('../config/multer.config');
const { validate } = require('../middleware/validate.middleware');
const jobSchemas = require('../validators/job.validator');
const appSchemas = require('../validators/application.validator');
const quizSchemas = require('../validators/quiz.validator');

// 2. Middleware d'authentification
const { verifyToken } = require('../middleware/auth.middleware');
if (!verifyToken) {
    throw new Error("❌ Impossible de charger le middleware d'authentification.");
}

// Sécurise automatiquement toutes les routes déclarées en dessous
router.use(verifyToken);

// ==========================================================================
// 🚀 ENDPOINTS RECRUTEUR STANDARD ET SÉCURISÉS
// ==========================================================================

// 📊 Statistiques du Dashboard
router.get('/stats', jobCtrl.getRecruiterStats);

// Profil
router.get('/profile/details', profileCtrl.getCompanyDetails);
router.post('/profile/update', upload.single('logo'), profileCtrl.updateCompany);





router.post('/profile/change-password', profileCtrl.changePassword);

// Gestion des offres (Jobs)
router.post('/jobs/create', validate(jobSchemas.createJob), jobCtrl.createJob);
router.get('/jobs/list', jobCtrl.getRecruiterJobs); 
router.post('/jobs/toggle-status', validate(jobSchemas.toggleStatus), jobCtrl.toggleJobStatus);
router.delete('/jobs/delete/:id', jobCtrl.deleteJob);

// Suivi des candidatures (ATS)
router.get('/ats/applications', atsCtrl.getApplications);
router.get('/ats/applications/:applicationId/quiz-answers', atsCtrl.getApplicationQuizAnswers);
router.post('/ats/update-status', validate(appSchemas.updateStatus), atsCtrl.updateStatus);

router.get('/jobs/:jobId/quiz', quizCtrl.getJobQuiz);
router.post('/jobs/:jobId/quiz', validate(quizSchemas.upsertQuiz), quizCtrl.saveJobQuiz);
router.patch('/jobs/:jobId/quiz/visibility', validate(quizSchemas.toggleVisibility), quizCtrl.toggleQuizVisibility);
router.delete('/jobs/:jobId/quiz', quizCtrl.deleteJobQuiz);

// Profil candidat et CV
router.get('/candidate-profile/:id', atsCtrl.getCandidateProfileById);
router.get('/candidate-cv/:id', atsCtrl.getCandidateCvById);

module.exports = router;
