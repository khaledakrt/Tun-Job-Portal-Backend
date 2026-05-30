const db = require('../../config/db');

// 📊 5. Récupérer toutes les candidatures pour modération admin
exports.getAllApplications = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id, a.status, a.applied_at,
                u.name AS candidate_name, u.company_logo AS candidate_avatar,
                j.title AS job_title
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            JOIN jobs j ON a.job_id = j.id
            ORDER BY a.applied_at DESC
        `;
        const [rows] = await db.execute(query);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("❌ Erreur liste candidatures admin :", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des candidatures." });
    }
};

// 🗑️ 7. Supprimer une candidature non conforme
exports.deleteApplication = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("DELETE FROM applications WHERE id = ?", [id]);
        return res.status(200).json({ message: "Candidature supprimée avec succès." });
    } catch (error) {
        console.error("❌ Erreur suppression candidature admin :", error);
        return res.status(500).json({ message: "Impossible de supprimer la candidature." });
    }
};

// 🔄 11. Mettre à jour le statut d'une candidature par l'Admin
exports.updateApplication = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.execute("UPDATE applications SET status = ? WHERE id = ?", [status, id]);

        // Récupérer la candidature mise à jour avec les jointures pour le frontend
        const query = `
            SELECT 
                a.id, a.status, a.applied_at,
                u.name AS candidate_name, u.company_logo AS candidate_avatar,
                j.title AS job_title
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ?
            LIMIT 1
        `;
        const [rows] = await db.execute(query, [id]);
        
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("❌ Erreur mise à jour candidature admin :", error);
        return res.status(500).json({ message: "Erreur lors de la mise à jour de la candidature." });
    }
};