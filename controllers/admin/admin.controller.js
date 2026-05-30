 
const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Define allowed ENUM values for validation
const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
const WORKPLACE_TYPES = ['Présentiel', 'Hybride', 'Télétravail'];
const EXPERIENCE_LEVELS = ['Junior (0-2 ans)', 'Intermédiaire (2-5 ans)', 'Senior (5 ans+)'];
const JOB_STATUSES = ['disponible', 'fermé'];



// 📊 1. Obtenir les statistiques globales pour le Dashboard Admin
exports.getDashboardStats = async (req, res) => {
    try {
        // Compter les candidats
        const [candidates] = await db.execute("SELECT COUNT(*) as total FROM users WHERE role = 'candidate'");
        // Compter les recruteurs
        const [recruiters] = await db.execute("SELECT COUNT(*) as total FROM users WHERE role = 'recruiter'");
        // Compter le total des offres d'emploi
        const [jobs] = await db.execute("SELECT COUNT(*) as total FROM jobs");

        return res.status(200).json({
            totalCandidates: candidates[0].total,
            totalRecruiters: recruiters[0].total,
            totalJobs: jobs[0].total
        });
    } catch (error) {
        console.error("❌ Erreur stats admin :", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
};

// 👥 2. Récupérer tous les utilisateurs (Candidats et Recruteurs) - CORRIGÉ
exports.getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT id, name, email, role, phone, address, company_name, company_bio, company_logo, is_verified, is_verified_company, created_at, last_ip 
            FROM users 
            WHERE role != 'admin' 
            ORDER BY created_at DESC
        `; // 🚀 FIX CHIRURGICAL : Ajout de la colonne is_verified_company pour fixer la persistance au rafraîchissement
        const [users] = await db.execute(query);
        return res.status(200).json(users);
    } catch (error) {
        console.error("❌ Erreur liste utilisateurs :", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
    }
};


// 🚫 3. Supprimer ou bannir définitivement un utilisateur
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("DELETE FROM users WHERE id = ?", [id]);
        return res.status(200).json({ message: "Utilisateur supprimé avec succès de Tun-Job." });
    } catch (error) {
        console.error("❌ Erreur suppression utilisateur :", error);
        return res.status(500).json({ message: "Impossible de supprimer cet utilisateur." });
    }
};

// 💼 4. Récupérer toutes les offres d'emploi avec le nom de l'entreprise
exports.getAllJobs = async (req, res) => {
    try {
        const query = `
            SELECT
                jobs.*,
                users.id AS recruiter_id,
                users.name AS recruiter_name,
                users.email AS recruiter_email,
                users.phone AS recruiter_phone,
                users.address AS recruiter_address,
                users.company_logo AS recruiter_logo,
                users.is_verified_company,
                users.company_name
            FROM jobs 
            JOIN users ON jobs.recruiter_id = users.id 
            ORDER BY jobs.created_at DESC
        `;
        const [jobs] = await db.execute(query);
        return res.status(200).json(jobs);
    } catch (error) {
        console.error("❌ Erreur liste offres :", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des offres d'emploi." });
    }
};

// 🗑️ 5. Supprimer une offre d'emploi non conforme
exports.deleteJob = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("DELETE FROM jobs WHERE id = ?", [id]);
        return res.status(200).json({ message: "L'offre d'emploi a été retirée de la plateforme." });
    } catch (error) {
        console.error("❌ Erreur suppression offre :", error);
        return res.status(500).json({ message: "Impossible de supprimer cette offre d'emploi." });
    }
};

// 🏢 6. Valider ou révoquer le statut certifié d'une entreprise recruteur
exports.toggleCompanyVerification = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // status vaudra 1 pour valider, 0 pour annuler

    try {
        await db.execute(
            "UPDATE users SET is_verified_company = ? WHERE id = ? AND role = 'recruiter'", 
            [status, id]
        );
        
        const msg = status === 1 ? "Entreprise certifiée avec succès !" : "Certification révoquée.";
        return res.status(200).json({ message: msg });
    } catch (error) {
        console.error("❌ Erreur validation entreprise :", error);
        return res.status(500).json({ message: "Impossible de modifier le statut de l'entreprise." });
    }
};

// 🔄 7. Mettre à jour les informations d'un utilisateur par l'Admin
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, phone, address, company_name, company_bio, password, last_ip } = req.body;

    try {
        let query = `
            UPDATE users 
            SET name = ?, email = ?, role = ?, phone = ?, address = ?, company_name = ?, company_bio = ?, last_ip = ?
        `;
        let params = [name, email, role, phone, address, company_name, company_bio, last_ip];

        // Si un nouveau mot de passe est fourni, on le hache avant de l'enregistrer
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += `, password = ?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        await db.execute(query, params);

        // Récupérer l'utilisateur mis à jour pour le renvoyer au frontend
        const [rows] = await db.execute(
            "SELECT id, name, email, role, phone, address, company_name, company_bio, company_logo, is_verified, is_verified_company, created_at, last_ip FROM users WHERE id = ?", 
            [id]
        );

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("❌ Erreur mise à jour utilisateur admin :", error);
        return res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur." });
    }
};

// 🔄 8. Mettre à jour les informations d'une offre d'emploi par l'Admin
exports.updateJob = async (req, res) => {
    const { id } = req.params;
    let {
        title, contract_type, location, workplace_type, salary, experience_level,
        company_desc, missions_desc, profile_desc, benefits_desc, status,
        has_quiz, expires_at, skills_desc, languages_desc
    } = req.body;

    // Validate ENUM fields to prevent SQL errors
    contract_type = validateEnum(contract_type, CONTRACT_TYPES, 'CDI'); // Default to CDI
    workplace_type = validateEnum(workplace_type, WORKPLACE_TYPES, 'Présentiel'); // Default to Présentiel
    experience_level = validateEnum(experience_level, EXPERIENCE_LEVELS, 'Junior (0-2 ans)'); // Default to Junior
    status = validateEnum(status, JOB_STATUSES, 'disponible'); // Default to disponible
    

    try {
        // 🛠️ FIX Date & Enums : Empêche le crash SQL si la date est vide ou si des champs obligatoires manquent
        const finalExpiresAt = (expires_at && expires_at.trim() !== "") ? expires_at : null;

        const query = `
            UPDATE jobs 
            SET 
                title = ?, contract_type = ?, location = ?, workplace_type = ?, salary = ?, 
                experience_level = ?, company_desc = ?, missions_desc = ?, profile_desc = ?, 
                benefits_desc = ?, status = ?, has_quiz = ?, expires_at = ?, 
                skills_desc = ?, languages_desc = ?
            WHERE id = ?
        `;
        const params = [
            title || '', contract_type, location || '', workplace_type, salary, experience_level,
            company_desc, missions_desc || '', profile_desc || '', benefits_desc, status, // Use validated status
            has_quiz ? 1 : 0, finalExpiresAt, skills_desc, languages_desc, id
        ];

        await db.execute(query, params);

        // Pour renvoyer l'offre mise à jour, on peut réutiliser getAllJobs ou faire une sélection spécifique
        const [updatedJob] = await db.execute("SELECT * FROM jobs WHERE id = ?", [id]);
        return res.status(200).json(updatedJob[0]);
    } catch (error) {
        console.error("❌ Erreur mise à jour offre d'emploi admin :", error);
        return res.status(500).json({ message: "Erreur lors de la mise à jour de l'offre d'emploi." });
    }
};

// Helper function to validate ENUMs
const validateEnum = (value, allowedValues, defaultValue) => {
    if (value && allowedValues.includes(value)) {
        return value;
    }
    return defaultValue;
};
