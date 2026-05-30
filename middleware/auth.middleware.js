const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

exports.verifyToken = (req, res, next) => {
    let token = null;

    // 1. Récupération classique de l'en-tête (votre code actuel)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (authHeader) {
        const parts = authHeader.split(' ');
        // Vérification de la structure correcte "Bearer <TOKEN>"
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.error("❌ Middleware Auth : Format de l'en-tête invalide. Reçu :", authHeader);
            return res.status(403).json({ message: "Format du jeton d'authentification invalide (doit être Bearer)." });
        }
        token = parts[1];
    } 
    // 2. 🚀 RECOURS SÉCURISÉ POUR LE TEMPS RÉEL (SSE) : Si pas d'en-tête, on regarde dans l'URL
    else if (req.query && req.query.token) {
        token = req.query.token;
    }

    // 3. Si aucun des deux n'a fourni de token, on bloque comme avant
    if (!token) {
        console.error("❌ Middleware Auth : Aucun en-tête d'autorisation ni paramètre token trouvé.");
        return res.status(401).json({ message: "Accès refusé. Token manquant." });
    }

    // Vos vérifications strictes sur la validité de la chaîne (inchangées)
    if (token === 'null' || token === 'undefined' || token.trim() === '') {
        console.error("❌ Middleware Auth : Jeton vide ou invalide détecté.");
        return res.status(403).json({ message: "Jeton d'authentification manquant ou corrompu." });
    }

    try {
        // Décodage et injection de l'utilisateur (inchangé)
        req.user = jwt.verify(token, jwtConfig.secret);
        next();
    } catch (err) {
        console.error("❌ Middleware Auth : Échec de la vérification JWT :", err.message);
        return res.status(403).json({ message: "Token invalide ou expiré.", error: err.message });
    }
};

exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            console.error("❌ Middleware Role : Aucun utilisateur ou rôle trouvé dans req.user.");
            return res.status(403).json({ message: "Accès interdit. Droits insuffisants." });
        }

        const userRole = req.user.role.toLowerCase();
        const formattedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

        if (!formattedAllowedRoles.includes(userRole)) {
            console.error(`❌ Middleware Role : Accès refusé. Rôle de l'utilisateur : '${req.user.role}'. Rôles attendus :`, allowedRoles);
            return res.status(403).json({ message: "Accès interdit. Droits insuffisants pour cet espace." });
        }

        next();
    };
};
