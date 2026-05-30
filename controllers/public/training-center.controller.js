const db = require('../../config/db');

// 🎓 Récupérer la liste des centres de formation vérifiés
exports.getAllTrainingCenters = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, company_name as name, company_bio, company_logo, address, email, phone 
            FROM users 
            WHERE role = 'training_center' AND is_verified_company = 1
            ORDER BY company_name ASC
        `);
        return res.status(200).json({ centers: rows });
    } catch (error) {
        console.error("❌ Erreur centres de formation :", error.message);
        return res.status(500).json({ message: "Erreur lors de la récupération des centres." });
    }
};