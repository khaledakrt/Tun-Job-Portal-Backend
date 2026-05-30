// 🚀 IMPORTATION OBLIGATOIRE DE LA CONNEXION MYSQL POUR ÉVITER LE CRASH 500
const db = require('../../config/db'); 

// // SAUVEGARDE DU COMPTE RENDU CV (CRÉATION / MODIFICATION)
exports.saveCV = async (req, res) => {
    const { title, summary, skills, interests, experience, education } = req.body;
    const candidate_id = req.user && req.user.id ? req.user.id : null;

    if (!candidate_id) {
        return res.status(401).json({ message: "Action non autorisée." });
    }

    try {
        // 1. On vérifie si un CV existe déjà pour ce candidat
        const [existingCV] = await db.execute('SELECT id FROM cvs WHERE candidate_id = ?', [candidate_id]);

        if (existingCV.length > 0) {
            // 2. Si le CV existe, on exécute une requête UPDATE classique
            const updateQuery = `
                UPDATE cvs 
                SET title = ?, summary = ?, skills = ?, interests = ?, experience = ?, education = ?
                WHERE candidate_id = ?
            `;
            await db.execute(updateQuery, [title, summary, skills, interests, experience, education, candidate_id]);
        } else {
            // 3. Si aucun CV n'existe, on exécute une requête INSERT standard
            const insertQuery = `
                INSERT INTO cvs (candidate_id, title, summary, skills, interests, experience, education)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            await db.execute(insertQuery, [candidate_id, title, summary, skills, interests, experience, education]);
        }

        return res.status(200).json({ message: "CV enregistré avec succès !" });

    } catch (e) {
        console.error("❌ Erreur MySQL interceptée dans saveCV :", e.message);
        return res.status(500).json({ error: e.message });
    }
};

// // LECTURE DU CV AU CHARGEMENT DE LA PAGE
// // LECTURE DU CV AU CHARGEMENT DE LA PAGE
exports.getCVDetails = async (req, res) => {
    const candidate_id = req.user && req.user.id ? req.user.id : null;

    if (!candidate_id) {
        return res.status(401).json({ message: "Action non autorisée." });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM cvs WHERE candidate_id = ?', [candidate_id]);
        
        // Sécurité : Si aucun CV n'est trouvé, on renvoie une structure vide propre pour Angular au lieu d'un crash 404
        if (rows.length === 0) { 
            return res.status(200).json({ 
                title: '', 
                summary: '', 
                skills: '', 
                interests: '', 
                experience: '[]', 
                education: '[]' 
            }); 
        }
        
        // 🚀 RECTIFICATION VISUELLE ESSENTIELLE : Retour de l'objet unique indexé rows[0]
        return res.status(200).json(rows[0]);

    } catch (e) {
        console.error("❌ Erreur MySQL getCVDetails :", e.message);
        return res.status(500).json({ error: e.message });
    }
};

exports.uploadCvPdf = async (req, res) => {
    const candidate_id = req.user?.id;
    if (!candidate_id) {
        return res.status(401).json({ message: 'Action non autorisée.' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier PDF reçu.' });
    }

    try {
        const [existing] = await db.execute('SELECT id FROM cvs WHERE candidate_id = ?', [candidate_id]);
        if (existing.length > 0) {
            await db.execute('UPDATE cvs SET cv_pdf = ? WHERE candidate_id = ?', [
                req.file.filename,
                candidate_id,
            ]);
        } else {
            await db.execute(
                'INSERT INTO cvs (candidate_id, cv_pdf, title, summary) VALUES (?, ?, ?, ?)',
                [candidate_id, req.file.filename, 'CV PDF', '']
            );
        }
        return res.status(200).json({
            message: 'CV PDF téléversé avec succès.',
            filename: req.file.filename,
            url: `/cv_files/${req.file.filename}`,
        });
    } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({
                message: 'Colonne cv_pdf absente. Exécutez database/migrations/002_cv_pdf.sql',
            });
        }
        return res.status(500).json({ error: e.message });
    }
};

