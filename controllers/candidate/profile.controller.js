const db = require('../../config/db');
const bcrypt = require('bcrypt'); // 🚀 Nécessaire pour chiffrer en toute sécurité le mot de passe candidat

// 📥 1. RÉCUPÉRATION DES INFOS CANDIDAT (Avec sa table isolée candidate_profiles)
exports.getCandidateProfile = async (req, res) => {
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }

    try {
        // Jointure gauche pour extraire à la fois les données de base et le profil de recherche
        const query = `
            SELECT 
                u.name, u.phone, u.email, u.address, u.company_logo as avatar_logo,
                cp.birth_date, cp.linkedin, cp.github, cp.job_status, cp.availability, cp.job_type, cp.location_pref
            FROM users u
            LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
            WHERE u.id = ?
        `;
        const [rows] = await db.execute(query, [userId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Profil candidat introuvable." });
        }

        // On renvoie l'objet combiné complet à Angular
        return res.status(200).json(rows[0]);
    } catch (e) {
        console.error("❌ Erreur MySQL getCandidateProfile :", e.message);
        return res.status(500).json({ error: e.message });
    }
};

// 📤 2. SAUVEGARDE ET MISE À JOUR GLOBAL DU PROFIL (Double écriture propre)
exports.updateProfile = async (req, res) => {
    const userId = req.user && req.user.id ? req.user.id : null;
    if (!userId) {
        return res.status(401).json({ message: "Session invalide. Veuillez vous reconnecter." });
    }

    const { 
        name, email, phone, address, 
        birth_date, linkedin, github, job_status, availability, job_type, location_pref 
    } = req.body;
    
    let avatarFilename = req.file ? req.file.filename : null;

    try {
        // --- ÉTAPE 1 : Sauvegarde dans la table générale 'users' ---
        if (avatarFilename) {
            await db.execute(
                'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, company_logo = ? WHERE id = ?', 
                [name, email, phone, address, avatarFilename, userId]
            );
        } else {
            await db.execute(
                'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?', 
                [name, email, phone, address, userId]
            );
        }

        // --- ÉTAPE 2 : Sauvegarde ou mise à jour automatique dans la table isolée 'candidate_profiles' ---
        const profileQuery = `
            INSERT INTO candidate_profiles (user_id, birth_date, linkedin, github, job_status, availability, job_type, location_pref)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                birth_date = VALUES(birth_date),
                linkedin = VALUES(linkedin),
                github = VALUES(github),
                job_status = VALUES(job_status),
                availability = VALUES(availability),
                job_type = VALUES(job_type),
                location_pref = VALUES(location_pref)
        `;
        
        await db.execute(profileQuery, [
            userId, 
            birth_date || null, 
            linkedin || null, 
            github || null, 
            job_status || null, 
            availability || null, 
            job_type || null, 
            location_pref || null
        ]);

        return res.json({ message: "Les informations de votre profil ont été enregistrées avec succès !" });
    } catch (e) { 
        console.error("❌ Erreur MySQL updateProfile :", e.message);
        return res.status(500).json({ error: e.message }); 
    }
};


// 📸 3. MISE À JOUR DE LA PHOTO DE PROFIL (AVATAR) VIA MULTER
exports.updateAvatar = async (req, res) => {
    let avatarFilename = req.file ? req.file.filename : null;
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Session invalide. Veuillez vous reconnecter." });
    }

    if (!avatarFilename) {
        return res.status(400).json({ message: "Aucun fichier image sélectionné ou reçu par le serveur." });
    }

    try {
        await db.execute('UPDATE users SET company_logo = ? WHERE id = ?', [avatarFilename, userId]);
        return res.json({ 
            message: "Votre photo de profil a été mise à jour avec succès !", 
            filename: avatarFilename 
        });
    } catch (e) {
        console.error("❌ Erreur MySQL updateAvatar :", e.message);
        return res.status(500).json({ 
            message: "Erreur interne lors de la sauvegarde de la photo.", 
            error: e.message 
        });
    }
};


// 🔐 4. MODIFICATION SÉCURISÉE DU MOT DE PASSE CANDIDAT
exports.changeCandidatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    try {
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Compte introuvable." });
        }

        const hashedOldPassword = rows[0].password;
        const isMatch = await bcrypt.compare(currentPassword, hashedOldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Le mot de passe actuel saisi est incorrect." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
        return res.status(200).json({ message: "Votre mot de passe a été modifié avec succès !" });

    } catch (e) {
        console.error("❌ Erreur MySQL changeCandidatePassword :", e.message);
        return res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour." });
    }
};

exports.getPublicCompanyDetails = async (req, res) => {
    const recruiterId = req.params.id;
    try {
        const [rows] = await db.execute(
            'SELECT company_name, company_bio, phone, address, email, company_logo FROM users WHERE id = ?', 
            [recruiterId]
        );
        if (rows.length === 0) return res.status(404).json({ message: "Introuvable" });
        return res.status(200).json(rows[0]);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getProfileDetails = async (req, res) => {
    const candidate_id = req.user && req.user.id ? req.user.id : null;

    if (!candidate_id) {
        return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }

    try {
        const [rows] = await db.execute(
            `SELECT u.id, u.name, u.email, u.phone, u.address, u.company_logo AS avatar_logo,
                    cp.birth_date, cp.linkedin, cp.github, cp.job_status, cp.availability, cp.job_type, cp.location_pref
             FROM users u
             LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
             WHERE u.id = ?`, 
            [candidate_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(200).json({ 
                id: candidate_id,
                name: '', 
                email: req.user.email || '', 
                phone: '', 
                address: '', 
                avatar_logo: null,
                birth_date: null, linkedin: '', github: '', job_status: '', availability: '', job_type: '', location_pref: ''
            });
        }

        return res.status(200).json(rows[0]);

    } catch (e) {
        console.error("❌ Crash MySQL intercepté dans la méthode getProfileDetails :", e.message);
        return res.status(500).json({ 
            message: "Erreur interne du serveur lors de la récupération des coordonnées.", 
            error: e.message 
        });
    }
};
