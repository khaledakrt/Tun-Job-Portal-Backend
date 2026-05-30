const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig, apiBaseUrl, frontendUrl } = require('../../config/env');
const emailService = require('../../services/email.service');
const { emailLayout } = require('../../templates/email/layout');

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    
    try {
        // 1. Validation locale de sécurité
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Veuillez renseigner tous les champs obligatoires." });
        }

        // 2. Interception chirurgicale du doublon MySQL avant insertion
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Cette adresse e-mail est déjà utilisée en Tunisie." });
        }

        // 3. Chiffrement du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Génération du jeton (token) d'activation unique
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 5. Insertion réelle en base de données MySQL avec vos nouvelles colonnes HeidiSQL
        await db.execute(
            'INSERT INTO users (name, email, password, role, is_verified, verification_token) VALUES (?, ?, ?, ?, 0, ?)',
            [name, email, hashedPassword, role || 'candidate', verificationToken]
        );

        // 6. Envoi automatique de l'e-mail de confirmation
        const confirmationUrl = `${apiBaseUrl}/api/auth/verify-email?token=${verificationToken}`;
        const html = emailLayout({
            title: 'Bienvenue sur Tun-Job !',
            bodyHtml: `
              <p style="font-size:14px;color:#334155;line-height:1.6;">Bonjour <strong>${name}</strong>,</p>
              <p style="font-size:14px;color:#334155;line-height:1.6;">Merci de vous être inscrit. Confirmez votre adresse e-mail pour activer votre compte.</p>`,
            ctaUrl: confirmationUrl,
            ctaLabel: 'Activer mon compte Tun-Job',
        });

        emailService.sendMail({
            to: email,
            subject: 'Tun-Job — Activez votre compte',
            html,
        }).catch((mailErr) => console.error("❌ E-mail confirmation:", mailErr.message));

        // Succès : Déclenchera la Box Verte sur le Frontend Angular
        return res.status(201).json({ message: "Inscription réussie ! Un e-mail de validation vous a été envoyé." });

    } catch (e) {
        console.error("❌ Erreur MySQL interceptée lors de l'inscription :", e);
        
        if (e.errno === 1062 || e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Cette adresse e-mail est déjà utilisée en Tunisie." });
        }
        return res.status(400).json({ message: "Impossible de créer le compte actuellement." });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
        }

        const [users] = await db.execute(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
            [email]
        );
        if (users.length === 0) return res.status(400).json({ message: "Identifiants ou mot de passe incorrects." });

        const user = users[0];

        // 🛑 SÉCURITÉ : Interception et blocage si l'adresse e-mail n'est pas vérifiée (is_verified === 0)
        if (user.is_verified === 0) {
            return res.status(403).json({ message: "Votre adresse e-mail n'a pas été confirmée. Veuillez vérifier votre boîte de réception." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Identifiants ou mot de passe incorrects." });

        const token = jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
        
        // 🌐 ENREGISTREMENT DE L'IP : Capture de l'adresse IP lors de la connexion réussie
        const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.execute("UPDATE users SET last_ip = ? WHERE id = ?", [userIp, user.id]);
        
        // 🚀 RETOUR LOGGED : Ajout de la valeur de certification d'entreprise pour Angular
        return res.status(200).json({ 
            token, 
            role: user.role, 
            name: user.name,
            is_verified_company: user.is_verified_company 
        });
    } catch (e) {
        console.error("❌ Erreur de connexion :", e);
        return res.status(400).json({ message: "Une erreur est survenue lors de la tentative de connexion." });
    }
};

// 🔑 NOUVELLE MÉTHODE : Traite la validation lors du clic sur l'e-mail
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Jeton de vérification manquant.");
    }

    try {
        // Rechercher l'utilisateur avec ce jeton
        const [users] = await db.execute('SELECT id FROM users WHERE verification_token = ?', [token]);
        
        if (users.length === 0) {
            return res.status(400).send("Le lien de confirmation est invalide ou a expiré.");
        }

        // Mettre à jour le statut et purger le jeton
        await db.execute(
            'UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?',
            [token]
        );

        // Redirection vers le formulaire Angular local avec paramètre de succès
        return res.redirect(`${frontendUrl}/login?verified=true`);

    } catch (e) {
        console.error("❌ Erreur lors de la vérification de l'e-mail :", e);
        return res.status(500).send("Erreur interne lors de la validation du compte.");
    }
};

exports.getProfile = async (req, res) => {
    try {
        // 🚀 REQUÊTE PROFIL : Ajout chirurgical de is_verified_company dans la sélection MySQL
        const [users] = await db.execute(
            'SELECT id, name, email, role, phone, address, company_name, company_bio, company_logo, is_verified_company FROM users WHERE id = ?', 
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: "Profil introuvable." });
        
        return res.status(200).json(users[0]);
    } catch (e) {
        return res.status(400).json({ message: "Erreur de récupération du profil." });
    }
};
