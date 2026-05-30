const express = require('express');
const router = express.Router();
const companyCtrl = require('../controllers/public/company.controller');
const trainingCtrl = require('../controllers/public/training-center.controller');

// 🌍 Route publique (accessible sans token)
router.get('/companies', companyCtrl.getAllVerifiedCompanies);
router.get('/training-centers', trainingCtrl.getAllTrainingCenters);

module.exports = router;