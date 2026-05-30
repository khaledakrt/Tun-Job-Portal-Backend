const db = require('../../config/db');
const bcrypt = require('bcrypt'); 
// 📥 1. RÉCUPÉRATION DES INFOS AU DÉBUT (Résout le problème du "Non renseigné")
exports.getCompanyDetails = async (req, res) => {
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }

    try {
        // 🌟 Requête ciblée sur votre table 'users' avec vos vrais noms de colonnes
        const [rows] = await db.execute(
            'SELECT name, company_name, company_bio, phone, address, email, company_logo FROM users WHERE id = ?', 
            [userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Profil entreprise introuvable." });
        }

        // On renvoie la première ligne d'informations trouvée à Angular
        return res.status(200).json(rows[0]);
    } catch (e) {
        console.error("❌ Erreur MySQL getCompanyDetails :", e.message);
        return res.status(500).json({ error: e.message });
    }
};

// 📤 2. SAUVEGARDE ET MISE À JOUR DES INFOS (Avec prise en charge de l'email)
exports.updateCompany = async (req, res) => {
    // Extraction des données du FormData d'Angular
    const { name, company_name, company_bio, phone, address, email } = req.body;
    
    // 🌟 CORRECTION CHIRURGICALE : On stocke uniquement le nom de fichier brut généré par Multer
    let logoFilename = req.file ? req.file.filename : null;
    
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Erreur d'authentification." });
    }

    try {
        // Mise à jour de la table 'users' incluant la colonne 'email'
        await db.execute(
            'UPDATE users SET name = ?, company_name = ?, company_bio = ?, phone = ?, address = ?, email = ? WHERE id = ?', 
            [name, company_name, company_bio, phone, address, email, userId]
        );
        
        // Si un nouveau fichier logo physique a été sélectionné, on met à jour la colonne
        if (logoFilename) {
            await db.execute('UPDATE users SET company_logo = ? WHERE id = ?', [logoFilename, userId]);
        }
        
        return res.json({ message: "Informations de votre entreprise enregistrées avec succès !" });
    } catch (e) { 
        console.error("❌ Erreur MySQL updateCompany :", e.message);
        return res.status(500).json({ error: e.message }); 
    }
};


exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user && req.user.id ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    try {
        // 1. Récupération du mot de passe hashé actuel
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Compte introuvable." });
        }

        // rows[0] contient l'objet utilisateur retourné par mysql2
        const hashedOldPassword = rows[0].password;

        // 2. Vérification sécurisée avec bcrypt
        const isMatch = await bcrypt.compare(currentPassword, hashedOldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
        }

        // 3. Chiffrement du nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Sauvegarde dans MySQL
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        return res.status(200).json({ message: "Votre mot de passe a été modifié avec succès !" });

    } catch (e) {
        console.error("❌ Erreur MySQL changePassword :", e.message);
        return res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour." });
    }
};

exports.getRecruiterJobs = async (req, res) => {
    const recruiter_id = req.user && req.user.id ? req.user.id : null;
    
    if (!recruiter_id) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    try {
        // 🚀 REQUÊTE AGREGÉE : Compte le nombre de candidatures par offre d'emploi
        const sqlQuery = `
            SELECT 
                j.*, 
                COUNT(a.id) AS application_count
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            WHERE j.recruiter_id = ?
            GROUP BY j.id
            ORDER BY j.id DESC
        `;

        const [rows] = await db.execute(sqlQuery, [recruiter_id]);
        return res.json(rows);

    } catch (e) { 
        console.error("❌ Erreur MySQL getRecruiterJobs (Count) :", e.message);
        return res.status(500).json({ error: e.message }); 
    }
};
