const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/auth/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const authSchemas = require('../validators/auth.validator');

router.post('/register', validate(authSchemas.register), ctrl.register);
router.post('/login', validate(authSchemas.login), ctrl.login);

// 🔑 NOUVEAU : Endpoint public pour intercepter le clic de confirmation par e-mail
router.get('/verify-email', ctrl.verifyEmail);

// Endpoint sécurisé par Token JWT
router.get('/profile', verifyToken, ctrl.getProfile);

module.exports = router;
