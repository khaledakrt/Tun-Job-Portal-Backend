const express = require('express');
const router = express.Router();
// 🚀 Pointage exact vers votre fichier partagé
const notificationCtrl = require('../controllers/shared/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
router.use(verifyToken);

router.get('/stream', notificationCtrl.notificationStream);
router.get('/history', notificationCtrl.getNotificationHistory);
router.post('/read', notificationCtrl.markAllAsRead); 

// 🚀 AJOUT ISOLÉ : Nouvelle route pour récupérer dynamiquement le candidat complet via l'ID de sa notification
//router.get('/candidate-by-notif/:id', notificationCtrl.getCandidateByNotificationId);

// Route pour le Recruteur (Intacte)
router.get('/candidate-by-notif/:id', notificationCtrl.getCandidateByNotificationId);

// 🚀 NOUVELLE ROUTE POUR LE CANDIDAT
router.get('/recruiter-by-notif/:id', notificationCtrl.getRecruiterByNotificationId);


module.exports = router;
