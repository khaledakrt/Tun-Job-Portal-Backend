const express = require('express');
const router = express.Router();

// 📂 Chargement du contrôleur Admin
const adminCtrl = require('../controllers/admin/admin.controller'); 
const adminAppCtrl = require('../controllers/admin/application.controller');

/* ==========================================================================
   🔒 LOGIQUE DES ENDPOINTS DE L'API ADMINISTRATEUR
   (Entièrement sécurisés en amont par app.use('/api/admin', ...) dans app.js)
   ========================================================================== */

// 📊 Route 1 : Obtenir les compteurs et statistiques du tableau de bord
router.get('/dashboard-stats', adminCtrl.getDashboardStats);

// 👥 Route 2 : Récupérer l'intégralité des comptes candidats et recruteurs
router.get('/users', adminCtrl.getAllUsers);

// 🚫 Route 3 : Supprimer définitivement un compte utilisateur par son ID
router.delete('/users/:id', adminCtrl.deleteUser);

// 💼 Route 4 : Récupérer toutes les offres d'emploi déposées en Tunisie
router.get('/jobs', adminCtrl.getAllJobs);

// �️ Route 5 : Récupérer toutes les candidatures à modérer
router.get('/applications', adminAppCtrl.getAllApplications);

// 🗑️ Route 6 : Supprimer ou modérer une offre d'emploi par son ID
router.delete('/jobs/:id', adminCtrl.deleteJob);

// 🗑️ Route 7 : Supprimer une candidature non conforme par son ID
router.delete('/applications/:id', adminAppCtrl.deleteApplication);

// 🔄 Route 11 : Mettre à jour le statut d'une candidature par l'Admin
router.put('/applications/:id', adminAppCtrl.updateApplication);

// 🔑 Route 8 : Valider ou suspendre la certification d'un recruteur
router.put('/users/:id/verify-company', adminCtrl.toggleCompanyVerification);

// 🔄 Route 9 : Mettre à jour les informations d'un utilisateur par l'Admin
router.put('/users/:id', adminCtrl.updateUser);

// 🔄 Route 10 : Mettre à jour les informations d'une offre d'emploi par l'Admin
router.put('/jobs/:id', adminCtrl.updateJob);

module.exports = router;
